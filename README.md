# LIINX — Design-First Link-in-Bio Platform

A production-oriented, design-first link-in-bio platform. Core creator workflows use real persistence, authentication, media blocks, redirects, newsletters, analytics, and Stripe integration. Marketing previews and seeded demo content are separate from user-owned production data.

---

## Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion (Framer Motion), Lucide Icons, Wouter router.
- **Backend API**: Node.js & Express with TypeScript (`tsx`), Zod schema validation, Multer multipart uploads.
- **Database Engine**: `better-sqlite3` configured with **Write-Ahead Logging (WAL)**, foreign key constraints, synchronous normal writes, and a 64MB memory page cache.
- **Security & Auth**: `bcryptjs` password hashing with salts, stateless JSON Web Tokens (JWT), BOLA/IDOR protection, and URL scheme sanitization.
- **Concurrency & Performance**: High socket backlog (4096), non-blocking asynchronous click/view batch queue with bulk transaction commits, and multi-core Node.js cluster mode.
- **Testing**: Comprehensive Vitest suite with **175 real tests across 20 suites** covering OWASP Top 10 Security, concurrency race conditions, E2E creator journeys, SQLite disk integrity, and acceptance tests for every advertised feature.

---

## 0% Fake Implementation Feature Matrix

| Feature Area | Production Implementation Details |
| :--- | :--- |
| **Authentication** | Real `bcrypt` password hashing, stateless JWT session tokens, username availability verification, protected routes. |
| **Block Types** | **Custom Links**, **Headers**, **Audio Players** (audio URL, artist, cover art), **Video Players** (embed URL, thumbnail), **Collapsible Link Folders** (nested items), and **Newsletters**. |
| **Live Drag/Reorder** | Reorder blocks with atomic batch updates to database positions (`0, 1, 2, ...`). |
| **Dynamic Themes** | 7 pre-built designer themes + real-time custom palette JSON generator. |
| **Click & View Engine** | `GET /r/:blockId` 302 redirector with URL scheme sanitization, IP hashing (privacy-preserving SHA-256), and referrers. |
| **Live Analytics** | Real computed 30-day views, unique visitors, total clicks, CTR, top performing links, and an interactive 7-day timeline. |
| **Lead Capture & Export**| Instant newsletter subscription with duplicate handling and **1-click CSV export**. |
| **Media Uploads** | File upload endpoint with MIME-type verification, 5MB size limits, and disk storage. |
| **Observability** | Request correlation IDs (`X-Request-Id`), execution duration (`X-Response-Time`), and detailed `/api/health` diagnostics. |

---

## Getting Started

### Prerequisites
- **Node.js**: v22.x or higher
- **npm**: v10.x or higher

### 1. Installation
```bash
git clone <repo-url> liinx
cd liinx
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and replace every `YOUR_` / `REPLACE_WITH_` placeholder:
```bash
cp .env.example .env
```
Key configuration parameters:
- `PORT`: HTTP port to bind (Docker/Fly default: `3000`; development fallback: `3050`)
- `NODE_ENV`: `development` or `production`
- `JWT_SECRET`: Secret key for signing user sessions (minimum 32 characters)
- `CLUSTER`: Set to `true` to enable multi-core cluster mode across all CPU cores
- `APP_ORIGIN`: Canonical public HTTPS origin used by billing redirects
- `CORS_ORIGIN`: Comma-separated allowed browser origins; do not use `*` for authenticated deployments
- `INTEGRATION_ENCRYPTION_KEY`: Separate 32-byte key used to encrypt OAuth tokens at rest
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and configured Stripe Price IDs for billing

### 3. Running in Development
Starts the Express server with Vite middleware hot-module reloading:
```bash
npm run dev
```
Open [http://localhost:3050](http://localhost:3050) in your browser when `PORT` is not set.

### 4. Running in Production
```bash
npm run build
npm start
```

Production startup rejects missing or placeholder security, HTTPS origin,
encryption, and billing configuration. To launch without paid plans, set
`BILLING_ENABLED=false` explicitly.

---

## Docker & Container Deployment

LIINX includes a production-grade multi-stage `Dockerfile` and `docker-compose.yml` with persistent volumes for SQLite and uploaded media:

```bash
# Build and run containerized application
docker compose up -d --build

# Inspect logs
docker compose logs -f

# Verify container healthcheck
docker compose ps
```

The database persists in `./data/liinx.db` and uploaded images persist in `./public/uploads`. Fly uses separate persistent volumes for both paths; do not run more than one SQLite machine against the same logical database without a database migration.

### Vercel + Fly deployment

The Vercel project is the frontend shell. `vercel.json` proxies `/api/*`, `/uploads/*`, `/robots.txt`, and `/sitemap.xml` to the Fly backend at `liinx-app.fly.dev`; the Fly deployment owns Express, SQLite, and uploaded media. Set the backend `APP_ORIGIN`/`CORS_ORIGIN` to the public frontend origin and configure all required secrets before deploying:

```bash
fly secrets set \
  JWT_SECRET="REPLACE_WITH_RANDOM_48_BYTE_SECRET" \
  INTEGRATION_ENCRYPTION_KEY="REPLACE_WITH_64_HEX_CHARACTERS" \
  APP_ORIGIN="https://YOUR_PUBLIC_DOMAIN.example" \
  CORS_ORIGIN="https://YOUR_PUBLIC_DOMAIN.example" \
  STRIPE_SECRET_KEY="REPLACE_WITH_STRIPE_LIVE_SECRET_KEY" \
  STRIPE_WEBHOOK_SECRET="REPLACE_WITH_STRIPE_LIVE_WEBHOOK_SECRET"
```

Do not deploy SQLite or local uploads as the primary data store on a serverless-only host.

---

## Database Management & Zero-Downtime Backups

The SQLite database runs in **Write-Ahead Logging (WAL)** mode. To take a safe, point-in-time snapshot without taking the server offline:

```bash
npm run db:backup
```

- Uses SQLite's non-blocking `VACUUM INTO` command.
- Runs `PRAGMA integrity_check` on the resulting backup to guarantee validity.
- Automatically prunes older backups, retaining the 10 most recent snapshots in `data/backups/`.

Upload media is backed up separately with `npm run uploads:backup`. Schedule both backup commands daily and copy their output to encrypted off-host storage. See [OPERATIONS.md](OPERATIONS.md) for retention, restore, monitoring, Stripe alerts, and rollback procedures.

---

## REST API Reference

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/health` | None | Service liveness, uptime, memory, and database status |
| `GET` | `/api/ready` | None | Readiness: database connected and uploads volume writable |
| `GET` | `/api/auth/check-username/:username` | None | Check availability of username |
| `POST`| `/api/auth/register` | None | Register new creator user and initial profile |
| `POST`| `/api/auth/login` | None | Authenticate user and receive JWT bearer token |
| `GET` | `/api/auth/me` | Bearer | Inspect current user session and profile data |
| `GET` | `/api/profiles/:username` | None | Public creator profile, bio, socials, and blocks |
| `PUT` | `/api/studio/profile` | Bearer | Update profile identity, theme, socials, and bio |
| `POST`| `/api/studio/blocks` | Bearer | Create a new block (link, header, audio, video, etc.) |
| `PUT` | `/api/studio/blocks/:id` | Bearer | Update an existing block |
| `DELETE`|`/api/studio/blocks/:id` | Bearer | Delete a block |
| `PUT` | `/api/studio/blocks/reorder` | Bearer | Atomic array reordering of blocks |
| `GET` | `/r/:blockId` | None | Public link redirector (HTTP 302) with click logging |
| `POST`| `/api/analytics/view` | None | Log a page view for a profile |
| `GET` | `/api/analytics/stats` | Bearer | Fetch calculated 30-day metrics, CTR, and timeline |
| `POST`| `/api/newsletter/subscribe`| None | Subscribe email to creator's newsletter |
| `GET` | `/api/newsletter/unsubscribe?token=...` | Token | Remove a subscriber using their private unsubscribe link |
| `GET` | `/api/studio/subscribers` | Bearer | Get subscriber list for Studio dashboard |
| `GET` | `/api/studio/subscribers/export` | Bearer | Export subscriber list as RFC-compliant CSV |
| `POST`| `/api/upload` | Bearer | Upload avatar or block cover image (multipart) |

---

## Automated Test Suites

Run the full automated test suite with:

```bash
npm test
```

### Test Coverage (175 Tests Across 20 Suites):
1. **OWASP Top 10 Security (`tests/security.test.ts`)**: BOLA/IDOR protection, multi-tenant isolation, SQL injection vectors, dangerous URI schemes (`javascript:`, `data:`), JWT signature tampering, payload bombing.
2. **Concurrency & Race Conditions (`tests/concurrency.test.ts`)**: Simultaneous duplicate registration races, concurrent newsletter subscriptions, rapid block reordering stability.
3. **End-to-End Creator Journey (`tests/e2e-workflow.test.ts`)**: Full organic lifecycle from landing page, registration, block creation, public view, 302 redirect click, newsletter capture, to analytics inspection.
4. **Resilience & Data Integrity (`tests/resilience.test.ts`)**: Corrupted JSON recovery, invalid block type rejection, missing target handling, disk `PRAGMA integrity_check`, and zero-downtime backup snapshots.
5. **Core API Integration (`tests/api.test.ts`)**: Full route validation for authentication, blocks, uploads, and analytics.
6. **Acceptance Tests (`tests/acceptance.test.ts`)**: Every advertised feature end-to-end — CSV export, video/folder block lifecycle, OWASP security headers, X-Request-Id / X-Response-Time observability, duplicate subscription idempotency, plan tier validation, and health diagnostics schema.
7. **Booking / Calendly (`tests/booking.test.ts`)**: URL validation, block persistence, IDOR rejection.
8. **Media Embeds (`tests/embeds_and_branding.test.ts`)**: Spotify, YouTube, Vimeo, SoundCloud, Apple Music embed generation.
9. **Instagram Caption Sync (`tests/instagram-sync.test.ts`)**: Link extraction, DB deduplication, Meta webhook signature verification.
10. **Custom Domains (`tests/custom_domain.test.ts`)**: Plan-gated attachment, DNS CNAME verification, host-header routing.
11. **UTM & Tracking Pixels (`tests/utm_and_pixels.test.ts`)**: GA4 / Meta Pixel ID persistence, UTM campaign stats.
12. **Multi-Profile (`tests/multiprofile.test.ts`)**: Per-plan limits, profile switching, IDOR prevention.
13. **Custom CSS & Font (`tests/custom_css_font.test.ts`)**: Studio/public endpoint propagation.
14. **Link Scheduling (`tests/scheduling.test.ts`)**: Future and expired link filtering from public API.
15. **Linktree Importer (`tests/importer.test.ts`)**: SSRF blocking, Next.js JSON extraction, OpenGraph fallback.
16. **Public REST API v1 (`tests/api_v1.test.ts`)**: API key lifecycle, Studio-tier gating.

---

## Performance claims

Performance depends on deployment provider, database volume, media storage, traffic mix, and proxy configuration. Run an environment-specific load test before publishing benchmark numbers. The backup command verifies SQLite integrity for the generated snapshot.
