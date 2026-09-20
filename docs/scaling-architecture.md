# RALOA Architecture: Horizontal Scaling Roadmap & Single-Node Constraints

## 1. Executive Summary

RALOA currently operates as an efficient, highly optimized **single-node monolith**:
- **Database**: Local SQLite with Write-Ahead Logging (`better-sqlite3`).
- **Media & File Storage**: Local persistent disk storage (`public/uploads`).
- **Rate Limiting**: In-memory sliding window + SQLite event table (`rate_limit_events`).
- **Analytics & Observability**: In-memory event buffers flushed periodically to SQLite.
- **Caching**: Process-local in-memory Map (`publicProfileCache`).
- **Schedulers**: In-process `setInterval` for retention cleanup and Instagram media synchronization.

This single-node architecture delivers sub-millisecond local reads, zero external infrastructure dependencies, and low operational overhead. However, running multiple application instances (e.g. multi-replica Kubernetes pods, Docker Compose replicas > 1, or multi-server load-balanced clusters) against this setup will cause state desynchronization, file loss, and database corruption.

The system explicitly reports:
```json
{
  "supportsHorizontalScaling": false
}
```
Production startup safeguards strictly reject multi-instance deployment until the shared backing services detailed below are provisioned.

---

## 2. Components That Block Multi-Instance Deployment Today

### 2.1 SQLite Single-Process Writes
- **Current Behavior**: `better-sqlite3` uses synchronous, exclusive POSIX file locks on the `.sqlite` and WAL files.
- **Failure Mode under Multi-Instance**: If multiple processes or separate container nodes mount the same SQLite file over NFS/EFS or SMB, SQLite WAL locks fail, transactions fail with `SQLITE_BUSY`, and concurrent writes risk silent database corruption.

### 2.2 Local Filesystem Uploads
- **Current Behavior**: Avatars, banner backgrounds, and downloadable product files are written via `fs.promises.writeFile` directly to `public/uploads` on the local container/VM volume.
- **Failure Mode under Multi-Instance**: A user uploading an avatar on Node A will find their file missing when a subsequent request is routed by the reverse proxy to Node B (resulting in HTTP 404).

### 2.3 Process-Local Rate Limiting
- **Current Behavior**: `server/middleware/rateLimit.ts` uses an in-memory `Map<string, RateLimitBucket>` combined with SQLite writes to `rate_limit_events`.
- **Failure Mode under Multi-Instance**: Rate limits are split across nodes (e.g. 5 requests to Node A and 5 requests to Node B allow an attacker 10 requests instead of the intended limit of 5). Furthermore, high-concurrency requests across multiple nodes will generate severe write lock contention on the single SQLite database.

### 2.4 In-Process Schedulers
- **Current Behavior**: `startMaintenanceScheduler()` and `startInstagramSyncScheduler()` run in-process using `setInterval()`.
- **Failure Mode under Multi-Instance**: If 4 nodes are running, all 4 nodes will execute retention purges, backup archives, and Instagram API syncs simultaneously, causing race conditions, duplicate operations, and rapid exhaustion of third-party API rate limits.

### 2.5 In-Memory Analytics & Event Buffers
- **Current Behavior**: Page views and link clicks are held in process-local buffers (`clickBuffer` and `viewBuffer` in `server/routes/analytics.ts`) and flushed to SQLite in batches.
- **Failure Mode under Multi-Instance**: Autoscaling node termination or sudden worker restart loses un-flushed events. Concurrent batch inserts from multiple nodes cause lock contention on SQLite.

### 2.6 Process-Local Profile Cache
- **Current Behavior**: `publicProfileCache` in `server/routes/profiles.ts` holds assembled profile payloads in a process-local `Map`.
- **Failure Mode under Multi-Instance**: When a creator updates a link on Node A, `invalidatePublicProfileCache()` purges the cache on Node A only. Node B continues serving stale cached data until its local TTL expires.

### 2.7 Webhook Deduplication Invariants
- **Current Behavior**: Stripe webhook deduplication checks `processed_webhook_events` in SQLite.
- **Failure Mode under Multi-Instance**: Under concurrent retries or network spikes, simultaneous webhook deliveries routed to different nodes can create race conditions unless transactions are coordinated in a distributed ACID store.

---

## 3. Architectural Abstraction Boundaries

To prepare for future migration without prematurely abandoning SQLite, RALOA defines infrastructure interfaces in [`server/infrastructure/interfaces.ts`](file:///Users/samirmagdy/Downloads/liinx-_-design-first-link-in-bio/server/infrastructure/interfaces.ts):

| Interface | Active Single-Node Implementation | Future Distributed Implementation |
| :--- | :--- | :--- |
| `DatabaseAdapter` | `SqliteDatabaseAdapter` (`better-sqlite3`) | `PostgresDatabaseAdapter` (`pg` / `kysely` / `prisma`) |
| `ObjectStorage` | `LocalFileObjectStorage` (`public/uploads`) | `S3ObjectStorage` (AWS S3, Cloudflare R2, GCS) |
| `RateLimitStore` | `MemoryRateLimitStore` (in-memory + SQLite) | `RedisRateLimitStore` (Redis sliding window / token bucket) |
| `EventStore` | `MemoryBufferedEventStore` (in-memory arrays) | `QueueEventStore` (Redis Stream / SQS / Kafka) |
| `JobScheduler` | `InProcessJobScheduler` (`setInterval`) | `DistributedJobScheduler` (BullMQ, pg-boss, or leader election) |
| `CacheStore` | `MemoryCacheStore` (in-memory Map) | `RedisCacheStore` (Redis with pub/sub cache invalidation) |

---

## 4. Recommended Migration Path to Horizontal Scale

When user traffic or high-availability requirements justify multi-node infrastructure, follow this sequential migration order:

### Phase 1: Shared Object Storage
- **Action**: Provision an S3-compatible bucket (e.g. Cloudflare R2 with custom domain or AWS S3 + CloudFront).
- **Implementation**: Implement `ObjectStorage` using `@aws-sdk/client-s3`.
- **Migration**: Sync existing `public/uploads` assets to the bucket; update asset URLs to the CDN origin.

### Phase 2: Distributed Caching & Rate Limiting (Redis)
- **Action**: Provision a managed Redis or Valkey cluster (e.g. AWS ElastiCache or Upstash).
- **Implementation**:
  - Implement `RateLimitStore` using Redis `MULTI` / Lua sliding-window scripts.
  - Implement `CacheStore` with Redis and Redis Pub/Sub for cross-node cache invalidation.

### Phase 3: Relational Database Migration (PostgreSQL)
- **Action**: Provision managed PostgreSQL (e.g. Supabase, AWS RDS, or Neon) with PgBouncer connection pooling.
- **Implementation**:
  - Run schema migration converting SQLite schemas to PostgreSQL (JSONB for `extra_json`, `socials_json`, etc.).
  - Implement `PostgresDatabaseAdapter` conforming to `DatabaseAdapter`.
  - Migrate data using `pgloader` or an ETL script.

### Phase 4: Distributed Job Scheduler
- **Action**: Migrate in-process schedulers to BullMQ or pg-boss.
- **Implementation**: Enforce single-worker execution for background maintenance and Instagram sync jobs using distributed locks (`redlock` or advisory locks).

### Phase 5: Enable Horizontal Scaling
- Update `supportsHorizontalScaling` to `true` in [`server/infrastructure/safeguards.ts`](file:///Users/samirmagdy/Downloads/liinx-_-design-first-link-in-bio/server/infrastructure/safeguards.ts).
- Deploy multiple application replicas behind a load balancer (ALB, Cloudflare, or Nginx).
