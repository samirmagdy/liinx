/**
 * Architectural Interfaces for Infrastructure Decoupling
 *
 * These interfaces decouple the core application from single-node in-process
 * primitives (SQLite, local disk, in-memory rate limiting, in-process schedulers)
 * so future distributed providers (PostgreSQL, S3, Redis, BullMQ) can be plugged in
 * without rewriting business logic.
 */

export interface DatabaseHealthResult {
  healthy: boolean;
  engine: 'sqlite' | 'postgres' | 'other';
  error?: string;
  latencyMs?: number;
}

export interface DatabaseAdapter {
  readonly engine: 'sqlite' | 'postgres';
  query<T = unknown>(sql: string, params?: unknown[]): T[];
  queryOne<T = unknown>(sql: string, params?: unknown[]): T | undefined;
  execute(sql: string, params?: unknown[]): { changes: number; lastInsertRowid?: number | bigint };
  transaction<T>(fn: () => T): T;
  healthCheck(): DatabaseHealthResult;
  close(): void;
}

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  resetMs: number;
}

export interface RateLimitStore {
  readonly name: string;
  checkAndIncrement(key: string, limit: number, windowMs: number): Promise<RateLimitResult> | RateLimitResult;
  reset?(key?: string): Promise<void> | void;
}

export interface StorageUploadOptions {
  mimeType: string;
  originalFilename?: string;
  visibility?: 'public' | 'private';
  contentDisposition?: 'inline' | 'attachment';
  cacheControl?: string;
}

export interface StoredObject {
  key: string;
  url: string;
  sizeBytes: number;
  mimeType: string;
}

export interface ObjectStorage {
  readonly provider: 'local-fs' | 's3' | 'gcs';
  put(key: string, data: Buffer, options: StorageUploadOptions): Promise<StoredObject>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  getUrl(key: string): string;
  healthCheck?(): Promise<boolean>;
}

export interface ClickEvent {
  id: string;
  blockId: string;
  profileId: string;
  targetUrl: string;
  ipHash: string;
  referrer: string;
  userAgent: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  pageId?: string | null;
  dedupeKey?: string | null;
  createdAt: number;
}

export interface ViewEvent {
  id: string;
  profileId: string;
  ipHash: string;
  referrer: string;
  userAgent: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  pageId?: string | null;
  dedupeKey?: string | null;
  createdAt: number;
}

export interface AnalyticsEventStore {
  readonly name: string;
  recordClick(click: ClickEvent): Promise<void> | void;
  recordView(view: ViewEvent): Promise<void> | void;
  flush(): Promise<void> | void;
}

/** @deprecated Use AnalyticsEventStore for new integrations. */
export type EventStore = AnalyticsEventStore;

export interface ScheduledJob {
  name: string;
  intervalMs: number;
  run: () => Promise<void> | void;
}

export interface JobScheduler {
  readonly name: string;
  register(job: ScheduledJob): void;
  start(): void;
  stop(): void;
}

export interface CacheStore<T = unknown> {
  readonly name: string;
  get(key: string): Promise<T | null> | (T | null);
  set(key: string, value: T, ttlMs?: number): Promise<void> | void;
  delete(key: string): Promise<void> | void;
  clear(): Promise<void> | void;
}
