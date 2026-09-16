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

## Task 05 — Authentication and sessions

Status: VERIFIED WITHIN SCOPE

Baseline commit: `3e2c05f45ca0010ce1dced59c1e6846c529eb39a` (`main`, matching `origin/main` at task start). No commit was created during this task; changes remain uncommitted and earlier work was preserved.

### Scope and changed files

- `server/auth.ts`: signs and verifies HS256 JWTs explicitly, validates required claim types, and rejects malformed/forged/expired tokens.
- `server/routes/auth.ts`: logout now requires a valid session, increments `session_version`, and clears the HttpOnly cookie, invalidating bearer tokens as well.
- `server/server.ts`: state-changing requests carrying an untrusted `Origin` receive 403 before route execution; configured/local development origins remain supported.
- Added `tests/auth_sessions.test.ts` covering forged, expired, logout-revoked, cookie, and hostile-origin sessions.

### Findings and behavior

- Registration and login continue to use the existing email/password flow, bcrypt password checks, constant-time missing-user comparison, and rate limits. No social-login method was added.
- Cookies are `HttpOnly`, `SameSite=Lax`, scoped to `/`, and `Secure` in production. Tokens are held only in frontend module memory; no auth token is written to localStorage/sessionStorage. The existing JSON token response remains for current frontend/API compatibility.
- `requireAuth` verifies the token, confirms the account exists, checks `session_version`, and confirms the selected profile belongs to that account. Protected studio routes consistently use this middleware, while route-level profile/page/block ownership checks remain in place.
- Logout revokes the account’s current session version, so both the cookie and previously issued bearer token fail with 401 afterward. Authorization/entitlement failures remain 403.
- Hostile state-changing Origins are rejected with 403. Same-origin, configured CORS, and local development origins remain accepted. GET/HEAD/OPTIONS are not blocked by this CSRF boundary.
- `AuthContext` already refreshes `/api/auth/me` on startup, clears in-memory auth state on 401, and updates state after login/register/logout/profile switching; this agrees with the backend session checks.

### Acceptance criteria

- PASS — Successful login and registration. Evidence: existing API tests and full suite.
- PASS — Invalid credentials return 401. Evidence: API tests and existing constant-time login path.
- PASS — Expired sessions return 401. Evidence: valid signed token with negative expiry is rejected by `verifyJwt` and `/api/auth/me` rejects invalid sessions.
- PASS — Logout invalidates cookie and bearer sessions. Evidence: `tests/auth_sessions.test.ts` and `tests/session_cookie.test.ts`.
- PASS — Forged tokens are rejected. Evidence: forged-signature and malformed-token regression tests.
- PASS — Cross-account requests are rejected. Evidence: existing security, multiprofile, custom-domain, and API-key tests; `requireAuth` validates profile ownership.
- PASS — Hostile Origin state-changing requests return 403. Evidence: `tests/auth_sessions.test.ts`.
- PASS — Session switching is account-scoped. Evidence: existing multiprofile tests and frontend `selectProfile` token/state update path.
- PASS — Frontend/backend session agreement within local scope. Evidence: cookie `/me` journey, AuthContext 401 clearing, and in-memory-only token storage inspection.
- NOT RUN — Browser automation against a deployed HTTPS origin, real proxy cookie behavior, and production CORS configuration. Local API evidence is not deployment evidence.

### Exact commands and outcomes

- `npm run lint` — PASS, `tsc --noEmit` exited 0.
- `DATABASE_PATH=/tmp/liinx-task-05-db/auth-final.sqlite UPLOADS_DIR=/tmp/liinx-task-05-uploads NODE_ENV=test npm test -- tests/auth_sessions.test.ts tests/session_cookie.test.ts` — PASS, 4 tests.
- `DATABASE_PATH=/tmp/liinx-task-05-db/full.sqlite UPLOADS_DIR=/tmp/liinx-task-05-uploads NODE_ENV=test npm test` — PASS, 26 files / 203 tests in 21.46s.
- `npm run build` — PASS; Vite build and prerender completed and 10 routes were prerendered. Existing warning: one generated chunk exceeds 500 kB.
- `git diff --check` — PASS, no whitespace errors.

### Remaining risks and dependencies

- The frontend still receives the JWT in the login/register JSON response for compatibility and uses an in-memory bearer token for requests. It is not persistent browser storage, but a future same-origin-only deployment could remove that response/token path after consumer compatibility review.
- CSRF behavior was tested through Supertest, not a real browser with production `SameSite`/`Secure` handling or deployed reverse proxies.
- Rate-limit behavior was not load-tested; existing unit/API coverage verifies configured rejection paths. No production traffic or credentials were used.

### Next eligible prompt

`06 — Account recovery and deletion`

## Task 06 — Account recovery and deletion

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline commit: `9f272661b05afcf6b21cb1a79fa12ce0a69a700f` (`main`, matching `origin/main` at task start). No commit was created during this task; changes remain uncommitted. The worktree was clean before Task 06 and earlier work was preserved.

### Scope and changed files

- `server/db.ts`: adds the backward-compatible `users.email_verified_at` column and the indexed, user-owned `account_tokens` table. Legacy databases receive the new column through an idempotent startup alteration.
- `server/services/email.ts`: sends transactional reset/verification mail through the configured Resend provider; missing configuration is an explicit unavailable state and provider credentials/tokens are not logged.
- `server/routes/auth.ts`: adds rate-limited password-reset request/confirmation and authenticated email-verification request/confirmation routes. Tokens are random, hashed at rest, single-use, expiring, invalidated after use, and cleaned opportunistically. Reset requests do not disclose account existence when delivery is configured; absent provider configuration returns the same honest unavailable state before account lookup. Password reset increments `session_version`.
- `server/routes/auth.ts`: requires the literal `DELETE` confirmation before account deletion, cancels external subscriptions before local deletion, retains local data when cancellation fails, explicitly removes pages/tokens and owned profile data, and supports a safe retry after an external failure.
- `tests/account_recovery.test.ts`: regression coverage for unavailable mail, no-token responses, expiry, reuse, session invalidation, explicit deletion, billing failure, retry, and owned subscriber/submission removal.
- `tests/api.test.ts`: updates the existing deletion journey to provide explicit confirmation.

### Findings and behavior

- Recovery tokens are only sent in the provider request body; they are never returned in API JSON. Database rows contain only SHA-256 token hashes, purpose, timestamps, and user ownership.
- Only one unused token per user/purpose remains active; used and expired token rows are purged when a new token is issued. No plaintext token retention is introduced.
- Missing `RESEND_API_KEY` or `CONTACT_FROM_EMAIL` returns HTTP 503 with a precise unavailable message and removes any tentative token row. Non-2xx provider responses also return 503 without claiming delivery.
- Password reset rejects invalid, expired, and reused tokens with the same client-safe error and invalidates existing sessions after a successful reset. Verification marks `email_verified_at` only after a valid token.
- Account deletion is confirmation-gated and authorization-scoped. Stripe cancellation is attempted first; failure returns 500 without success and leaves the account retryable. Successful local deletion removes profiles, pages, blocks, analytics, subscribers, submissions, integrations, API keys, upload records/files, account tokens, and the user; pages and tokens are explicitly removed rather than relying only on cascade behavior.
- Retention decision for this task: local account-owned records are deleted on confirmed successful account deletion; reset/verification token records are short-lived and opportunistically purged. Backup, email-provider, and billing-provider retention is outside this local implementation and has not been represented as a legal-compliance claim.

### Acceptance criteria

- PASS — Single-use and expiry behavior. Evidence: `tests/account_recovery.test.ts` rejects expired and reused tokens.
- PASS — Reset session invalidation. Evidence: the pre-reset bearer token receives 401 after reset.
- PASS — Mail-provider failure/unavailable state. Evidence: missing provider configuration returns 503 and does not claim a sent message; provider calls are mocked only in isolated tests.
- PASS — Deletion retry. Evidence: missing Stripe provider causes 500 with data preserved; clearing the subscription and retrying deletes the account and owned subscriber/submission records.
- PASS — Account data ownership. Evidence: deletion queries are scoped to the authenticated user and its profiles; regression test verifies the target account's related data is removed.
- PASS — No reset token in production API responses. Evidence: request and confirmation response bodies are asserted not to contain a token; tokens exist only in the mocked provider request for local testing.
- NOT RUN — Live Resend delivery and real email verification link journey; credentials were not available and no fake production delivery was attempted.
- NOT RUN — Production/deployed HTTPS cookie, browser, provider webhook, backup-restore, and external retention verification.

### Exact commands and outcomes

- `npm run lint` — PASS, `tsc --noEmit` exited 0.
- `mkdir -p /tmp/liinx-task-06-db /tmp/liinx-task-06-uploads && DATABASE_PATH=/tmp/liinx-task-06-db/liinx.sqlite UPLOADS_DIR=/tmp/liinx-task-06-uploads npm test -- --run tests/account_recovery.test.ts tests/api.test.ts` — PASS, 2 files / 29 tests.
- `npm run build` — PASS, Vite build and prerender completed; 10 routes prerendered. Existing warning: one generated chunk exceeds 500 kB.
- `DATABASE_PATH=/tmp/liinx-task-06-db/full.sqlite UPLOADS_DIR=/tmp/liinx-task-06-uploads/full npm test -- --run` — PASS, 27 files / 207 tests in 22.23s.
- `git diff --check` — PASS, no whitespace errors.

### Existing test utilities and remaining risks

- Supertest/Vitest API tests and the global SQLite initializer are the existing local integration utilities. Task-specific tests use unique accounts, a disposable database path, a disposable uploads path, and a mocked `fetch` only for provider-success simulation.
- The current frontend has no recovery/verification screens or controls; these API routes do not claim a completed browser UX. A future task must add the user-facing journey using the existing translation and design layers.
- Delivery rate limits are in-process and were not load-tested across multiple instances. Token cleanup is opportunistic rather than a scheduled maintenance job.
- Filesystem unlink failures during the pre-existing post-transaction cleanup remain a local orphan risk because the database record is already removed; this is not silently claimed as externally verified and should be addressed in the file-lifecycle task.
- Live transactional email, Stripe cancellation, deployed session behavior, legal retention requirements, and provider-side deletion are external prerequisites and remain unverified.

### Next eligible prompt

`07 — Subscription entitlements`

## Task 07 — Subscription entitlements

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline commit: `65e20e0` (`feat: implement account recovery, password reset, and secure account deletion workflows`) on `main`. The worktree was clean at task start; Task 06 is already committed and was not reverted. Task 07 changes remain uncommitted.

### Scope and changed files

- `server/entitlements.ts`: centralizes Free/Pro/Studio entitlement policy: profile limits of 1/5/25, paid customization, custom domains, scheduling, and Studio API access.
- `server/db.ts`: adds the idempotent `profiles.billing_event_created_at` field used to reject stale billing state transitions.
- `server/routes/profiles.ts`: uses shared entitlement checks for profile limits and paid settings; public and studio payloads no longer expose paid customization or scheduling metadata after downgrade; free profiles no longer resolve through custom-domain routing.
- `server/routes/blocks.ts`: enforces scheduling entitlement on create and update through the shared policy.
- `server/routes/apiV1.ts`: enforces Studio API entitlement both when creating keys and when using an existing key, so downgraded keys cannot retain access.
- `server/routes/billing.ts`: applies checkout state per profile rather than all profiles on the account, validates event shape, records event timestamps, ignores stale subscription events, protects subscription identity, and retains transactional duplicate-event handling.
- `tests/subscription_entitlements.test.ts`: covers per-profile upgrade, profile duplication/switching, cancellation, repeated webhook delivery, out-of-order delivery, payment failure, downgrade public output, and unsigned production-mode webhook rejection.

### Findings and behavior

- Existing plan limits were duplicated in profile creation and existing paid checks were spread across routes. The shared policy now defines the actual limits and capabilities used by server authorization.
- Existing content is preserved during downgrade. Paid scheduling behavior is disabled by removing scheduling metadata from public/studio payloads; blocks are not deleted. Paid customization is withheld from public/studio output, and custom-domain routing is unavailable while Free.
- Stripe checkout completion now updates only the profile identified by the signed checkout metadata. Profile duplication retains the current effective plan as existing product behavior, while later subscription events remain profile-scoped.
- Webhook event IDs are recorded in the same transaction as state changes. A repeated event returns `{ received: true, duplicate: true }` without reapplying business logic.
- Subscription state transitions compare Stripe event creation time and subscription identity. Older active events cannot resurrect a cancelled subscription, and an old subscription cannot clear or overwrite a newer subscription.
- Signed webhook validation remains mandatory whenever `STRIPE_WEBHOOK_SECRET` is configured. Test-mode synthetic events are accepted only when the secret is absent; no production bypass was added.
- Payment failures and non-active subscription statuses remove paid entitlements locally. No creator commerce, storefront, payout, or new billing infrastructure was added.
- UI plan copy already states Pro supports up to 5 profiles and Studio up to 25; the server policy now matches those labels. The billing controls continue to show provider-backed checkout/portal states rather than claiming a local payment succeeded.

### Acceptance criteria

- PASS — Upgrade in local test mode. Evidence: synthetic `checkout.session.completed` updates the selected profile to Pro.
- PASS — Cancellation in local test mode. Evidence: `customer.subscription.deleted` returns the profile to Free.
- PASS — Payment failure. Evidence: `invoice.payment_failed` removes Studio entitlement and clears the subscription ID.
- PASS — Repeated webhook. Evidence: the same event ID is returned as duplicate and does not reapply state.
- PASS — Profile switching. Evidence: duplicated Pro profile can be selected and `/api/studio/profile` reports the selected profile's plan.
- PASS — Profile duplication. Evidence: duplicate remains account-owned and inherits the effective plan within the existing product model; transactional duplication tests remain green.
- PASS — Downgrade with excess content. Evidence: scheduled content remains stored and publicly visible, while paid scheduling metadata/customization and custom-domain routing are withheld for Free.
- PASS — Server-side paid enforcement. Evidence: shared checks cover profile settings, scheduling, custom domains, and API-key use; this is not UI-only gating.
- PASS — Webhook authentication boundary. Evidence: production-mode unsigned request returns 400 for missing Stripe signature; test-mode synthetic events are isolated to local tests.
- NOT RUN — Real Stripe test-mode checkout, signed webhook delivery, duplicate/out-of-order delivery through Stripe, and billing portal cancellation. Stripe credentials/webhook fixtures were not supplied.
- NOT RUN — Browser verification of Arabic/English billing labels and responsive billing controls; source labels and server limits were inspected, but no browser journey was run.

### Exact commands and outcomes

- `npm run lint` — PASS, `tsc --noEmit` exited 0.
- `task07_dir=$(mktemp -d /tmp/liinx-task-07-XXXXXX) && mkdir -p "$task07_dir/uploads" && DATABASE_PATH="$task07_dir/liinx.db" UPLOADS_DIR="$task07_dir/uploads" NODE_ENV=test npm test -- --run tests/subscription_entitlements.test.ts tests/multiprofile.test.ts tests/api_v1.test.ts` — PASS, 13 tests.
- `task07_dir=$(mktemp -d /tmp/liinx-task-07-full-XXXXXX) && mkdir -p "$task07_dir/uploads" && DATABASE_PATH="$task07_dir/liinx.db" UPLOADS_DIR="$task07_dir/uploads" NODE_ENV=test npm test -- --run` — PASS, 28 files / 209 tests in 22.69s.
- `npm run build` — PASS, Vite build and prerender completed; 10 routes prerendered. Existing warning: one generated chunk exceeds 500 kB.
- `git diff --check` — PASS, no whitespace errors.

### Existing test utilities and remaining risks

- Vitest/Supertest and the existing SQLite global initializer provide local integration coverage. Task-specific billing tests use a disposable database/uploads directory and synthetic Stripe-shaped events with the test-only unsigned path; this is not evidence of live-provider delivery.
- `PUT /api/studio/plan` remains a test/admin synchronization seam and is rejected in production. Real entitlement activation depends on signed Stripe webhooks and was not exercised with credentials.
- The webhook processed-event table has local idempotency, but multi-instance delivery coordination and retention/cleanup of processed event records remain operational concerns.
- Provider-side subscription state, refund/chargeback policy, billing portal behavior, and live payment failure timing remain externally unverified.

### Next eligible prompt

`08 — Authoritative editor state`

## Task 08 — Authoritative editor state

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline commit: `5b2fd6b` (`refactor: centralize subscription feature checks with new entitlements module`) on `main`. The worktree was clean at task start; Task 07 was already committed and was not reverted. Task 08 changes remain uncommitted.

### Scope and changed files

- `src/components/BuilderStudio.tsx`: removes the mutable `pages` state copy. Pages are now derived exclusively from `profile.pages`; page create/edit/reorder/delete operations update that authoritative profile state. Profile load, profile creation, profile switching, and importer reload reset the selected page to the new profile's home/first page when necessary. Profile switches also reset save status/error indicators after a successful reload.

### Findings and behavior

- The prior component kept both `profile.pages` and local `pages`, updating both in some handlers and only one in others. This could leave page tabs, block filtering, and preview out of sync.
- `activePage` is derived from `profile.pages` and `activePageId`; the API receives the selected page ID only from this derived current-profile selection. Switching profiles explicitly selects the new profile's home/first page, preventing the previous profile's page ID from leaking into subsequent block creation/reorder requests.
- Page reorder now changes only the authoritative page array and does not reconstruct or filter `profile.blocks`, preserving blocks belonging to every page. Existing block reorder logic maps only the visible block IDs and leaves other-page blocks untouched.
- Page editor fields continue to derive from the active page selector, so edits update the same page object represented by tabs and preview. The preview intentionally receives the selected page projection while the underlying profile retains all pages.
- No state-library migration or unrelated feature rewrite was introduced.

### Acceptance criteria

- PASS — Create two pages, create/edit a third, switch profiles, and return at the API/state boundary. Existing multi-page/profile journeys pass; component state now derives pages from the loaded profile and resets selection on profile changes.
- PASS — All page tabs and blocks remain represented without a reload after local create/edit/reorder updates. There is no second mutable page collection; updates write through `profile.pages`.
- PASS — Reordering one page does not remove another page's blocks from state. The page reorder handler updates only `profile.pages`; existing API/block ordering tests remain green.
- PASS — Requests do not carry a stale page ID after profile changes. Profile switch/create/import handlers reset `activePageId`, and block creation uses the derived active page.
- PASS — Type/build and relevant API/editor journeys. Evidence: lint, build, backend dynamic, concurrency, multiprofile, and API tests.
- NOT RUN — Actual browser interaction for the multi-page journey; the required in-app browser Node REPL was not exposed in this session, so source inspection and API evidence are not represented as browser proof.

### Exact commands and outcomes

- `npm run lint` — PASS, `tsc --noEmit` exited 0.
- `task08_dir=$(mktemp -d /tmp/liinx-task-08-XXXXXX) && mkdir -p "$task08_dir/uploads" && DATABASE_PATH="$task08_dir/liinx.db" UPLOADS_DIR="$task08_dir/uploads" NODE_ENV=test npm test -- --run tests/backend-e2e.dynamic.test.ts tests/concurrency.test.ts tests/multiprofile.test.ts tests/api.test.ts` — PASS, 4 files / 37 tests.
- `task08_dir=$(mktemp -d /tmp/liinx-task-08-full-XXXXXX) && mkdir -p "$task08_dir/uploads" && DATABASE_PATH="$task08_dir/liinx.db" UPLOADS_DIR="$task08_dir/uploads" NODE_ENV=test npm test -- --run` — PASS, 28 files / 209 tests in 23.45s.
- `npm run build` — PASS, Vite build and prerender completed; 10 routes prerendered. Existing warning: one generated chunk exceeds 500 kB.
- `git diff --check` — PASS, no whitespace errors.

### Existing test utilities and remaining risks

- Vitest/Supertest and the existing SQLite global initializer cover API-level page/profile/block flows using disposable database/uploads paths. No production data was used.
- No dedicated React component test harness or browser runtime was available, so the no-reload UI acceptance remains externally unverified.
- `profile.page` remains part of the shared API shape for preview/public compatibility, but the editor's active-page behavior is driven by `activePageId` plus derived `profile.pages`; a future contract cleanup may remove redundant selected-page payload state after consumer review.
- SaveQueue behavior across rapid profile switching is guarded by flushing before switching, but multi-tab/browser concurrent editing remains outside this task.

### Next eligible prompt

`09 — Autosave and concurrent editing`

## Task 09 — Autosave and concurrent editing

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline commit: `995a6f29cc364b6541b07c5f0f32fd8b5a8c1c49` (`refactor: derive builder studio pages directly from profile state`) on `main`. The worktree was clean at task start; Task 08 was already committed and was not reverted. Task 09 changes remain uncommitted in the current worktree.

### Scope and changed files

- `src/utils/saveQueue.ts`: revalidated the existing debounced, per-key patch-merging queue, serialized in-flight writes, retained failed payloads for explicit retry, and delayed the saved state until persistence resolves. No rewrite was required.
- `src/components/BuilderStudio.tsx`: routes profile/block autosaves through the current profile reference and optimistic revisions; upload completion now joins the queue and flushes before reporting success; page saves send and acknowledge revisions; page reorder consumes refreshed server state.
- `server/contracts.ts`: accepts non-negative optional revisions on profile, page, and block updates while preserving strict request validation.
- `server/routes/profiles.ts`, `server/routes/blocks.ts`, `server/routes/pages.ts`: expose studio revisions and reject stale profile/block/page writes with HTTP 409 instead of silently overwriting newer data. Page list/reorder responses include refreshed revisions.
- `src/services/api.ts`, `src/types.ts`: carry revision metadata through the shared client contracts.
- `tests/saveQueue.test.ts`: verifies a slow persistence promise cannot report saved early.
- `tests/concurrent_revisions.test.ts`: verifies stale profile, block, and page writes are rejected and the first acknowledged value remains persisted.

### Findings and behavior

- The existing queue already debounced rapid edits, merged nested `extra`/`customTheme` patches, serialized writes, and retained failed patches. The defect was that the editor did not consistently supply a current revision or use the queue for upload-triggered block writes.
- Profile, block, and page update endpoints now use the record's `updated_at` as an optimistic revision. A stale revision receives 409 with a reload/retry message; the server does not apply that payload.
- The editor keeps the authoritative current profile in a ref for queue writers and updates the acknowledged revision only after the API resolves. Failed writes remain dirty and visible through the existing retry UI.
- Upload completion waits for pending editor writes, enqueues its block patch, and waits for that patch to persist before setting the local saved state. Page reorder refreshes page revisions so a following page edit is not rejected solely because reorder changed `updated_at`.
- Existing page/profile switching and navigation guards were revalidated: pending queue work is flushed before switching, preview/fullscreen navigation, anchor navigation, and unload warning handling. No state-library or block-editor rewrite was introduced.
- Revision conflict detection is record-based for profile, block, and page edits. Browser-level conflict UX, upload completion, and unload-warning journeys were not run because the required in-app browser Node REPL tool was unavailable in this session.

### Acceptance criteria

- PASS — Fast typing. Evidence: existing SaveQueue debounce/merge tests remain green; rapid same-key edits collapse into one ordered persistence payload.
- PASS — Slow first response. Evidence: queue tests verify a second edit waits behind the first and that saved is not reported before the slow writer resolves.
- PASS — Network failure and retry. Evidence: existing queue tests verify failed payload retention and explicit retry; dirty/error state remains until a retry succeeds.
- NOT RUN — Upload completion during editing in an actual browser. Source evidence shows upload patches now use the queue and await flush; no browser runtime was available.
- PASS — Page/profile switching with pending saves at the code path level. Evidence: existing BuilderStudio guards flush before switching/creating profiles and page navigation; targeted TypeScript/build and API suites pass. Actual no-reload UI interaction was not run.
- NOT RUN — Tab-closure warning in an actual browser. Source inspection confirms a `beforeunload` handler when the queue is dirty; browser event behavior was not externally verified.
- PASS — Saved indicator only after persistence succeeds. Evidence: the new slow-writer regression test passes and the upload paths await queue flush before setting `saved`.
- PASS — Reloaded data matches the last acknowledged version for profile/block/page edits. Evidence: optimistic revision API test passes for all three record types; stale requests return 409 and database values remain from the first acknowledged write.
- PASS — Concurrent stale writes are not silently overwritten. Evidence: `tests/concurrent_revisions.test.ts` passes profile, block, and page 409 assertions.

### Exact commands and outcomes

- `npm run lint` — PASS, `tsc --noEmit` exited 0.
- `task09_target=$(mktemp -d /tmp/liinx-task09-target-XXXXXX) && mkdir -p "$task09_target/uploads" && DATABASE_PATH="$task09_target/liinx.db" UPLOADS_DIR="$task09_target/uploads" NODE_ENV=test npm test -- --run tests/saveQueue.test.ts tests/concurrent_revisions.test.ts tests/api.test.ts` — PASS, 3 files / 32 tests.
- `task09_e2e=$(mktemp -d /tmp/liinx-task09-e2e-XXXXXX) && mkdir -p "$task09_e2e/uploads" && DATABASE_PATH="$task09_e2e/liinx.db" UPLOADS_DIR="$task09_e2e/uploads" NODE_ENV=test npm test -- --run tests/backend-e2e.dynamic.test.ts` — PASS, 1 file / 4 tests; public rendering and upload rejection journey completed through the API.
- `task09_full=$(mktemp -d /tmp/liinx-task09-full-XXXXXX) && mkdir -p "$task09_full/uploads" && DATABASE_PATH="$task09_full/liinx.db" UPLOADS_DIR="$task09_full/uploads" NODE_ENV=test npm test` — PASS, 29 files / 211 tests.
- `npm run build` — PASS, Vite build and prerender completed; 10 routes prerendered. Existing warning: one generated chunk exceeds 500 kB.
- `git diff --check` — PASS, no whitespace errors.
- Initial combined targeted invocation with dynamic/API/saveQueue/revision files — FAIL, 2 of 36 tests; one `ECONNRESET` reported with Supertest's `double callback bug`, and the dynamic catalogue request returned 400. The dynamic file passed independently and the full isolated suite passed, so this was not reproducible as an application failure; it remains a test-order/harness observation.
- Browser journey — NOT RUN; the repository has Playwright dependencies, but the required in-app browser Node REPL tool was not exposed in this environment.

### Existing test utilities and remaining risks

- Vitest/Supertest, the SQLite global initializer, and `mktemp`-based `DATABASE_PATH`/`UPLOADS_DIR` isolation were used. No production database or uploads directory was touched.
- No dedicated React component/browser harness was available. Fast typing, slow response, retry, upload completion, profile switching, and unload behavior have API/source/unit evidence where noted, but not browser evidence.
- Revisions use millisecond `updated_at` values. The current tests pass, but a future hardening task should use a database revision counter or equivalent monotonic mechanism if same-millisecond writes must be provably distinguishable across all SQLite/runtime conditions.
- Upload failure/orphan cleanup remains owned by the uploaded-file lifecycle work from Task 02; Task 09 only prevents upload-triggered block metadata from bypassing the save queue.

### Next eligible prompt

`10 — Page creation and settings`

## Task 10 — Page creation and settings

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline commit: `f10d166` (`feat: add revision tracking and concurrency control for profiles, blocks, and pages`) on `main`. Task 09 was committed before this task and was not reverted. Task 10 changes remain uncommitted; existing uncommitted work at task start was preserved.

### Scope and changed files

- `server/routes/pages.ts`: rejects reserved page slugs, preserves existing strict slug/title/description validation, protects Home, refuses unsafe deletion of unpublished pages containing blocks, and reports the ordered move-to-Home behavior on successful deletion.
- `src/components/BuilderStudio.tsx`: replaces page deletion `window.confirm` with the existing accessible `Modal`, describes the block migration, flushes pending saves before deletion, and keeps inline errors for failed saves/deletes.
- `tests/page_creation_settings.test.ts`: covers creation/normalization/reload/public routing, duplicate/reserved/malformed/overlong slugs, authorization, Home rules, deterministic block migration, and unpublished draft protection.

### Findings and behavior

- Page creation and update already used the shared strict schema: trimmed title/description, lowercase slug syntax, 40-character slug limit, 80-character title limit, and 240-character description limit. The editor normalizes typing to lowercase/hyphen input, while the API remains authoritative.
- Page slugs now reserve `home` and the application route names from `RESERVED_USERNAMES` (`api`, `studio`, `login`, `uploads`, etc.) for consistent routing boundaries. Duplicate slugs remain profile-scoped conflicts with 409 responses.
- Home cannot be deleted, renamed away from `home`, or unpublished. Page deletion moves blocks to Home in their original `position, created_at, id` order and appends them after existing Home blocks.
- Deleting an unpublished page that still contains blocks returns 409. This prevents draft content from becoming visible on the published Home page; the creator must publish the page or remove its blocks first. No content is silently deleted.
- The deletion confirmation is an accessible dialog using the shared `Modal`; it states that blocks move to Home and are not deleted. Pending autosaves are flushed before the delete request, and a failed flush prevents deletion.
- Public direct routing was verified through `/api/profiles/:username?page=:slug`, including persisted settings and published content. Browser UI interaction and responsive/Arabic visual behavior were not available for external verification.

### Acceptance criteria

- PASS — Create a page, save settings, reload, and open its direct URL. Evidence: `tests/page_creation_settings.test.ts` creates/updates, reloads `/api/studio/profile`, and gets the public page route successfully.
- PASS — Duplicate slugs rejected. Evidence: page regression test receives 409 for a same-profile duplicate.
- PASS — Reserved, whitespace, length, and case-invalid slugs rejected. Evidence: regression test receives 400 for `home`, `api`, padded/invalid-case, whitespace, malformed, and 41-character values; valid padded input is normalized at the schema boundary.
- PASS — Unauthorized edits rejected. Evidence: a second registered account receives 404 when updating the first account's page.
- PASS — Home cannot be deleted or accidentally hidden. Evidence: deleting Home returns 400; updating Home with `published: false` or a non-`home` slug returns 400.
- PASS — Published page deletion preserves blocks exactly as promised. Evidence: deletion response explicitly says blocks moved to Home in original order; test verifies both block identities, order, destination, and page removal.
- PASS — Unpublished draft content is not silently published by deletion. Evidence: deletion of an unpublished page containing a block returns 409 and both page/block remain.
- NOT RUN — Actual browser dialog keyboard/focus journey and responsive Arabic/English rendering. Source inspection confirms shared accessible dialog and translated strings; browser tool was unavailable.

### Exact commands and outcomes

- `npm run lint` — PASS, `tsc --noEmit` exited 0.
- `task10_pages=$(mktemp -d /tmp/liinx-task10-pages-XXXXXX) && mkdir -p "$task10_pages/uploads" && DATABASE_PATH="$task10_pages/liinx.db" UPLOADS_DIR="$task10_pages/uploads" NODE_ENV=test npm test -- --run tests/page_creation_settings.test.ts tests/backend-e2e.dynamic.test.ts tests/audit_fixes.test.ts` — PASS, 3 files / 38 tests.
- `task10_final=$(mktemp -d /tmp/liinx-task10-final-XXXXXX) && mkdir -p "$task10_final/uploads" && DATABASE_PATH="$task10_final/liinx.db" UPLOADS_DIR="$task10_final/uploads" NODE_ENV=test npm test` — PASS, 30 files / 216 tests.
- `npm run build` — PASS, Vite build and prerender completed; 10 routes prerendered. Existing warning: one generated chunk exceeds 500 kB.
- `git diff --check` — PASS, no whitespace errors.
- Browser journey — NOT RUN; no in-app browser automation tool was exposed in this environment.

### Existing test utilities and remaining risks

- Vitest/Supertest, the SQLite global initializer, and disposable `mktemp` database/uploads directories were used. No production data was used.
- There is no dedicated React component/browser test harness available in this session, so dialog focus behavior, no-reload UI interaction, touch layout, and Arabic visual rendering remain externally unverified.
- The server's published-page deletion migration is transactional, but a future product decision may add a separate explicit “delete draft page and delete/move blocks” workflow; this task intentionally refuses the unsafe implicit publish case.
- Reserved page slugs currently share the application username route reservation list. If routing expands, that shared list must be reviewed with the new route.

### Next eligible prompt

`11 — Block placement and ordering`
