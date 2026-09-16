# Liinx quality ledger

## Task 01 — Repository baseline and evidence ledger

Status: VERIFIED WITHIN SCOPE

Baseline recorded: 2026-09-16 (Asia/Riyadh)

- Repository: `samirmagdy/liinx`
- Remote default branch: `origin/main`
- Branch changed: `main`
- HEAD and remote default SHA: `55a62740b46bc4551938c62536593e6aca6da24d`
- Prior review hypothesis checked: `1ef7a3d0c38e5a699840f32023b30ef503bc7af5` (multi-page profile support)
- Working tree was already dirty. Preserved without reset or checkout:
  `src/App.tsx`, `src/components/BuilderStudio.tsx`,
  `src/components/PhonePreview.tsx`, `src/components/PublicBioView.tsx`,
  `src/utils/colorContrast.ts`, and untracked `.playwright-mcp/`.
- No root `AGENTS.md`, `CLAUDE.md`, or other repository instruction file was found.
- No prior `docs/liinx-quality-ledger.md` existed; this file is the only change made for Task 01.

### Validation environment

Disposable paths used for validation (outside the repository):

- SQLite: `/tmp/liinx-task-01-db/liinx.db`
- Uploads: `/tmp/liinx-task-01-uploads`
- Environment: `NODE_ENV=test`, `DATABASE_PATH` and `UPLOADS_DIR` set to the paths above.

The isolated database initialized successfully, used SQLite WAL mode, and returned `PRAGMA integrity_check = ok`. The test run created three fixture uploads in the isolated uploads directory. Repository `data/` and `public/uploads/` were not used as test targets.

### Public route inventory

Client routes in `src/App.tsx`:

- `/`, `/features`, `/templates`, `/pricing`, `/about`, `/contact`, `/privacy`, `/terms`
- `/login`, `/register`, `/studio`
- `/@:username`, `/@:username/:pageSlug`
- `/:username`, `/:username/:pageSlug` (reserved-name guard routes reserved names back to the home page)

Server-rendered/public infrastructure:

- `/robots.txt`, `/sitemap.xml`
- `/uploads/*` static media
- `/r/:blockId` public redirect and click logging
- custom-domain root and one-segment page routing through verified domains
- production SPA fallback and profile metadata shell

Public API/visitor routes include username availability, public profile lookup, custom-domain lookup, analytics view logging, newsletter subscribe/unsubscribe, form submit, content-gate verification, Instagram webhook verification/receive, health, and the link redirector. Exact API paths are listed below.

### Studio tabs and creator controls

`BuilderStudio` has four tabs, all wired to visible content and API-backed behavior:

- `content`: profile identity/socials, page manager, booking, add-block menu, import, editing and reorder
- `appearance`: theme, background media, typography/custom CSS, and preview controls
- `analytics`: computed metrics/timeline/referrers/UTM data
- `settings`: plan/billing, tracking IDs, custom domain, sharing metadata, branding, subscribers/forms, API keys, Instagram integration, profile duplication/switching

### Block catalogue

The shared `BlockType` union and creator add menu currently contain:

`booking`, `link`, `header`, `audio`, `video`, `folder`, `newsletter`, `instagram_grid`, `rich_text`, `image`, `gallery`, `spacer`, `carousel`, `form`, `download`, `map`, `faq`, `testimonials`, `event`, `presave`, `phone`, `product`, `tips`, and `content_gate`.

The first seven have dedicated editor/rendering paths; the advanced types use `extra_json` contracts and type-specific editor/rendering branches. Their presence is implementation evidence, not external-provider or full browser-journey evidence. `instagram_grid` exists in shared types/mock data but is not exposed by the current creator add menu; its live integration is represented by the Instagram settings flow instead.

### API inventory

Mounted route groups and current endpoints:

- Auth (`/api/auth`): `GET /check-username/:username`, `POST /register`, `POST /login`, `POST /logout`, `GET /me`, `DELETE /account`
- Profiles/studio (`/api`): `GET /profiles/:username`, `GET /profiles/by-domain/:domain`, `GET /studio/profile`, `PUT /studio/profile`, `POST /studio/custom-domain/verify`, `PUT /studio/plan`, `GET/POST /studio/profiles`, `POST /studio/profiles/:id/select`
- Pages/studio (`/api`): `GET/POST /studio/pages`, `PUT /studio/pages/reorder`, `PUT/DELETE /studio/pages/:id`
- Blocks (`/api`): `POST /content-gates/verify`, `POST /studio/blocks`, `PUT /studio/blocks/reorder`, `PUT/DELETE /studio/blocks/:id`
- Analytics: `GET /r/:blockId`, `POST /api/analytics/view`, `GET /api/analytics/stats`
- Newsletter: `POST /api/newsletter/subscribe`, `GET /api/newsletter/unsubscribe`, `GET /api/studio/subscribers`, `GET /api/studio/subscribers/export`, `DELETE /api/studio/subscribers/:id`
- Uploads: `POST /api/upload`, `POST /api/upload/file`
- Forms: `POST /api/forms/submit`, `GET /api/studio/form-submissions`
- Importer: `POST /api/studio/import/preview`, `POST /api/studio/import/commit`
- Instagram: `GET /api/integrations/instagram/status`, `GET /api/integrations/instagram/auth-url`, `GET /api/integrations/instagram/callback`, `POST /api/integrations/instagram/sync`, `POST /api/integrations/instagram/test-caption`, `POST /api/integrations/instagram/toggle-auto`, `POST /api/integrations/instagram/disconnect`, `GET/POST /api/webhooks/instagram`
- Billing: `GET /api/billing/status`, `POST /api/billing/create-checkout-session`, `POST /api/billing/create-portal-session`, `POST /api/billing/webhook`
- Contact/support: `POST /api/contact`, `GET /api/support/inbox`
- Developer API key management: `GET/POST /api/studio/api-keys`, `DELETE /api/studio/api-keys/:id`
- Developer API v1: `GET /api/v1/profile`, `POST /api/v1/blocks`, `DELETE /api/v1/blocks/:id`
- Diagnostics: `GET /api/health`; unknown `/api/*` returns JSON 404.

### Persistence inventory

SQLite tables created or migrated by `server/db.ts`:

`users`, `profiles`, `blocks`, `pages`, `link_clicks`, `profile_views`, `newsletter_subscribers`, `instagram_sync`, `uploaded_files`, `api_keys`, `processed_webhook_events`, `newsletter_consents`, `rate_limit_events`, `form_submissions`, `contact_messages`, and SQLite's internal `sqlite_sequence`.

Important observed invariants include foreign keys, unique usernames, unique profile/page slugs, page-home creation/legacy block assignment, ordered block/page indexes, hashed API keys, and WAL configuration. Migration code is idempotent in the tested fresh database; a separate production backup/restore drill remains operational work.

### Deployment targets and external providers

Deployment artifacts/targets:

- Vercel frontend shell/proxy (`vercel.json`)
- Fly.io backend `liinx-app` with persistent SQLite and upload volumes (`fly.toml`)
- Docker/Compose single-node deployment (`Dockerfile`, `docker-compose.yml`)
- Optional Caddy reverse proxy example (`Caddyfile`)

External providers/configuration points:

- Stripe Checkout, portal, webhooks, and subscription cancellation — credentials/sandbox not present; locally simulated/test-covered only
- Meta/Instagram Graph API OAuth, polling, and webhooks — test-caption and signature paths are covered; live OAuth/sync unverified and credentials absent
- Calendly — validated URL/embed integration; provider availability and appointment confirmation unverified
- Google Analytics 4 and Meta Pixel — IDs can be configured; external collection/consent behavior unverified
- Resend — contact notification is optional; no live key/notification delivery verified
- Sentry server/browser error reporting — optional DSNs absent; unverified
- Google Maps link, QRServer QR image generation, YouTube, Vimeo, Spotify, SoundCloud, Apple Music, TikTok — URL/embed or external-link behavior is local-code/test verified where covered; provider availability and third-party responses unverified
- DNS/TLS for custom domains — domain validation and host routing are locally tested; real DNS ownership, certificate issuance, and public proxy behavior unverified

### Feature inventory and evidence status

| Area | Status | Evidence / gap |
|---|---|---|
| Marketing pages, Arabic/English language shell | IMPLEMENTED | Source routes, translation/config files, build passed; browser RTL journey not run in this task |
| Authentication/session and account deletion | IMPLEMENTED / PARTIAL | API/session tests pass; account recovery/password reset is not present in the current route inventory |
| Profiles, multi-profile, page creation/edit/order/publish | IMPLEMENTED | `1ef7a3d` changes rechecked in current code; multiprofile, custom-domain, audit, and E2E tests pass |
| Link/header/audio/video/folder/newsletter/booking blocks | IMPLEMENTED | API/E2E/acceptance/booking/embed tests pass |
| Advanced blocks (rich text, image, gallery, carousel, spacer, form, download, map, FAQ, testimonials, event, presave, phone, product, tips, content gate) | PARTIAL | Add/edit/public branches and broad API fixture coverage exist; not every type has a dedicated browser or contract suite |
| Instagram grid/live Instagram integration | PARTIAL / EXTERNALLY UNVERIFIED | Local parser, DB, signature, and honest-unconfigured tests pass; Meta credentials/live provider not verified |
| Uploads and downloadable-file lifecycle | IMPLEMENTED LOCALLY | Security/E2E tests pass against isolated uploads; production storage durability/backup restore not verified |
| Analytics, UTM, redirect clicks, privacy hashing | IMPLEMENTED LOCALLY | Analytics and UTM tests pass; real traffic, retention, and scale behavior unverified |
| Newsletter/forms/contact/support | IMPLEMENTED LOCALLY | Persistence, validation, export, and submission tests pass; Resend delivery/admin operational setup unverified |
| Themes, background media, custom CSS/font, metadata/branding | PARTIAL | Source/build and relevant tests pass; current dirty theme changes are not a clean-branch browser regression result |
| Billing/entitlements | PARTIAL / EXTERNALLY UNVERIFIED | Local entitlement and failure tests pass; Stripe credentials, sandbox checkout/webhooks, and live plan transitions not verified |
| Custom domains/TLS | PARTIAL / EXTERNALLY UNVERIFIED | DNS lookup/host routing tests pass; actual DNS/TLS/proxy deployment not verified |
| Public REST API v1 | IMPLEMENTED LOCALLY | API-key lifecycle and endpoint tests pass; external consumer compatibility not verified |
| Password recovery, scheduled redirects, QR/contact sharing, public search | MISSING OR PARTIAL | No password-recovery route; scheduling and QR utilities exist; no dedicated public-search endpoint found; browser/provider evidence outstanding |
| Operations/backups/observability | PARTIAL | Health, headers, request IDs, backup scripts and integrity tests exist; off-host backup, alerting, restore drill, and production monitoring not run |

### Prior finding revalidation (`1ef7a3d`)

The multi-page changes are present on the current `55a6274` tree: `pages` persistence, home-page migration/creation, page-scoped blocks, studio page CRUD/reorder, public `@username/pageSlug` routing, metadata shell handling, and Vercel rewrites are all present. Current tests passed for page CRUD/public visibility and dynamic E2E flows. This confirms implementation/test evidence only; it does not prove browser behavior on a deployed Vercel/Fly environment.

### Existing test utilities and smallest regression cases

- Vitest global setup initializes SQLite via `tests/global-setup.ts`.
- `supertest` exercises the Express app through real route handlers and SQLite.
- Existing tests cover security, API, dynamic backend E2E, acceptance, resilience, concurrency, sessions, custom domains, multiprofile, scheduling, importer, media embeds, Instagram, UTM/pixels, and error handling.
- Existing isolated test environment is controlled by `DATABASE_PATH`, `UPLOADS_DIR`, and `NODE_ENV=test`; it should be retained for future tasks.
- Smallest useful future regressions: (1) page-scoped block isolation and unpublished-page 404, (2) legacy null `page_id` home assignment, (3) public content-gate redaction, (4) unauthorized cross-profile page/block/API-key access, (5) each newly changed block's create → persist → public render path, and (6) provider-unconfigured honest failure states.

### Task 01 acceptance criteria

- PASS — Remote default branch and exact SHA recorded: `origin/main` at `55a62740b46bc4551938c62536593e6aca6da24d`.
- PASS — Current repository instructions checked; no `AGENTS.md` or additional root instruction file exists.
- PASS — Existing dirty work recorded and preserved; no reset, checkout, merge, deployment, or external message performed.
- PASS — Public routes, studio tabs, block types, API endpoints, tables, deployment targets, and provider dependencies inventoried above.
- PASS — `1ef7a3d` findings revalidated against current code and tests.
- PASS — Isolated development database/uploads directory established and used.
- PASS — Typecheck completed successfully.
- PASS — Production build completed successfully; non-blocking Vite warning: one generated chunk exceeds 500 kB.
- PASS — Existing tests completed successfully: 23 test files, 189 tests passed.
- PASS — Smallest regression-test candidates and current test utilities identified.
- NOT RUN — Live browser journey, deployed target, real DNS/TLS, Stripe, Meta/Instagram, Resend, Sentry, analytics pixels, and media-provider checks; credentials/provider access were not available and are explicitly not inferred.

### Exact commands and outcomes

```text
git status --short --branch
git log -1 --oneline --decorate
git ls-remote --symref origin HEAD
git ls-remote origin refs/heads/main
```

PASS. Confirmed dirty `main`, HEAD `55a6274`, and matching remote SHA.

```text
DATABASE_PATH=/tmp/liinx-task-01-db/liinx.db \
UPLOADS_DIR=/tmp/liinx-task-01-uploads NODE_ENV=test npm run lint
```

PASS. `tsc --noEmit` exited 0.

```text
DATABASE_PATH=/tmp/liinx-task-01-db/liinx.db \
UPLOADS_DIR=/tmp/liinx-task-01-uploads NODE_ENV=test npm run build
```

PASS. Vite build and prerender exited 0; 10 routes prerendered. Non-failing chunk-size warning recorded above.

```text
DATABASE_PATH=/tmp/liinx-task-01-db/liinx.db \
UPLOADS_DIR=/tmp/liinx-task-01-uploads NODE_ENV=test npm test
```

PASS. 23/23 test files and 189/189 tests passed in 18.29s.

```text
node -e "... PRAGMA integrity_check / PRAGMA journal_mode ..."
```

PASS. Isolated DB returned `ok` and `wal`.

### Unresolved risks and dependencies

- The current working tree includes unrelated/pre-existing theme and preview edits; this baseline does not certify those edits on a clean branch.
- No browser automation or deployed-environment verification was run in Task 01.
- External provider credentials/sandbox access are absent, so all provider statuses remain externally unverified.
- The README claims “175 tests across 20 suites,” while the current run produced 189 tests across 23 files; README inventory is stale and should be reconciled in a later documentation/release task.
- No migration framework/version table exists; schema changes are startup-time/idempotent SQL in `server/db.ts`, which should be addressed under Task 04 rather than changed here.

### Next eligible prompt

`02 — Uploaded-file security`

## Task 02 — Uploaded-file security

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline commit: `55a62740b46bc4551938c62536593e6aca6da24d` on dirty `main`.

Changed files: `server/routes/upload.ts`, `server/server.ts`, `tests/audit_fixes.test.ts`, and this ledger.

### Behavior changed

- Document uploads classify PDF, ZIP, MP3, WAV, MP4, and safe TXT content from bytes. Original filenames and multipart MIME values no longer choose the persisted extension or response MIME.
- Document parser failures and the 25MB limit return clean 400 responses.
- Generated names remain random and normalized; writes use exclusive creation to avoid collisions.
- Both image and document persistence paths remove the just-written file if the database record cannot be inserted.
- `/uploads/:filename` replaced unrestricted static serving. It rejects traversal, directories, unknown content, and active legacy HTML/SVG. Matching images remain inline; recognized non-image files are attachments with byte-derived MIME, `nosniff`, and restrictive sandbox CSP.
- Existing stored images are not deleted. Valid raster assets continue to display; unsafe/unclassifiable legacy assets are refused rather than executed.

### Task 02 acceptance criteria

- PASS — Harmless HTML claiming `application/pdf` is rejected with 400; covered by existing and current audit/E2E tests.
- PASS — Valid image and PDF fixtures upload and download; image is `image/png`/`inline`, PDF is `application/pdf`/`attachment`.
- PASS — Oversized image upload fails cleanly with 400 and a 5MB message; document 25MB parser handling is explicit.
- NOT RUN — A genuinely truncated multipart transfer was not generated; network-level truncation remains unverified.
- PASS — Mismatched document extension is normalized from content (`document.html` containing PDF bytes becomes `.pdf`).
- PASS — Unauthorized upload returns 401.
- PASS — Unsupported executable/script/SVG payloads fail cleanly; active legacy HTML returns 404.
- PASS — Uploaded active content cannot execute through `/uploads`; recognized non-image content is attachment-only with sandbox CSP.
- PASS — Simulated SQLite persistence failure leaves no uploaded-file orphan.
- NOT RUN — Real browser navigation and deployed Vercel/Fly/custom-domain asset behavior were not verified.

### Exact validation commands and outcomes

```text
DATABASE_PATH=/tmp/liinx-task-02-final-db/liinx.db \
UPLOADS_DIR=/tmp/liinx-task-02-final-uploads NODE_ENV=test npm run lint
```

PASS. `tsc --noEmit` exited 0.

```text
DATABASE_PATH=/tmp/liinx-task-02-final-db/liinx.db \
UPLOADS_DIR=/tmp/liinx-task-02-final-uploads NODE_ENV=test \
npx vitest run tests/audit_fixes.test.ts tests/security.test.ts --no-file-parallelism
```

PASS. 2/2 files and 50/50 tests passed.

```text
DATABASE_PATH=/tmp/liinx-task-02-full-db/liinx.db \
UPLOADS_DIR=/tmp/liinx-task-02-full-uploads NODE_ENV=test npm test
```

PASS. 23/23 files and 192/192 tests passed in 18.75s.

```text
DATABASE_PATH=/tmp/liinx-task-02-full-db/liinx.db \
UPLOADS_DIR=/tmp/liinx-task-02-full-uploads NODE_ENV=test npm run build
```

PASS. Vite build and prerender completed; 10 routes prerendered. Existing non-blocking warning remains: one generated chunk exceeds 500 kB.

```text
git diff --check
```

PASS. No whitespace errors.

### Remaining risks and dependencies

- Truncated multipart behavior still needs a lower-level malformed-stream or browser/network test.
- Upload handlers use bounded in-memory storage: 5MB for images and 25MB for documents. A future hardening task may move large document ingestion to quota-controlled temporary disk storage.
- Asset safety was verified through local Supertest and isolated files, not a real browser or deployed proxy/CDN. Vercel/Fly caching and custom-domain behavior remain external checks.
- Unclassifiable existing files are refused, not automatically deleted; any quarantine/cleanup policy needs a separate decision.

### Next eligible prompt

`03 — Shared data contracts`

## Task 03 — Shared data contracts

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline commit: `a718f8f4bbfd16de962e97a47cda19abff700921` (`main`, matching `origin/main` when work began). No commit was created during this task; these changes remain uncommitted and unrelated existing work was preserved.

### Scope and changed files

- Added `server/contracts.ts`: version 1 Zod contracts for all 24 supported block types, page mutations, and profile mutations; bounded URLs/text/arrays; purpose-specific URL schemes; strict envelopes; reserved identity/ownership key rejection; legacy flattened-extra normalization and public content-gate redaction.
- Updated `server/routes/blocks.ts`, `server/routes/pages.ts`, and `server/routes/profiles.ts` to use the shared boundary for creator writes and public block deserialization. Public output no longer lets persisted extra fields overwrite block identity/ownership fields.
- Updated `server/routes/apiV1.ts` to validate link creation through the shared block contract.
- Added `tests/contracts.test.ts` and an API regression in `tests/api.test.ts`.

### Findings and behavior

- Before this task, block `extra` was an unconstrained record, page/profile schemas were duplicated and permissive, and public `Object.assign` could let flattened JSON shadow base block fields. These were current findings on the `a718f8f` tree, not carried forward solely from `1ef7a3d`.
- All currently declared block types have an explicit schema entry. Nested arrays have bounded sizes and validated item shapes. Optional nested IDs remain compatible with existing editor payloads.
- Reserved keys are rejected case-insensitively at creator boundaries, including `id`, `type`, profile/page ownership aliases, position, and timestamps. Unknown non-reserved legacy extra fields remain readable for compatibility.
- URL validation is centralized by purpose: booking uses the Calendly validator; links and nested links use HTTP(S), `mailto`, or `tel`; media/image fields use HTTP(S) or the existing upload-path form where applicable.
- The existing flattened storage format remains unchanged; no destructive migration was needed. Public deserialization strips protected content-gate secrets/body and cannot overwrite base identity fields.

### Validation environment

Used disposable paths outside the repository: SQLite `/tmp/liinx-task-03-db/final.sqlite`, uploads `/tmp/liinx-task-03-uploads`, with `NODE_ENV=test` and both paths explicitly configured.

### Acceptance criteria

- PASS — Shared versioned contracts exist for profiles, pages, and every supported block type. Evidence: `server/contracts.ts`, `tests/contracts.test.ts` (all 24 type entries accepted and contract version asserted).
- PASS — Invalid block types and conflicting reserved fields are rejected. Evidence: contract tests and authenticated API test; API returns 400 without increasing the block count.
- PASS — Existing valid flattened records remain renderable after normalization. Evidence: legacy-compatible normalization test and full acceptance/public profile suite; storage format was not rewritten.
- PASS — No new broad `any`-based contract bypass was introduced. Evidence: contract module uses typed Zod schemas/`unknown`; `npm run lint` passes.
- PASS WITHIN API SCOPE — Creator/API validation, persistence, and public deserialization paths are connected and covered by API/acceptance tests. Evidence: targeted tests 50/50 and full suite 198/198.
- NOT RUN — A browser-driven editor serialization round-trip for every block type was not executed; evidence is source inspection plus API persistence/public-output tests, not browser evidence.
- NOT RUN — External consumer compatibility for the v1 API and deployed public pages was not verified.

### Exact commands and outcomes

```text
npm run lint
```

PASS — `tsc --noEmit` exited 0.

```text
DATABASE_PATH=/tmp/liinx-task-03-db/contracts.sqlite UPLOADS_DIR=/tmp/liinx-task-03-uploads NODE_ENV=test npm test -- tests/contracts.test.ts tests/api.test.ts tests/security.test.ts
```

PASS — 3 files, 50 tests passed.

```text
DATABASE_PATH=/tmp/liinx-task-03-db/acceptance-2.sqlite UPLOADS_DIR=/tmp/liinx-task-03-uploads NODE_ENV=test npm test -- tests/acceptance.test.ts
```

PASS — 31 tests passed. An initial run exposed a compatibility regression requiring optional nested item IDs; the schema was corrected and this targeted rerun passed.

```text
DATABASE_PATH=/tmp/liinx-task-03-db/final.sqlite UPLOADS_DIR=/tmp/liinx-task-03-uploads NODE_ENV=test npm test
```

PASS — 24 test files, 198 tests passed in 19.90s.

```text
npm run build
```

PASS — Vite build and prerender completed; 10 routes prerendered. Non-blocking existing warning: a generated chunk exceeds 500 kB.

```text
git diff --check
```

PASS — no whitespace errors.

### Regression cases and remaining risks

- Smallest new cases are in `tests/contracts.test.ts`: all block types, reserved ownership collision, purposeful URLs, compatible legacy fields, and content-gate public redaction. The API regression verifies rejected ownership fields do not persist.
- The contract schemas intentionally retain unknown non-reserved extra keys for backward compatibility; future tasks should tighten individual block fields only with migration/editor evidence.
- Existing profile duplication copies raw `extra_json`; it is compatible with the unchanged storage format but does not yet perform a contract-aware migration or deep copy policy. Revisit under the relevant profile/block task.
- Browser editor serialization, deployed routing, and external API consumers remain unverified. No production data, provider, deployment, or migration was touched.

### Next eligible prompt

`04 — Database migrations and invariants`

## Task 04 — Database migrations and invariants

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline commit: `f76ca1619defbf9bc98d5eea0a71e25fb1dd2fbe` (`main`, matching `origin/main` at task start). No commit was created during this task; all changes remain uncommitted. Existing work was preserved.

### Scope and changed files

- `server/db.ts`: added the `schema_migrations` ledger and transactional migration `0002_content_ownership_invariants`; canonicalizes home pages, repairs null/dangling/cross-profile page references, normalizes block order, adds unique ordering indexes, and installs page-ownership/home-page guards.
- `server/routes/blocks.ts`: reorder now uses a temporary disjoint position range so the unique ordering invariant is maintained during swaps.
- `server/routes/pages.ts`: page deletion reassigns blocks deterministically with collision-safe positions before deleting the page.
- `server/routes/profiles.ts`: profile creation and optional duplication now execute inside one explicit SQLite transaction; failed duplication rolls back partial rows.
- Added `tests/migrations.test.ts` and `tests/fixtures/migration-check.ts` for fresh initialization, legacy upgrade, snapshots, repeat execution, content preservation, canonical homes, and duplicate-home rejection.

### Findings and behavior

- The prior layer used startup-time `ALTER TABLE` attempts with broad catches and had no migration history. The new named migration is idempotent and records its applied version transactionally. Existing startup schema creation/legacy-column bootstrap remains backward-compatible.
- Multiple legacy home pages are reduced deterministically to the earliest `(sort_order, created_at, id)`; blocks move to the canonical page before duplicates are removed.
- Legacy blocks with null, missing, or cross-profile page references are reassigned to the profile home page without deleting content. New null page inserts are immediately assigned to home; invalid non-null ownership is rejected.
- Block positions are normalized by page using `(position, created_at, id)` ordering and protected by a unique `(profile_id, page_id, position)` index. Reorder and page-delete flows use temporary positions.
- Page slugs have a unique index per profile. Home deletion remains application-protected; profile deletion is allowed to cascade its pages.
- Profile duplication is all-or-nothing: profile, home page, starter/copy blocks, and copied pages either all persist or all roll back.
- A first local trigger draft blocked account cascade deletion. Forward-recovery cleanup was added and account deletion tests pass afterward.

### Disposable migration environment

Migration tests create temporary databases under `/tmp/liinx-task-04-*` and copy the legacy database to a `.snapshot` file before importing migration code. Repository data and production databases were not used. Route tests used `/tmp/liinx-task-04-db/*` and `/tmp/liinx-task-04-uploads`.

### Acceptance criteria

- PASS — Fresh initialization; fresh child database initializes with zero content and one applied migration.
- PASS — Realistic legacy fixture upgrade; two homes plus null/dangling/cross-profile references are repaired while all three blocks remain.
- PASS — Running migrations twice; fixture calls `initDatabase()` twice and asserts one applied `0002` row.
- PASS — Transactional recovery behavior; invariant migration and profile duplication are transactional. Forward recovery for the superseded trigger is documented above.
- PASS — Home-page creation cannot duplicate; a second home insert is rejected by the database trigger.
- PASS — Orphaned page references are handled; all legacy references resolve to canonical home without content loss.
- PASS — Existing content is preserved; all three legacy blocks and their content remain.
- PASS — Deterministic ordering and page deletion; migration, concurrency, and dynamic E2E tests pass.
- NOT RUN — Production snapshot/rollback drill; only disposable copies were used.
- NOT RUN — Deployed multi-instance migration/backup coordination.

### Exact commands and outcomes

- `npm run lint` — PASS, `tsc --noEmit` exited 0.
- `DATABASE_PATH=/tmp/liinx-task-04-db/target-3.sqlite UPLOADS_DIR=/tmp/liinx-task-04-uploads NODE_ENV=test npm test -- tests/migrations.test.ts tests/api.test.ts tests/security.test.ts` — PASS, 48 tests.
- `DATABASE_PATH=/tmp/liinx-task-04-db/e2e-2.sqlite UPLOADS_DIR=/tmp/liinx-task-04-uploads NODE_ENV=test npm test -- tests/backend-e2e.dynamic.test.ts tests/concurrency.test.ts` — PASS, 7 tests.
- `DATABASE_PATH=/tmp/liinx-task-04-db/full-final-3.sqlite UPLOADS_DIR=/tmp/liinx-task-04-uploads NODE_ENV=test npm test` — PASS, 25 files / 200 tests in 17.84s.
- `npm run build` — PASS, Vite build and prerender completed; 10 routes prerendered. Existing warning: one generated chunk exceeds 500 kB.
- `git diff --check` — PASS, no whitespace errors.

### Existing test utilities and remaining risks

- Fresh/legacy coverage uses a child process so the database is created before `server/db.ts` is imported; the pre-migration snapshot is explicitly checked.
- Recovery is forward-only: restore a pre-migration snapshot, fix the migration, and rerun. No automatic destructive rollback is exposed.
- Null inserts are auto-assigned to home for compatibility with legacy callers; profiles without a home are not expected after initialization and remain a future invariant edge case.
- Live migration behavior on Fly persistent volumes, concurrent application versions, and off-host backup restore remain unverified.

### Next eligible prompt

`05 — Authentication and sessions`
