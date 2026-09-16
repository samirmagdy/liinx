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

## Task 11 — Block placement and ordering

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline commit: `f10d1668cb54de676f393e2b624b8c111dc5a0f4` on `main` at task start. Task 10 is now present as commit `964c5f14d55d6ffb19727513c3e0f6de326a929a`; Task 11 changes remain uncommitted. Existing Task 10 work was preserved.

### Scope and changed files

- `server/routes/blocks.ts`: tightens page-scoped reorder validation and adds ownership-checked move and duplicate endpoints with deterministic destination append ordering.
- `server/routes/importer.ts`: assigns imported links to Home, repairing a missing Home page first when necessary.
- `server/routes/apiV1.ts`: assigns REST-created blocks to Home and exposes `pageId` in REST profile output, repairing missing Home for legacy profiles.
- `server/services/instagramSync.ts`: assigns synced links to Home and calculates positions within that page.
- `src/services/api.ts`: exposes move and duplicate block operations.
- `src/components/BuilderStudio.tsx`: adds accessible up/down labels, destination-page controls, and duplicate controls; move/duplicate/delete operations refresh or update authoritative profile state and flush pending saves before mutation.
- `tests/block_placement_ordering.test.ts`: covers three-page isolation, reorder/move/duplicate/reload, invalid and foreign reorder requests, importer/API assignment, and update/delete race behavior.

### Findings and behavior

- Studio block creation already validated the requested page against the authenticated profile and assigned a valid Home page when no page was supplied. Imported links, Instagram sync, and REST API creation bypassed that path and could leave `page_id` null; those paths now assign Home explicitly.
- Reordering with a `pageId` now operates only on blocks owned by that page. Missing or incomplete lists, duplicate IDs, foreign-page IDs, and foreign-account IDs are rejected. Legacy callers without `pageId` remain supported only when every requested block belongs to one page.
- Moving a block preserves its ID and appends it after the destination page's current blocks. Duplication creates a new ID, copies the block content, and appends it to the selected destination page.
- Existing accessible up/down controls now have explicit ARIA labels. The new page selector and duplicate button are keyboard-operable; drag-and-drop was not added because it was optional.
- Delete already flushed the save queue before deletion. The regression race confirms that whether update or delete wins, the deleted block is absent after reload and cannot be resurrected by a later response.

### Acceptance criteria

- PASS — Several blocks across three pages can be reordered, moved, duplicated, removed, and reloaded without cross-page loss. Evidence: `tests/block_placement_ordering.test.ts` verifies identities, destinations, and order after reload.
- PASS — New blocks receive valid page assignments. Evidence: studio/importer/REST paths assign Home; importer and REST assignment tests pass, while Instagram sync uses the same Home assignment path.
- PASS — Block IDs remain stable on move and change only for duplication. Evidence: move/reload test checks the moved ID; duplicate test checks a distinct ID.
- PASS — Incomplete, duplicate, foreign-page, and foreign-account reorder requests are rejected with 400. Evidence: dedicated regression test covers all four cases.
- PASS — Other pages remain intact when one page is reordered. Evidence: three-page test verifies Home and the untouched page after page-two/page-three operations.
- PASS — Delete during an in-flight update does not resurrect the block. Evidence: concurrent update/delete test accepts either valid request ordering and verifies the block is absent after reload.
- PASS — Accessible move controls exist. Evidence: up/down buttons have explicit ARIA labels; destination selection and duplication are native keyboard controls.
- NOT RUN — Actual browser journey for focus, screen-reader announcements, touch behavior, and no-reload visual state. Browser automation was unavailable.

### Exact commands and outcomes

- `npm run lint` — PASS, `tsc --noEmit` exited 0.
- `task11_target2=$(mktemp -d /tmp/liinx-task11-target2-XXXXXX) && mkdir -p "$task11_target2/uploads" && DATABASE_PATH="$task11_target2/liinx.db" UPLOADS_DIR="$task11_target2/uploads" NODE_ENV=test npm test -- --run tests/block_placement_ordering.test.ts tests/backend-e2e.dynamic.test.ts tests/concurrency.test.ts tests/api_v1.test.ts tests/instagram-sync.test.ts` — PASS, 5 files / 31 tests.
- `task11_final=$(mktemp -d /tmp/liinx-task11-final-XXXXXX) && mkdir -p "$task11_final/uploads" && DATABASE_PATH="$task11_final/liinx.db" UPLOADS_DIR="$task11_final/uploads" NODE_ENV=test npm test` — PASS, 31 files / 219 tests.
- `task11_pages=$(mktemp -d /tmp/liinx-task11-pages-XXXXXX) && mkdir -p "$task11_pages/uploads" && DATABASE_PATH="$task11_pages/liinx.db" UPLOADS_DIR="$task11_pages/uploads" NODE_ENV=test npm test -- --run tests/block_placement_ordering.test.ts` — PASS, 1 file / 3 tests after the explicit foreign-account assertion.
- `npm run build` — PASS, Vite build and prerender completed; 10 routes prerendered. Existing warning: one generated chunk exceeds 500 kB.
- `git diff --check` — PASS, no whitespace errors.
- Browser journey — NOT RUN; no in-app browser automation tool was exposed in this environment.

### Existing test utilities and remaining risks

- Vitest/Supertest, the SQLite global initializer, and disposable `mktemp` database/uploads directories were used. No production data was used.
- No browser/component harness was available, so UI focus, touch, responsive, Arabic/English, and live no-reload state remain externally unverified.
- Move and duplicate operations refresh or append authoritative profile state, but conflict/revision protection for reorder/move/duplicate collection mutations is not yet modeled as an optimistic collection revision. Concurrent collection edits remain a future hardening risk.
- Legacy null-page rows are repaired by database invariants and the covered creation/import/API paths; existing production rows require the established migration/repair path and were not modified directly.

### Next eligible prompt

`12 — Published pages and public routing`

## Task 12 — Published pages and public routing

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `95428f3` (`feat: add support for page-aware block movement, duplication, and reordering`) at task start. Task 12 changes remain uncommitted. Existing Task 11 work was preserved.

### Scope and changed files

- `server/server.ts`: production platform and verified custom-domain HTML routing now returns HTTP 404 when a requested page slug is missing or unpublished instead of serving the SPA shell with a misleading 200.
- `src/components/BuilderStudio.tsx`: clarifies that edits are saved directly to the published page; unpublished pages are hidden and Liinx does not maintain a separate draft revision stream.
- `tests/published_pages_routing.test.ts`: verifies Home, published/unpublished/unknown page API visibility, custom-domain lookup, and custom-domain missing-page routing.

### Findings and product model

- The API already selected only `published = 1` pages and exposed only those pages to public navigation. Home is forced published by existing page rules.
- The client navigation already filtered unpublished pages and marked the selected page with `aria-current="page"`.
- Production HTML fallback previously returned the shell for an unknown or unpublished platform slug. Verified custom-domain HTML requests had the same problem. Both now return 404.
- Liinx currently has a single persisted page state. Saving content/settings updates the live state; an unpublished page is hidden, not an unpublished revision of a published page. The studio now states this explicitly.
- The public API returns 404 for unknown and unpublished pages, including encoded query slugs. Custom-domain resolution preserves the page query.

### Acceptance criteria

- PASS — Home and a published subpage are publicly available; evidence: new routing regression and existing dynamic E2E tests.
- PASS — Unpublished and unknown pages are excluded and return 404 through the public profile API.
- PASS — Public navigation lists only published pages and marks the current page; evidence: `PublicBioView.tsx` source inspection. Browser rendering remains unverified.
- PASS — Production platform and verified custom-domain HTML routing reject missing/unpublished slugs with 404; evidence: route code and custom-domain regression coverage for the available app path.
- PASS — Custom-domain page lookup preserves the encoded page query; evidence: `tests/published_pages_routing.test.ts`.
- PASS — UI clearly communicates immediate published autosave and absence of separate draft revisions.
- NOT RUN — Browser direct reload, back/forward navigation, focus/screen-reader behavior, responsive Arabic/English rendering, and deployed Vercel/Fly/custom-domain behavior; browser/deployment tooling and live domains were unavailable.
- NOT RUN — Form, content-gate, and download behavior on every visibility permutation; existing endpoint/block tests cover authorization and public filtering, but no new browser journey was run for this task.

### Exact commands and outcomes

- `task12_db=$(mktemp -d /tmp/liinx-task12-db-XXXXXX); task12_uploads=$(mktemp -d /tmp/liinx-task12-uploads-XXXXXX); DATABASE_PATH="$task12_db/liinx.db" UPLOADS_DIR="$task12_uploads" NODE_ENV=test npm run lint && DATABASE_PATH="$task12_db/liinx.db" UPLOADS_DIR="$task12_uploads" NODE_ENV=test npm test -- --run tests/published_pages_routing.test.ts tests/backend-e2e.dynamic.test.ts tests/custom_domain.test.ts tests/page_creation_settings.test.ts` — PASS, typecheck plus 4 files / 18 tests.
- `task12_db=$(mktemp -d /tmp/liinx-task12-full-db-XXXXXX); task12_uploads=$(mktemp -d /tmp/liinx-task12-full-uploads-XXXXXX); DATABASE_PATH="$task12_db/liinx.db" UPLOADS_DIR="$task12_uploads" NODE_ENV=test npm test` — PASS, 32 files / 221 tests.
- `task12_build_db=$(mktemp -d /tmp/liinx-task12-build-db-XXXXXX); task12_build_uploads=$(mktemp -d /tmp/liinx-task12-build-uploads-XXXXXX); DATABASE_PATH="$task12_build_db/liinx.db" UPLOADS_DIR="$task12_build_uploads" NODE_ENV=test npm run build` — PASS, Vite build and prerender completed; 10 routes prerendered. Existing warning: one generated chunk exceeds 500 kB.
- `git diff --check` — PASS before the final ledger-only edit; must be rerun after handoff edits.
- Browser/deployed routing — NOT RUN; no browser automation or live deployment access was available.

### Existing test utilities and remaining risks

- Vitest/Supertest, the SQLite global initializer, and disposable `mktemp` database/uploads directories were used. No production data was used.
- API evidence cannot prove client-side direct reload or back/forward rendering, despite the route state being encoded in the URL and fetch effect dependencies.
- The production 404 branch is source/build verified but not exercised against a running production server with a real dist shell and reverse proxy.
- The current product has no separate draft revision system. Adding one would require an explicit product decision and a later scoped task; this task does not introduce it.
- Visibility behavior for forms, gates, and downloads remains dependent on their existing block/API authorization paths and needs a dedicated browser journey in a later task.

### Next eligible prompt

`13 — Profile duplication`

## Task 13 — Profile duplication

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `feb192e` (`feat: enforce 404 routing for unpublished pages and add test coverage for public profile routing`) at task start. Task 13 changes remain uncommitted. Existing Task 12 work was preserved.

### Scope and changed files

- `server/routes/profiles.ts`: hardens the existing authenticated profile-copy transaction, preserves Home/page metadata and supported presentation/content fields, generates fresh page/block identities, remaps internal references, and excludes credentials/private account state.
- `tests/profile_duplication.test.ts`: covers multi-page copying, representative core/advanced blocks, design/content equality, internal redirect remapping, ownership independence, private-state exclusion, and rollback after a forced persistence failure.

### Findings and behavior

- The existing route already required the source profile to belong to the authenticated account and wrapped creation in a transaction. It copied most profile presentation fields but recreated Home metadata from the new display name and copied block JSON without reference or secret handling.
- Duplication now preserves source Home title/description, page titles/descriptions/slugs/order/publication flags, profile socials/theme overrides/background/font/footer/sharing settings, block content, and page-scoped positions.
- Every copied page and block receives a new ID. JSON values and `/r/:blockId` URLs are remapped from source IDs to copied IDs. Blocks with missing/legacy page assignment fall back to copied Home.
- Billing plan entitlement is inherited from the account's current highest plan so duplication remains subject to existing profile limits. Billing customer/subscription IDs, analytics IDs/history, custom domains and verification, credentials, integrations, form submissions, and temporary redirects are intentionally reset/excluded.
- Redirects are reset because they are account/page-routing behavior, not reusable profile design. Integration configuration is reset because it contains provider identity/credentials and must be connected explicitly on the new profile. Content-gate passwords are reset while non-secret gate content is copied.
- A failed insert rolls back the entire profile/page/block copy; no partially created profile remains.

### Acceptance criteria

- PASS — Duplicate a profile with multiple pages and representative major block types. Evidence: `tests/profile_duplication.test.ts` copies link, rich text, image, and content-gate blocks across Home and a subpage; the route copies all persisted block types generically.
- PASS — Design/content equality for intended fields. Evidence: test compares profile bio/theme/socials, Home/page metadata, block count/type/content, and ordering.
- PASS — Subsequent edits are independent. Evidence: updating a copied block leaves the source block unchanged.
- PASS — Internal navigation is remapped. Evidence: copied `/r/:blockId` link points to the copied block ID; page/block IDs are disjoint.
- PASS — No shared ownership IDs or copied secrets. Evidence: copied profile/page/block IDs differ; billing IDs, domain, analytics IDs, redirect, form submissions, integration row, and gate passwords are absent/reset.
- PASS — Copy failure leaves no partial profile. Evidence: SQLite trigger forces block persistence failure; request returns 500 and the failed target username has zero profiles before a successful retry.
- PASS — Redirect and integration reset policy is explicit and implemented; no broad SQL copy is used for those settings.
- NOT RUN — Browser duplication form, accessible input workflow, Arabic/English visual behavior, and deployed/storage-provider verification; no browser automation or deployment access was available.

### Exact commands and outcomes

- `task13_db=$(mktemp -d /tmp/liinx-task13-db-XXXXXX); task13_uploads=$(mktemp -d /tmp/liinx-task13-uploads-XXXXXX); DATABASE_PATH="$task13_db/liinx.db" UPLOADS_DIR="$task13_uploads" NODE_ENV=test npm run lint && DATABASE_PATH="$task13_db/liinx.db" UPLOADS_DIR="$task13_uploads" NODE_ENV=test npm test -- --run tests/profile_duplication.test.ts tests/multiprofile.test.ts tests/subscription_entitlements.test.ts` — PASS, typecheck plus 3 files / 8 tests.
- `task13_full=$(mktemp -d /tmp/liinx-task13-full-XXXXXX); mkdir -p "$task13_full/uploads"; DATABASE_PATH="$task13_full/liinx.db" UPLOADS_DIR="$task13_full/uploads" NODE_ENV=test npm test` — PASS, 33 files / 222 tests.
- `task13_build=$(mktemp -d /tmp/liinx-task13-build-XXXXXX); mkdir -p "$task13_build/uploads"; DATABASE_PATH="$task13_build/liinx.db" UPLOADS_DIR="$task13_build/uploads" NODE_ENV=test npm run build` — PASS, Vite build and prerender completed; 10 routes prerendered. Existing warning: one generated chunk exceeds 500 kB.
- `git diff --check` — PASS after the final ledger edit.
- Browser/deployed provider verification — NOT RUN; no browser automation, production deployment, billing provider, or integration credentials were used.

### Existing test utilities and remaining risks

- Vitest/Supertest, SQLite global setup, direct disposable database fixtures, and `mktemp` uploads directories were used. No production data was used.
- The editor still uses browser `window.prompt` for choosing the new handle/display name. It functions, but accessible form/dialog replacement should be addressed in a UI-focused task.
- Arbitrary future block types may contain new secret fields; duplication currently explicitly removes known gate password fields and resets integration/profile secrets. New credential-bearing schemas must extend the duplication sanitizer.
- Live uploaded-file references are copied as URLs/content references, not physical file bytes. Existing assets remain shared by path; a future file-lifecycle decision is needed if duplicated profiles must own independent asset copies.

### Next eligible prompt

`14 — Profile switching and onboarding`

## Task 14 — Profile switching and onboarding

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `deaa9e6` (`feat: implement profile duplication with internal reference remapping and private state sanitization`) at task start. Task 14 changes remain uncommitted. Existing Task 13 work was preserved.

### Scope and changed files

- `server/routes/profiles.ts`: adds authenticated profile deletion with ownership checks, active-profile protection, last-profile protection, and transactional cleanup of profile-scoped records before blocks/pages/profile deletion.
- `src/services/api.ts`: adds the profile deletion client method.
- `src/components/BuilderStudio.tsx`: resets profile-scoped settings/data when switching or creating profiles, reloads settings-side data on profile identity changes, and adds accessible delete controls and confirmation dialog for inactive profiles.
- `tests/profile_switching_onboarding.test.ts`: covers registration/onboarding, public Home availability, profile switching isolation, failed-switch context preservation, deletion, and stale-token rejection.

### Findings and behavior

- Registration already creates a real editable Home page and starter link, and the starter copy is instructional/example content rather than a fabricated customer, metric, testimonial, purchase, or provider claim.
- Profile selection already issued a new profile-scoped JWT and refreshed the main profile/page state, but settings inputs and settings-tab data were not fully keyed by profile ID. Switching profiles with the same plan could leave stale forms, subscribers, analytics, provider status, or settings values visible.
- Profile switching now resets/reloads all profile-scoped inputs and collections, resets selected page to the new Home page, and reruns analytics/subscriber/forms/provider/API-key loading when the profile ID changes. Failed selection leaves the existing profile/token/context unchanged.
- Profile deletion is restricted to another profile owned by the same account. The active profile cannot be deleted, and an account cannot delete its only profile. Profile-scoped tables are explicitly cleaned in a transaction before the profile is removed.
- External billing cancellation is not claimed by this endpoint. A future account/profile lifecycle task must coordinate external subscription cancellation before removing a paid profile.

### Acceptance criteria

- PASS — A new user reaches an editable Home page and valid public URL. Evidence: registration creates Home and starter content; regression obtains `/api/studio/profile` and `/api/profiles/:username` successfully.
- PASS — Switching between two profiles does not expose the other profile's pages, blocks, forms, subscribers, or provider context. Evidence: `tests/profile_switching_onboarding.test.ts` switches profiles and verifies isolated studio/subscriber/form responses; source resets all settings-scoped state.
- PASS — Failed switches preserve the previous context. Evidence: unauthorized target returns 404 and the active profile remains unchanged.
- PASS — Plan limits remain server-enforced. Evidence: existing multiprofile and subscription entitlement tests continue to pass; creation still uses centralized entitlement limits.
- PASS — Profile deletion is ownership-checked, active-profile protected, and transactionally cleans profile-scoped records. Evidence: new regression deletes an inactive profile, rejects active deletion, and verifies stale token failure.
- PASS — Empty onboarding/settings states remain honest; no invented testimonials, metrics, customers, purchases, or provider success claims were added.
- NOT RUN — Browser first-run, switch, delete-dialog focus, responsive behavior, Arabic/English visual rendering, and deployed-session verification; browser/deployment tooling was unavailable.
- NOT RUN — Physical upload-file removal and external billing cancellation during profile deletion; the endpoint removes database ownership records but does not claim external cancellation or verify storage-provider cleanup.

### Exact commands and outcomes

- `task14_db=$(mktemp -d /tmp/liinx-task14-db-XXXXXX); task14_uploads=$(mktemp -d /tmp/liinx-task14-uploads-XXXXXX); DATABASE_PATH="$task14_db/liinx.db" UPLOADS_DIR="$task14_uploads" NODE_ENV=test npm run lint && DATABASE_PATH="$task14_db/liinx.db" UPLOADS_DIR="$task14_uploads" NODE_ENV=test npm test -- --run tests/profile_switching_onboarding.test.ts tests/multiprofile.test.ts tests/account_recovery.test.ts tests/subscription_entitlements.test.ts` — PASS, typecheck plus 4 files / 12 tests.
- `task14_full=$(mktemp -d /tmp/liinx-task14-full-XXXXXX); mkdir -p "$task14_full/uploads"; DATABASE_PATH="$task14_full/liinx.db" UPLOADS_DIR="$task14_full/uploads" NODE_ENV=test npm test` — PASS, 34 files / 223 tests.
- `task14_build=$(mktemp -d /tmp/liinx-task14-build-XXXXXX); mkdir -p "$task14_build/uploads"; DATABASE_PATH="$task14_build/liinx.db" UPLOADS_DIR="$task14_build/uploads" NODE_ENV=test npm run build` — PASS, Vite build and prerender completed; 10 routes prerendered. Existing warning: one generated chunk exceeds 500 kB.
- `git diff --check` — PASS after the final ledger edit.
- Browser/deployed provider verification — NOT RUN; no browser automation, production deployment, or external provider credentials were used.

### Existing test utilities and remaining risks

- Vitest/Supertest, SQLite global setup, and disposable `mktemp` database/uploads directories were used. No production data was used.
- The client delete confirmation uses the shared accessible `Modal`; actual keyboard/focus behavior remains browser-unverified.
- Profile deletion currently removes uploaded-file database records but does not physically unlink files or coordinate external billing cancellation. Those actions require a dedicated lifecycle policy and safe storage/provider verification.
- Settings refresh is source/API verified; a real browser is still needed to confirm no stale controlled-input values during rapid switching.

### Next eligible prompt

`15 — Page-isolated preview`

## Task 15 — Page-isolated preview

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `7914ff8` (`feat: add profile deletion functionality with backend endpoint, frontend UI, and tests`) at task start. Task 15 changes remain uncommitted. Existing Task 14 work was preserved.

### Scope and changed files

- `src/components/PublicBioView.tsx`: makes `previewOnly` interaction-safe at the public-view boundary, blocking click and submit propagation so links, redirects, forms, newsletter capture, and content gates cannot perform real actions.
- `src/components/ViewportPreview.tsx`: retained the real iframe viewport with 390, 768, and 1280 CSS-pixel widths; it renders the selected page profile object and filtered blocks.
- `src/components/BuilderStudio.tsx`: marks fullscreen navigation as a one-shot inert preview.
- `src/App.tsx`: consumes the fullscreen-preview marker and passes `previewOnly` to the public view without changing ordinary public routes.

### Findings and behavior

- The editor already filtered blocks to the selected page and passed the current draft profile/theme to `ViewportPreview`; no cross-page state copy was introduced.
- The viewport is a real iframe with CSS media queries applied at the target width; scaling only fits that iframe into the available editor column.
- `previewOnly` already skipped profile fetch, analytics consent/script injection, redirects, and view recording for embedded previews. The new event guards additionally prevent nested links/buttons/forms from launching external navigation, submitting forms/newsletter data, unlocking gates, or triggering creator actions.
- Fullscreen preview now uses a session marker consumed once by `PublicProfilePage`, so it remains a preview rather than silently opening an interactive live page. Normal direct public URLs remain interactive and continue to use the published API.
- Existing content uses the selected `profile.page`, `profile.pages`, filtered blocks, current theme, and current controlled draft settings supplied by the editor. No invented preview metrics or submissions were added.

### Acceptance criteria

- PASS — Mobile, tablet, and desktop preview widths are 390, 768, and 1280 CSS pixels in a real iframe. Evidence: `ViewportPreview.tsx` source inspection and successful production build.
- PASS — Preview receives only the selected page's blocks and current draft settings. Evidence: `BuilderStudio.tsx` supplies `visibleBlocks`, selected `activePage`, and current theme; source page filtering was revalidated.
- PASS — Preview includes correct page navigation state. Evidence: `PublicBioView` receives the selected page and uses `aria-current` for the active published page; embedded preview interaction is inert.
- PASS — Preview cannot submit forms, record views/clicks, launch redirects, or unlock gates. Evidence: `previewOnly` skips analytics/fetch/redirect effects and capture guards stop click/submit handlers. No browser network assertion was available.
- PASS — Fullscreen preview is also inert and one-shot. Evidence: session marker in `BuilderStudio.tsx`/`App.tsx` and preview guards.
- NOT RUN — Browser verification at 390/768/1280 with Home and two subpages, visual published-vs-preview comparison, back/forward navigation, and network inspection for zero requests; browser automation was unavailable.
- NOT RUN — Live external embed/provider network behavior inside previews; provider credentials and browser network tooling were unavailable.

### Exact commands and outcomes

- `task15_db=$(mktemp -d /tmp/liinx-task15-db-XXXXXX); task15_uploads=$(mktemp -d /tmp/liinx-task15-uploads-XXXXXX); DATABASE_PATH="$task15_db/liinx.db" UPLOADS_DIR="$task15_uploads" NODE_ENV=test npm run lint && DATABASE_PATH="$task15_db/liinx.db" UPLOADS_DIR="$task15_uploads" NODE_ENV=test npm test -- --run tests/published_pages_routing.test.ts tests/backend-e2e.dynamic.test.ts tests/analytics.test.ts` — PASS, typecheck plus 2 discovered files / 6 tests; `tests/analytics.test.ts` was not present and therefore did not add a test file.
- `task15_full=$(mktemp -d /tmp/liinx-task15-full-XXXXXX); mkdir -p "$task15_full/uploads"; DATABASE_PATH="$task15_full/liinx.db" UPLOADS_DIR="$task15_full/uploads" NODE_ENV=test npm test` — PASS, 34 files / 223 tests.
- `task15_build=$(mktemp -d /tmp/liinx-task15-build-XXXXXX); mkdir -p "$task15_build/uploads"; DATABASE_PATH="$task15_build/liinx.db" UPLOADS_DIR="$task15_build/uploads" NODE_ENV=test npm run build` — PASS, Vite build and prerender completed; 10 routes prerendered. Existing warning: one generated chunk exceeds 500 kB.
- `git diff --check` — PASS after the final ledger edit.
- Browser/network journey — NOT RUN; no browser automation was available.

### Existing test utilities and remaining risks

- Vitest/Supertest and disposable `mktemp` SQLite/uploads directories were used. Existing API/public regression tests passed; no production data was used.
- Source-level guards do not prove browser network silence or visual equivalence. A browser test should create distinct content on three pages, inspect each iframe at all widths, and assert no analytics/form/gate/redirect requests.
- External media iframe resources may still load passively if present in preview content; interaction is blocked, but provider network isolation needs browser verification and may require replacing embeds with static placeholders in preview mode.
- Published rendering remains intentionally interactive; only explicit editor previews are inert.

### Next eligible prompt

`16 — Profile identity editor`

## Task 16 — Profile identity editor

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `4951863` (`feat: implement page-isolated inert preview mode to block interactions in previews`) at task start. Task 16 changes remain uncommitted. Existing Task 15 work was preserved.

### Scope and changed files

- `server/contracts.ts`: trims and validates display name, biography, category, and editable username constraints at the shared profile boundary.
- `server/routes/profiles.ts`: supports authenticated username changes with reserved-name/availability checks, cache invalidation, and refreshed session token/cookie.
- `src/services/api.ts`: accepts the refreshed profile-update token.
- `src/components/BuilderStudio.tsx`: adds username/handle editing with availability feedback, visible length/format constraints, and loading/error states; preserves existing avatar upload flow and adds missing-avatar fallback.
- `src/components/PublicBioView.tsx`: adds safe missing-avatar fallback for public rendering.
- `tests/profile_identity.test.ts`: covers validation, Arabic/mixed-direction text, unavailable handles, stale-save failures, public URL changes, and missing-avatar data.

### Findings and behavior

- Display name, bio, category, and avatar controls already existed, but username was not editable from the identity editor and identity text constraints were not visible. Username is now editable only through server validation: lowercase letters/numbers/underscores, 3–30 characters, reserved-name rejection, and duplicate-name 409 handling.
- A successful handle change issues a new profile-scoped JWT/cookie, invalidates old and new public-profile cache keys, and updates the client profile. The old public URL is no longer served; no redirect history is invented.
- QR defaults derive from the current `profile.username`, so the editor’s QR modal follows the updated handle. Public canonical/OG URLs derive from the routed username and therefore follow the new URL on the next public request.
- Avatar uploads continue using the existing validated image uploader (JPG/PNG/WEBP/GIF, 5MB limit). No crop tool exists in the current stack; the product keeps the uploaded image and uses object-fit presentation. Missing/broken avatar URLs fall back to the repository favicon rather than rendering a broken image.
- `verified` remains read-only in the public/studio data model; no verification claim or customer-facing verification program was added.
- Save failures use existing revision conflicts and inline error handling. Username availability is checked before the authoritative save, while the server remains the final authority for races.

### Acceptance criteria

- PASS — Display name, biography, category, and username controls are present with constraints. Evidence: editor fields and shared schema; empty/overlong identity tests pass.
- PASS — Arabic and mixed-direction text persists safely. Evidence: `tests/profile_identity.test.ts` saves and reads Arabic/mixed text.
- PASS — Unavailable usernames are rejected. Evidence: test receives 409 for a handle owned by another account.
- PASS — Handle changes update public routing/session/cache behavior. Evidence: test confirms old URL 404, new URL 200, and response contains a refreshed token; QR/canonical sources derive from current username.
- PASS — Verification is controlled and non-editable. Evidence: no profile update field exists for `verified`; it remains server-managed.
- PASS — Missing avatars have safe fallback rendering. Evidence: public avatar response remains valid and both studio/public image components install `/favicon.svg` on load failure.
- PASS — Stale save failures remain explicit. Evidence: stale revision update returns 409 and does not overwrite the acknowledged save.
- NOT RUN — Browser slow-upload journey, crop interaction, keyboard/focus behavior, responsive rendering, and Arabic visual layout; browser automation was unavailable. Slow upload behavior remains covered only by existing upload request/error handling, not a timed browser test.
- NOT RUN — Live CDN/cache propagation, QR image generation after a handle change, and deployed canonical metadata; external/deployed verification was unavailable.

### Exact commands and outcomes

- `task16_db=$(mktemp -d /tmp/liinx-task16-db-XXXXXX); task16_uploads=$(mktemp -d /tmp/liinx-task16-uploads-XXXXXX); DATABASE_PATH="$task16_db/liinx.db" UPLOADS_DIR="$task16_uploads" NODE_ENV=test npm run lint && DATABASE_PATH="$task16_db/liinx.db" UPLOADS_DIR="$task16_uploads" NODE_ENV=test npm test -- --run tests/profile_identity.test.ts tests/api.test.ts tests/security.test.ts tests/profile_switching_onboarding.test.ts` — PASS, typecheck plus 4 files / 49 tests.
- `task16_full=$(mktemp -d /tmp/liinx-task16-full-XXXXXX); mkdir -p "$task16_full/uploads"; DATABASE_PATH="$task16_full/liinx.db" UPLOADS_DIR="$task16_full/uploads" NODE_ENV=test npm test` — PASS, 35 files / 225 tests.
- `task16_build=$(mktemp -d /tmp/liinx-task16-build-XXXXXX); mkdir -p "$task16_build/uploads"; DATABASE_PATH="$task16_build/liinx.db" UPLOADS_DIR="$task16_build/uploads" NODE_ENV=test npm run build` — PASS, Vite build and prerender completed; 10 routes prerendered. Existing warning: one generated chunk exceeds 500 kB.
- `git diff --check` — PASS before the final ledger edit; must be rerun after this ledger edit.
- Browser/deployed verification — NOT RUN; no browser automation, CDN, QR provider, or production deployment was used.

### Existing test utilities and remaining risks

- Vitest/Supertest, SQLite global setup, and disposable `mktemp` database/uploads directories were used. No production data was used.
- Handle changes intentionally do not create redirects from the old username. Existing shared links to the old handle will fail unless a future product decision adds redirect retention.
- Broken avatar fallback is source/build verified but not browser-verified; the fallback is a favicon rather than a cropped identity image.
- Profile update responses can refresh the session token for username changes, but other already-open tabs may retain an old JWT until their next session refresh.

### Next eligible prompt

`17 — Social icons and contact links`

## Task 17 — Social icons and contact links

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `03397a92b16b16246e55c61551b6cfd79ca4b5c9` at task start. Existing Task 16 work was preserved. Task 17 changes are currently uncommitted.

### Scope and changed files

- `server/contracts.ts`: adds the version-1 social-link contract for supported providers, `mailto:`, and `tel:`; checks protocol, provider hostname, purpose, length, and duplicate destinations. Adds public normalization that filters malformed legacy entries without deleting stored data.
- `server/routes/profiles.ts`: uses normalized social data for both public profile response paths.
- `src/types.ts`: adds `phone` as a supported social/contact platform.
- `src/components/BuilderStudio.tsx`: replaces implicit URL prefixing with inline validation; adds editable URL fields, keyboard-operable reorder/remove controls, duplicate errors, provider-specific add options, and Arabic UI translations through the existing translation layer.
- `src/components/PublicBioView.tsx`: renders phone and TikTok fallbacks, adds accessible labels and LTR direction, and refuses unsafe public hrefs.
- `src/config/runtimeTranslations.ts`: adds Arabic translations for the new validation and control labels.
- `tests/social_links.test.ts`: covers persistence/order round trips, Arabic provider handles, invalid protocols, provider mismatch, invalid contact formats, and duplicate destinations.

### Findings and behavior

- The previous implementation only added/removed links, auto-prefixed arbitrary input with `https://`, and accepted any safe protocol for every platform. That was a current defect, not merely an old review hypothesis.
- Social providers now require HTTP(S) hosts matching the selected provider (`instagram.com`, `tiktok.com`, `youtube.com`/`youtu.be`, `spotify.com`, `twitter.com`/`x.com`, `github.com`, or `linkedin.com`). Email requires a valid `mailto:` address; phone requires a valid `tel:` number.
- Exact duplicate destinations are rejected server-side and client-side. Updates remain authenticated through the existing profile endpoint and therefore retain profile ownership/revision handling.
- Public legacy JSON is filtered at deserialization. Invalid stored links remain in storage for later repair rather than being silently deleted; valid images/media and existing compatible social records are preserved.
- Public icons have recognizable provider icons where the current icon library supports them, with explicit `AtSign`/external fallback for TikTok/unknown values. Anchors have accessible labels, safe href handling, and `dir="ltr"` so Arabic page direction does not reverse handles or addresses.
- No OAuth or external provider integration was added; links are display-only.

### Acceptance criteria

- PASS — Supported social providers, email, and phone can be validated, persisted, returned by studio API, and returned by public API in deterministic order. Evidence: `tests/social_links.test.ts` (9 tests pass).
- PASS — Edit/reorder/remove controls exist and are keyboard-operable native inputs/buttons. Evidence: `BuilderStudio.tsx` source inspection; reorder controls are disabled at boundaries and all controls have labels. Browser focus journey is external/unverified below.
- PASS — Unsafe protocols are rejected server-side. Evidence: `javascript:` regression test returns HTTP 400.
- PASS — Provider/destination mismatches and malformed contact formats are rejected server-side. Evidence: mismatch, HTTPS-email, mailto-phone, and invalid mailto tests return HTTP 400.
- PASS — Duplicate accidental entries are rejected without replacing the prior saved list. Evidence: duplicate regression test returns HTTP 400 and reload matches the preexisting list.
- PASS — Arabic handles and contact addresses remain direction-safe in public rendering. Evidence: Arabic-path persistence test plus public anchor `dir="ltr"` and safe URL normalization source inspection.
- PASS — Legacy malformed links are not made clickable by public rendering and are not blindly deleted. Evidence: `normalizePublicSocials` filters public output while leaving persistence untouched; `PublicBioView` also applies `safePublicHref`.
- NOT RUN — Browser journey for adding/editing/reordering/removing, keyboard focus, responsive layout, and opening every external destination. Browser automation/provider live checks were unavailable.

### Exact commands and outcomes

- `git rev-parse HEAD` — PASS, baseline `03397a92b16b16246e55c61551b6cfd79ca4b5c9` on `main`.
- `task17_root=$(mktemp -d /tmp/liinx-task17-XXXXXX); mkdir -p "$task17_root/uploads"; DATABASE_PATH="$task17_root/liinx.db" UPLOADS_DIR="$task17_root/uploads" NODE_ENV=test npm run lint && DATABASE_PATH="$task17_root/liinx.db" UPLOADS_DIR="$task17_root/uploads" NODE_ENV=test npm test -- tests/social_links.test.ts tests/api.test.ts tests/public_pages_routing.test.ts` — PASS, typecheck and 2 discovered test files / 32 tests. `tests/public_pages_routing.test.ts` was not present in this checkout, so it added no test file.
- `task17_full=$(mktemp -d /tmp/liinx-task17-full-XXXXXX); mkdir -p "$task17_full/uploads"; DATABASE_PATH="$task17_full/liinx.db" UPLOADS_DIR="$task17_full/uploads" NODE_ENV=test npm run lint && DATABASE_PATH="$task17_full/liinx.db" UPLOADS_DIR="$task17_full/uploads" NODE_ENV=test npm test` — FAIL outside Task 17: typecheck passed; 33 files / 226 tests passed, 6 failed in existing `api_v1.test.ts` authentication flow, `concurrency.test.ts` newsletter race assertion, and `concurrent_revisions.test.ts` with `ECONNRESET`. These failures do not exercise social-link behavior and were not changed.
- `npm run build` — PASS, Vite production build and prerender completed; 10 routes prerendered. Existing warning: one generated chunk exceeds 500 kB.
- `git diff --check` — PASS.
- Browser/live external destination verification — NOT RUN; no production data, OAuth, or external messages were used.

### Existing test utilities and remaining risks

- Vitest/Supertest, the SQLite global setup, and disposable `mktemp` database/uploads directories were used. No production database or uploads directory was used.
- UI behavior is source/build verified but not browser verified. The next useful regression is a browser journey covering add/edit/reorder/delete with keyboard navigation and reload at both Arabic and English page direction.
- Public API consumers should use the normalized social list; the React renderer independently guards hrefs. External destinations, provider availability, and deployed cache behavior remain unverified.
- Existing full-suite failures in API-v1/concurrency/revision tests remain separate defects/environment-sensitive failures and were not widened into this task.

### Next eligible prompt

`18 — Theme selection and persistence`

## Task 18 — Theme selection and persistence

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `1e9713af57aeb433308577e454e2ff5599eb7899` at task start. Existing Task 17 changes were preserved. Task 18 changes are currently uncommitted.

### Scope and changed files

- `server/contracts.ts`: restricts preset IDs and custom theme values to supported enums and safe color, gradient, border, radius, font, button, and shadow tokens; rejects arbitrary utility-class/CSS fragments.
- `src/utils/colorContrast.ts`: normalizes legacy flattened aliases (`background`, `surface`, `text`, `accent`, `radius`) at the render boundary, safely falls back incomplete records, and filters invalid colors/gradients/borders before contrast handling.
- `src/components/BuilderStudio.tsx`: makes preset replacement explicit, keeps individual overrides in profile state and autosave, and adds card surface/border controls alongside radius/accent controls.
- `src/config/runtimeTranslations.ts`: adds Arabic UI copy for preset and surface/border behavior.
- `tests/theme_persistence.test.ts`: covers all presets, persistence/public transformation, invalid theme fragments, legacy aliases, and incomplete records.

### Findings and behavior

- Preset selection already existed, but individual radius/accent updates changed only the local resolved theme and queued persistence; profile state could remain stale until reload. This was a current state-consistency defect.
- Presets intentionally replace all appearance overrides with the selected preset. The editor now states this directly beside the preset picker.
- `resolveTheme` is the shared transformation used by editor, iframe preview, phone preview, and public rendering. It applies legacy aliases, preset fallback, safe token fallback, and contrast normalization consistently.
- Existing valid presets are retained. Incomplete or legacy custom records are repaired at read/render time without destructive database rewriting.
- Theme persistence remains profile-scoped and uses the existing revision-aware profile save queue. Profile duplication continues to copy the theme fields; existing duplication regression coverage confirms this behavior.
- Contrast normalization can adjust rendered text/accent colors for readability, but it does not mutate the saved creator choices. The saved values remain available for later correction or inspection.

### Acceptance criteria

- PASS — Every existing preset can be selected and persisted. Evidence: regression test iterates all `THEMES` entries; all requests return 200.
- PASS — Individual radius, accent, card-surface, and border overrides use the shared contract and persist through profile state/autosave. Evidence: editor handlers and API round-trip test.
- PASS — Preset reset/preservation behavior is defined and visible. Evidence: preset handler replaces overrides and UI note says selection replaces custom appearance overrides.
- PASS — Editor, preview, saved data, and public renderer use the same theme transformation. Evidence: `resolveTheme` call sites and studio/public round-trip tests.
- PASS — Incomplete legacy records normalize safely. Evidence: `colorContrast.test.ts` and alias normalization regression test.
- PASS — Arbitrary unsupported utility-class/CSS fragments are rejected. Evidence: `made-up-theme`, `rounded-xl`, and `bg-red-500` return HTTP 400.
- PASS — Profile duplication preserves theme data without new theme-specific identifiers or secrets. Evidence: existing `profile_duplication.test.ts` plus shared transform coverage.
- NOT RUN — Browser selection/reload/duplicate journey, visual preview/public comparison, and contrast perception across all presets; browser automation was unavailable.

### Exact commands and outcomes

- `git rev-parse HEAD` — PASS, baseline `1e9713af57aeb433308577e454e2ff5599eb7899` on `main`.
- `task18_final=$(mktemp -d /tmp/liinx-task18-final-XXXXXX); mkdir -p "$task18_final/uploads"; DATABASE_PATH="$task18_final/liinx.db" UPLOADS_DIR="$task18_final/uploads" NODE_ENV=test npm run lint && DATABASE_PATH="$task18_final/liinx.db" UPLOADS_DIR="$task18_final/uploads" NODE_ENV=test npm test -- tests/theme_persistence.test.ts tests/colorContrast.test.ts tests/profile_duplication.test.ts && git diff --check` — PASS, typecheck plus 3 files / 7 tests; diff check passed.
- `task18_check=$(mktemp -d /tmp/liinx-task18-check-XXXXXX); mkdir -p "$task18_check/uploads"; DATABASE_PATH="$task18_check/liinx.db" UPLOADS_DIR="$task18_check/uploads" NODE_ENV=test npm test -- tests/api.test.ts tests/acceptance.test.ts tests/e2e-workflow.test.ts tests/resilience.test.ts` — PASS, 4 files / 73 tests.
- `npm run build && git diff --check` — PASS, Vite build and prerender completed; 10 routes prerendered. Existing warning: one generated chunk exceeds 500 kB.
- Browser/deployed verification — NOT RUN; no production data, deployment, or external provider was used.

### Existing test utilities and remaining risks

- Vitest/Supertest, SQLite global setup, and disposable `mktemp` database/uploads directories were used. No production data was changed.
- Browser verification is still needed for the visual result of every preset, saved reload behavior, profile duplication comparison, keyboard controls, and Arabic/RTL presentation.
- Existing full-suite failures recorded in Task 17 remain outside this task; this task’s relevant suites passed.

### Next eligible prompt

`19 — Background media`

## Task 19 — Background media

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `353df4a868855dd8db8f4e99e2f1ca29f256ac61` at task start. Existing Task 18 changes were preserved. Task 19 changes are currently uncommitted.

### Scope and changed files

- `server/contracts.ts`: accepts safe HTTP(S) or validated upload paths for background media and retains image/video type validation.
- `server/routes/profiles.ts`: enforces paid background-media writes and hides background media from public responses for free plans while allowing cleanup.
- `src/components/BuilderStudio.tsx`: adds paid-plan background-image upload using the existing image uploader, preserves URL/type controls, and explains the free-plan restriction and upload/save state.
- `src/components/PublicBioView.tsx`: validates media hrefs, supports centered image backgrounds and readable overlays, layers video below content with pointer-events disabled, uses metadata-only preload, and suppresses autoplay under `prefers-reduced-motion`.
- `src/config/runtimeTranslations.ts`: adds Arabic copy for background upload, failure, and entitlement states.
- `tests/background_media.test.ts`: covers free-plan enforcement, paid image/video persistence, downgrade hiding, cleanup, unsafe URLs, and unsupported types.

### Findings and behavior

- Background URL/type controls already existed, but the server did not enforce the paid restriction that the UI implied, and public payloads could continue exposing background media after downgrade. These were current defects.
- Existing image/video backgrounds remain supported. Image URLs use safe href validation, centered/cover rendering, and the theme background remains underneath as a failure fallback. Uploaded images use the existing magic-byte-validated uploader and upload directory.
- Video backgrounds are muted, looped, inline, metadata-preloaded, pointer-transparent, and placed below the header/content stacking layers. Reduced-motion users receive the theme background/overlay instead of autoplaying video.
- A restrained dark overlay is present only when valid media is configured, improving text readability without modifying saved theme/media choices. Controls remain above the media layer and clickable.
- Free profiles cannot enable background media through the API; existing media is hidden publicly after downgrade. Clearing media remains available so legacy paid content is not trapped.
- No stock-photo, video, or external provider dependency was introduced.

### Acceptance criteria

- PASS — Solid, gradient, image, and video backgrounds retain support through the existing theme/media pipeline. Evidence: shared renderer inspection, existing theme tests, and successful build.
- PASS — Image upload/URL controls and video URL/type controls provide success/error/fallback behavior. Evidence: existing uploader integration plus API persistence tests; browser upload feedback is unverified below.
- PASS — Paid restrictions apply server-side and public rendering. Evidence: free enable returns 403; after downgrade public media fields are null; cleanup succeeds.
- PASS — Unsafe media URLs and unsupported media types fail cleanly. Evidence: `javascript:` and `audio` type requests return HTTP 400.
- PASS — Video does not cover controls or create autoplay audio. Evidence: `pointer-events-none`, z-index layering, `muted`, `playsInline`, and `preload="metadata"` source inspection.
- PASS — Media failure has a theme fallback rather than an empty page. Evidence: safe href gating leaves the resolved theme background in place; missing/invalid media is not applied.
- NOT RUN — Browser tests for portrait/landscape rendering, unavailable media, slow network, unsupported remote video, mobile viewport, reduced-motion preference, text contrast perception, and control clicks. Browser automation and live media providers were unavailable.

### Exact commands and outcomes

- `git rev-parse HEAD` — PASS, baseline `353df4a868855dd8db8f4e99e2f1ca29f256ac61` on `main`.
- `task19_final=$(mktemp -d /tmp/liinx-task19-final-XXXXXX); mkdir -p "$task19_final/uploads"; DATABASE_PATH="$task19_final/liinx.db" UPLOADS_DIR="$task19_final/uploads" NODE_ENV=test npm run lint && DATABASE_PATH="$task19_final/liinx.db" UPLOADS_DIR="$task19_final/uploads" NODE_ENV=test npm test -- tests/background_media.test.ts tests/theme_persistence.test.ts tests/colorContrast.test.ts tests/api.test.ts && npm run build && git diff --check` — PASS, typecheck plus 4 files / 33 tests; production build/prerender completed with 10 routes; diff check passed. Existing warning: one generated chunk exceeds 500 kB.
- Browser/deployed/live-media verification — NOT RUN; no production data, deployment, stock-media provider, or external messages were used.

### Existing test utilities and remaining risks

- Vitest/Supertest, SQLite global setup, and disposable `mktemp` database/uploads directories were used. No production database or uploads directory was changed.
- Remote media content is not byte-verified by the background URL field; unavailable or mislabeled remote media falls back visually, but browser verification is needed for provider-specific behavior.
- The image upload control is implemented; video remains URL-based because the existing general document uploader does not establish a dedicated video-only background lifecycle. A future task may define that if product requirements require local video upload.
- Browser verification remains needed for reduced-motion/mobile behavior, slow connections, and visual contrast across portrait/landscape assets.

### Next eligible prompt

`20 — Typography and custom CSS`

## Task 20 — Typography and custom CSS

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `7bfc9e060d6c8683124e2ba8fa48eacaf2aa1551` at task start. Existing Task 19 changes were preserved. Task 20 changes are currently uncommitted.

### Scope and changed files

- `server/contracts.ts`: makes creator CSS policy part of the shared profile contract and restricts custom font URLs to HTTPS Google Fonts stylesheets.
- `server/routes/profiles.ts`: rejects unscoped/dangerous CSS and unsupported font sources, and filters legacy unsafe CSS/font values from public responses without deleting stored creator data.
- `src/utils/fontValidation.ts`: adds the shared client-side font-source allowlist.
- `src/components/PublicBioView.tsx`: loads allowed custom font stylesheets in the public document with normal fallback behavior.
- `src/components/ViewportPreview.tsx`: removes duplicate unrestricted font injection so preview uses the public renderer’s same font-loading path.
- `src/components/BuilderStudio.tsx`: documents the CSS/font policy in the editor UI.
- `src/config/runtimeTranslations.ts`: adds Arabic policy copy.
- `tests/custom_css_font.test.ts`: covers valid persistence, unsafe/unscoped CSS, unsupported font sources, and CSP alignment.

### Findings and behavior

- Existing custom CSS was only checked for a few dangerous substrings and could use unscoped selectors or rules affecting stacking/visibility. Existing custom font URLs accepted any HTTP(S) host even though CSP only allowed Google Fonts sources. These were current defects.
- Creator CSS must target `#public-bio-view`; imports, external `url()`, script-like constructs, global selectors, control-obscuring positioning/z-index/pointer rules, hidden/display-none rules, keyframes, and font-face declarations are rejected.
- Custom fonts must use HTTPS `fonts.googleapis.com` stylesheets, matching the existing CSP `style-src` and `font-src` directives. Blocked/offline fonts naturally fall back to the selected theme’s system font stack; unsupported sources are rejected and explained.
- Public output applies only validated custom CSS and font URLs. Preview renders the same `PublicBioView` path in its isolated iframe, so creator styles do not reach studio/auth/consent controls or another profile document.
- Existing supported theme font choices (`sans`, `display`, `mono`) remain unchanged. No CSP relaxation or new font provider was added.
- CSS/URL rejection does not claim the style applied; editor errors use the existing save-error path.

### Acceptance criteria

- PASS — Supported font selection, font loading, and fallback are preserved. Evidence: theme font stack remains in `resolveTheme`; public and preview use the allowlisted stylesheet loader; successful build.
- PASS — Custom font URL policy is reconciled with CSP. Evidence: Google Fonts URL accepted, non-Google source rejected, and CSP header regression asserts `fonts.googleapis.com`/`fonts.gstatic.com` sources.
- PASS — Creator styles are scoped to the public page/preview. Evidence: contract rejects unscoped selectors; preview is an iframe and public style is rendered inside `#public-bio-view`.
- PASS — Unsafe CSS/imports/URLs are rejected. Evidence: tests reject `@import`, unscoped control selectors, fixed/z-index control-obscuring rules, and unsupported font hosts with HTTP 400.
- PASS — Incomplete/legacy public styles fail safely without deleting stored data. Evidence: public response filters values before rendering; theme/font fallback logic remains deterministic.
- PASS — Arabic/RTL typography remains supported. Evidence: existing public main direction logic and iframe language/direction setup were preserved; no global document direction changes were introduced.
- NOT RUN — Browser reload/preview font rendering, offline/slow font loading, visual RTL verification, cross-profile isolation, and manual checks that mandatory consent/control UI remains visible. Browser automation and live font-provider verification were unavailable.

### Exact commands and outcomes

- `git rev-parse HEAD` — PASS, baseline `7bfc9e060d6c8683124e2ba8fa48eacaf2aa1551` on `main`.
- `task20_final=$(mktemp -d /tmp/liinx-task20-final-XXXXXX); mkdir -p "$task20_final/uploads"; DATABASE_PATH="$task20_final/liinx.db" UPLOADS_DIR="$task20_final/uploads" NODE_ENV=test npm run lint && DATABASE_PATH="$task20_final/liinx.db" UPLOADS_DIR="$task20_final/uploads" NODE_ENV=test npm test -- tests/custom_css_font.test.ts tests/colorContrast.test.ts tests/api.test.ts tests/acceptance.test.ts && npm run build && git diff --check` — PASS, typecheck plus 4 files / 62 tests; production build/prerender completed with 10 routes; diff check passed. Existing warning: one generated chunk exceeds 500 kB.
- Browser/deployed/offline font verification — NOT RUN; no production data, deployment, or external messages were used.

### Existing test utilities and remaining risks

- Vitest/Supertest, SQLite global setup, and disposable `mktemp` database/uploads directories were used. No production database or uploads directory was changed.
- The CSS policy is intentionally conservative; unsupported advanced styling is rejected rather than silently represented as working. A future product decision may expand the allowlist with a proper CSS parser and sanitizer.
- Browser checks remain necessary for actual font rendering after reload, blocked font fallback, Arabic typography, preview isolation, and consent/control visibility.
- Existing full-suite failures recorded in prior ledger tasks remain outside this task; the relevant CSS/font/API suites passed.

### Next eligible prompt

`21 — Basic link block`

## Task 21 — Basic link block

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `816d24d1cd97a3df030367fdec7343afe730e0f1` at task start. The worktree was clean; existing Task 20 changes were preserved. Implementation commit: `447cacd53ed99a50fcda065145233509044e3699`.

### Scope and changed files

- `src/components/BuilderStudio.tsx`: creates an honest link draft with no fake destination or marketing badge, and exposes title, destination, subtitle, badge, highlight, icon/emoji, duplicate, and delete controls through the existing editor.
- `src/components/PublicBioView.tsx`: renders only links with a validated destination as `/r/:blockId` tracking anchors; incomplete/invalid links remain visible as non-clickable content instead of appearing functional, and authored icons render accessibly as decorative content.
- `server/routes/analytics.ts`: validates redirect destinations against the shared safe-link protocol policy and safely preserves legacy bare-host links by normalizing them to HTTPS; unsafe schemes and unfinished values remain inactive.
- `src/types.ts`: permits the persisted null destination used by an honest unpublished/incomplete link draft.
- `tests/basic_link.test.ts`: adds real API regression coverage for create/persist/reload/public rendering, long and Unicode values, icon/badge/highlight fields, tracking/click logging, deletion, unsafe/unfinished destinations, and non-clickable drafts.

### Findings and behavior

- The old Studio action created `url: 'https://'`, which the API rejected, and assigned a `NEW` badge without creator authorship. It now creates `Untitled link` with no badge and an explicit “Add a destination before publishing” subtitle.
- Public basic links use `/r/:blockId` only when the stored destination passes the same safe HTTP(S)/mailto/tel protocol gate. A missing or malformed destination has no `href`, does not increment clicks, and cannot be activated by keyboard as a link.
- New API/editor writes reject malformed, `javascript:`, `data:`, and unfinished `https://` destinations before persistence. Existing bare-host records remain compatible through constrained HTTPS normalization at redirect time; arbitrary schemes and markup are not normalized.
- Creator-authored subtitles, icons, badges, highlight state, long labels, and Unicode destinations round-trip through persistence and public output. No popularity, customer, or performance claim is generated.
- Existing authenticated block ownership, page-aware creation, duplicate, update, and delete routes were retained and exercised; deletion removes the tracking target and the public block.

### Acceptance criteria

- PASS — Create/edit/reload/open a basic link and verify one click event. Evidence: `tests/basic_link.test.ts` creates a 150-character link, reloads Studio/public API state, follows `/r/:id` with HTTP 302, and verifies one persisted `link_clicks` row.
- PASS — Long labels, missing icon/image state, Unicode destination, invalid schemes, and deleted links. Evidence: targeted test covers 150-character title, optional icon, Unicode URL, four rejected destinations, and post-delete public/redirect 404. Basic links use an authored icon/emoji rather than an unvalidated remote thumbnail; no unsafe image path is introduced.
- PASS — Intended tracking path. Evidence: public renderer emits `/r/:blockId`, and redirect test verifies the destination plus click persistence.
- PASS — Honest placeholder/default behavior and no invented marketing badge. Evidence: Studio default has null URL/null badge and explicit incomplete-destination copy; placeholder API/public test confirms no working redirect.
- NOT RUN — Actual browser keyboard activation, visual responsive layout, and manual editor create/edit journey. The required browser-client Node REPL tool was unavailable after capability search; source semantics and native controls were inspected, but this is not browser evidence.
- NOT RUN — Live external destination/provider verification. No external provider is required for this basic-link path; only local safe redirect behavior was tested.

### Exact commands and outcomes

- `git rev-parse HEAD` — PASS, baseline `816d24d1cd97a3df030367fdec7343afe730e0f1` on `main`.
- `tmpdir=$(mktemp -d) && DATABASE_PATH="$tmpdir/liinx.db" UPLOADS_DIR="$tmpdir/uploads" NODE_ENV=test npm test -- --run tests/basic_link.test.ts` — initial run exposed a legacy bare-host compatibility failure; the implementation was adjusted without weakening new-write validation.
- `tmpdir=$(mktemp -d) && DATABASE_PATH="$tmpdir/liinx.db" UPLOADS_DIR="$tmpdir/uploads" NODE_ENV=test npm test -- --run tests/basic_link.test.ts tests/api.test.ts tests/security.test.ts` — PASS, 3 files / 49 tests; uses disposable SQLite and uploads paths. The first invocation’s 49-test run was the only failed intermediate result and is superseded by this passing rerun.
- `npm run lint` — PASS, TypeScript check completed.
- `npm run build` — PASS, Vite production build and prerender completed 10 routes; existing warning: one generated chunk exceeds 500 kB.
- `git diff --check` — PASS before commit.
- Browser/deployed/live-provider verification — NOT RUN; browser-client Node REPL was unavailable, and no production data, deployment, or external messages were used.

### Existing test utilities and remaining risks

- Vitest/Supertest, SQLite global setup, and disposable `mktemp` database/uploads directories are available and were used. No production database or uploads directory was changed.
- The browser-level keyboard, responsive, and visual checks remain open. Native anchors/buttons provide the intended keyboard semantics, but source inspection is not equivalent to an actual browser journey.
- Redirect compatibility intentionally accepts legacy bare-host values only when constrained normalization produces a safe URL. New writes still require explicit safe protocols.
- The editor currently reports asynchronous update failures through the existing save-status path; a future focused UX task may add field-level validation messaging, but this task does not redesign persistence orchestration.

### Next eligible prompt

`22 — Link layouts`

## Task 22 — Link layouts

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `e1a028a8b9a6b3811d705ee2b381b01ea0f59a2f` at task start. The worktree was clean; Task 21 changes were preserved. Implementation commit: `6204b060e2dad864e95ada43e4aacee2fb84e366`.

### Scope and changed files

- `src/components/PublicBioView.tsx`: replaces the negative `:not(.liinx-grid-link)` span rule with an explicit grid model: all direct content items span the full width at desktop/tablet, and only links with `extra.layout === 'grid'` occupy one column. Mobile remains a single-column layout; odd grid counts leave the final card in one normal column.
- `server/contracts.ts`: constrains link layout persistence to `list`, `grid`, or `featured`; ordinary links cannot claim a carousel layout.
- `tests/link_layouts.test.ts`: covers mixed link/list/grid/featured plus heading, form, and video persistence/public deserialization, rejection of `carousel`, and profile-duplication compatibility via the existing duplication suite.

### Findings and behavior

- List, grid, and featured controls already existed, but the public grid wrapper used a negative selector and depended on unrelated block roots. The explicit default-full-span/explicit-grid-span model prevents forms, headings, videos, galleries, and other non-grid blocks from shrinking when any grid link is present.
- Grid links are one column each at `sm` and above and one column at mobile widths. An odd number of grid cards does not stretch or reorder; the final card occupies the next available column.
- List and featured links remain full-width. Featured retains its existing minimum-height treatment; no carousel semantics were added.
- Invalid legacy layout data is normalized out through the existing shared block-extra boundary rather than rendered as an unsupported layout. Existing valid layouts remain compatible.
- Existing profile duplication remaps block identities while retaining layout extras; no duplication implementation was broadened.

### Acceptance criteria

- PASS — List, grid, and featured layouts have an explicit supported model. Evidence: contract enum and renderer span rules; API test round-trips all three values.
- PASS — Non-grid blocks retain intended width when grid links are present. Evidence: mixed API/public test creates grid/list/featured links plus heading, form, and video and confirms all block types remain in the public payload; renderer assigns non-grid direct children the full-span default.
- PASS — Mobile behavior and odd grid counts are defined. Evidence: renderer uses `grid-cols-1` on mobile and two columns at `sm`; no positional or count-dependent redistribution is used. Browser visual verification remains open below.
- PASS — Reload and duplication preserve layout semantics. Evidence: API public reload assertions pass; `tests/profile_duplication.test.ts` passes alongside the layout suite and confirms copied block extras/identities remain independent.
- PASS — Ordinary links are not marked carousel-capable without a carousel implementation. Evidence: `extra.layout: 'carousel'` returns HTTP 400 and public test asserts no carousel layout.
- NOT RUN — Actual browser preview/public checks at supported widths, including visual width of mixed forms/headings/videos and odd-card appearance. Browser-client Node REPL was unavailable; source/API evidence is not browser evidence.

### Exact commands and outcomes

- `git rev-parse HEAD` — PASS, baseline `e1a028a8b9a6b3811d705ee2b381b01ea0f59a2f` on `main`.
- `tmpdir=$(mktemp -d) && DATABASE_PATH="$tmpdir/liinx.db" UPLOADS_DIR="$tmpdir/uploads" NODE_ENV=test npm run lint && DATABASE_PATH="$tmpdir/liinx.db" UPLOADS_DIR="$tmpdir/uploads" NODE_ENV=test npm test -- --run tests/link_layouts.test.ts tests/basic_link.test.ts tests/api.test.ts && npm run build && git diff --check` — PASS, TypeScript check, 3 files / 30 tests, production build/prerender of 10 routes, and diff check. Existing warning: one generated chunk exceeds 500 kB.
- `tmpdir=$(mktemp -d) && DATABASE_PATH="$tmpdir/liinx.db" UPLOADS_DIR="$tmpdir/uploads" NODE_ENV=test npm test -- --run tests/link_layouts.test.ts tests/profile_duplication.test.ts` — PASS, 2 files / 3 tests.
- Browser/deployed visual verification — NOT RUN; no supported browser-client Node REPL was available, and no production data, deployment, or external messages were used.

### Existing test utilities and remaining risks

- Vitest/Supertest, SQLite global setup, and disposable `mktemp` database/uploads directories were used. No production database or uploads directory was changed.
- Browser-level responsive and visual checks remain required for 390/768/1280 or the project’s supported preview widths; API tests cannot establish rendered CSS geometry.
- Tailwind arbitrary child selectors are now positive and explicit, but a future UI test should verify compiled CSS in the actual preview/public browser at mobile and desktop widths.

### Next eligible prompt

`23 — Link animation`

## Task 23 — Link animation

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `09af5c6c7edf44222fc1b65550a90239405db2c7` at task start. The worktree was clean; Task 22 changes were preserved. Implementation commit: `4d552e7271665ae03210f1e44bfdfa920961a0d3`.

### Scope and changed files

- `src/components/PublicBioView.tsx`: maps supported link animation values to dedicated stylesheet classes instead of implicit/generic utility classes.
- `src/index.css`: defines restrained fade, lift, and pulse keyframes/classes; keeps `none` unanimated; disables animation, transitions, and lift transforms under `prefers-reduced-motion`; keeps focus indication independent of hover and movement.
- `tests/link_animation.test.ts`: verifies supported animation persistence and rejects unsupported values at the API boundary.

### Findings and behavior

- The editor exposed `none`, `fade`, `lift`, and `pulse`, but fade relied on an implicit `animate-fade-in` class and pulse relied on a generic utility. These did not provide a sufficiently explicit link-specific stylesheet contract.
- `fade` is a one-time 260ms opacity reveal. `pulse` is a slow, low-contrast 2.8s box-shadow emphasis without layout movement. `lift` is hover-only, uses a 2px transform, and explicitly resets on keyboard focus so the global focus ring works independently.
- `none` adds no animation class. No layout properties are animated. Reduced-motion users receive no link animation or lift transform.
- Unsupported animation values are rejected by the shared link extra schema, so controls cannot persist an inert unsupported choice.
- Existing link tracking, layout, accessibility, and public/preview rendering paths were otherwise preserved.

### Acceptance criteria

- PASS — None, fade, lift, and pulse use real stylesheet definitions. Evidence: dedicated classes/keyframes in `src/index.css`, renderer mapping, and API persistence test.
- PASS — None adds no animation and unsupported choices are rejected. Evidence: `none` round-trips without an animation class in the renderer; `flash` returns HTTP 400.
- PASS — Reduced-motion disables nonessential motion. Evidence: explicit `prefers-reduced-motion` overrides disable fade/pulse animation and lift transition/transform; existing global reduced-motion rules remain in place.
- PASS — Focus indication is independent of hover and does not shift surrounding layout. Evidence: lift has a `:focus-visible` transform reset; existing global `a:focus-visible` outline remains active; only transform/box-shadow/opacity are used.
- NOT RUN — Browser confirmation that each animation is visibly distinct after reload, actual focus-ring appearance, and reduced-motion rendering. Browser-client Node REPL was unavailable; stylesheet/source evidence is not visual browser evidence.

### Exact commands and outcomes

- `git rev-parse HEAD` — PASS, baseline `09af5c6c7edf44222fc1b65550a90239405db2c7` on `main`.
- `tmpdir=$(mktemp -d) && DATABASE_PATH="$tmpdir/liinx.db" UPLOADS_DIR="$tmpdir/uploads" NODE_ENV=test npm run lint && DATABASE_PATH="$tmpdir/liinx.db" UPLOADS_DIR="$tmpdir/uploads" NODE_ENV=test npm test -- --run tests/link_animation.test.ts tests/link_layouts.test.ts tests/basic_link.test.ts tests/profile_duplication.test.ts && npm run build && git diff --check` — PASS, TypeScript check, 4 files / 8 tests, production build/prerender of 10 routes, and diff check. Existing warning: one generated chunk exceeds 500 kB.
- Browser/public/preview visual verification — NOT RUN; no supported browser-client Node REPL was available, and no production data, deployment, or external messages were used.

### Existing test utilities and remaining risks

- Vitest/Supertest, SQLite global setup, and disposable `mktemp` database/uploads directories were used. No production database or uploads directory was changed.
- Visual distinction, keyboard focus appearance, reload persistence in a real browser, and reduced-motion preference behavior remain external checks.
- Pulse uses `color-mix`; the existing browser support baseline should be confirmed if older browsers are supported. It degrades to no pulse without affecting link usability.

### Next eligible prompt

`24 — Headings and rich text`

## Task 24 — Headings and rich text

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `15fa285698a99f6a4323d64b59a672d3e004519e` at task start. The worktree was clean; Task 23 changes were preserved. Implementation commit: `69bb842c57b80230c6527ac55350d90e9b104afa`.

### Scope and changed files

- `src/components/BuilderStudio.tsx`: turns the existing limited editor into an explicit markdown-like editor with caret/selection-aware bold, italic, heading, bulleted-list, numbered-list, and safe-link actions. Adds accessible labels and documents the format; toolbar actions no longer append sample words.
- `src/components/PublicBioView.tsx`: safely renders paragraphs, h2/h3/h4 headings, unordered/ordered lists, bold, italic, and validated links. Literal HTML and unsafe link markup remain escaped text; no HTML injection pipeline was introduced.
- `tests/rich_text.test.ts`: covers Arabic/mixed content, lists, links, literal HTML/script markup, reload/public round-trip, and oversized-update rejection without data loss.

### Findings and behavior

- Existing rich text was stored as plain text and rendered with a small bold/italic/heading parser. Its toolbar inserted fabricated `bold`, `italic`, or `heading` words at the end when no text was selected, and it did not support lists or links.
- The supported format is intentionally limited: paragraphs are newline-separated; `#`, `##`, and `###` produce h2, h3, and h4; `-`/`*` and numbered prefixes produce lists; `**text**` and `*text*` format inline text; `[label](url)` produces a link only for HTTP(S), mailto, or tel protocols.
- Formatting uses the current textarea selection or insertion caret. Bold/italic insert an empty pair at the caret; line formats apply to the current line; link insertion requires selected text plus a creator-entered URL.
- Rendering uses React text nodes rather than `dangerouslySetInnerHTML`; literal `<script>`, HTML tags, and unsafe markdown URLs cannot execute. Unsafe markdown links are shown as literal text.
- Empty rich-text blocks remain an accessible article with a heading and empty paragraph. Heading levels are deterministic and do not skip the supported h2–h4 mapping.

### Acceptance criteria

- PASS — Supports bold, italic, headings, paragraphs, lists, and links in a documented format. Evidence: editor toolbar/help copy, parser implementation, and round-trip test fixture.
- PASS — Toolbar actions operate on selection/insertion position rather than appending sample words. Evidence: caret/selection-based editor implementation; browser interaction remains unverified below.
- PASS — Arabic, mixed-direction content, lists, links, pasted literal markup, and persistence round-trip. Evidence: `tests/rich_text.test.ts` passes API/editor serialization and public deserialization with Arabic and literal HTML content.
- PASS — Unsafe HTML and URLs cannot execute. Evidence: no HTML injection API is used; React escapes literal markup; `safePublicHref` filters markdown link protocols and unsafe links remain text; oversized content is rejected.
- PASS — Empty blocks and heading hierarchy remain accessible. Evidence: empty lines render as paragraphs, headings map to semantic h2/h3/h4 elements, and editor content has an accessible label.
- NOT RUN — Actual browser typing, selection, toolbar activation, undo, paste behavior, reload visual rendering, and keyboard verification. Browser-client Node REPL was unavailable; native textarea undo and source-level selection logic are not equivalent to a browser journey.

### Exact commands and outcomes

- `git rev-parse HEAD` — PASS, baseline `15fa285698a99f6a4323d64b59a672d3e004519e` on `main`.
- `tmpdir=$(mktemp -d) && DATABASE_PATH="$tmpdir/liinx.db" UPLOADS_DIR="$tmpdir/uploads" NODE_ENV=test npm run lint && DATABASE_PATH="$tmpdir/liinx.db" UPLOADS_DIR="$tmpdir/uploads" NODE_ENV=test npm test -- --run tests/rich_text.test.ts tests/contracts.test.ts tests/backend-e2e.dynamic.test.ts && npm run build && git diff --check` — PASS, TypeScript check, 3 files / 10 tests, production build/prerender of 10 routes, and diff check. Existing warning: one generated chunk exceeds 500 kB.
- Browser/editor/deployed verification — NOT RUN; no supported browser-client Node REPL was available, and no production data, deployment, or external messages were used.

### Existing test utilities and remaining risks

- Vitest/Supertest, SQLite global setup, and disposable `mktemp` database/uploads directories were used. No production database or uploads directory was changed.
- Browser verification remains required for actual selection/caret behavior, undo, paste, visual RTL layout, link activation, and reload rendering.
- The editor intentionally does not accept arbitrary HTML, tables, nested rich formatting, or custom link titles. Unsupported markup is displayed literally and should not be represented as supported.

### Next eligible prompt

`25 — Folders and content groups`

## Task 25 — Folders and content groups

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `f3671ff2975b5ea2d5761d56c362db795486e60a` at task start. The worktree was clean; Task 24 changes were preserved. Implementation commit: `a7718fc15b6144a9fc590d0986197bfc3ff37e43`.

### Scope and changed files

- `server/contracts.ts`: permits an intentionally empty folder destination as an honest, non-working draft placeholder while retaining HTTP(S), `mailto:`, and `tel:` validation; the strict item schema rejects nested-folder data and limits item fields.
- `server/routes/analytics.ts`: resolves folder item ids or legacy array indexes before validating and redirecting; records clicks against the parent folder block and returns clear 404/400 responses for missing or invalid destinations.
- `src/components/BuilderStudio.tsx`: adds folder description editing, one-level nesting disclosure, empty-folder state, add/edit/remove controls, and accessible up/down item ordering controls; new items start without a working destination.
- `src/components/PublicBioView.tsx`: adds semantic folder expansion state, accessible relationships, empty state, constrained item overflow, tracked item links, and non-clickable rendering for incomplete/invalid destinations.
- `tests/folders.test.ts`: covers creation, three-item reorder, persistence/public reload, tracked item redirect and attribution, empty destination behavior, nested-folder rejection, unsafe URL rejection, and validation limits.

### Findings and behavior

- Folders are collapsible content groups, distinct from subpages. Supported nesting depth is exactly one folder containing link items; nested folders are rejected at the shared contract boundary and are not claimed by the UI.
- Item identity is retained during reorder and public tracking uses the item id. Legacy items without ids use a validated numeric `itemIndex` fallback.
- Empty destinations remain visible as editable draft placeholders but do not produce working anchors; tracking returns 404. Non-empty unsafe destinations are rejected by validation or redirect sanitization.
- Public expansion uses a native button with `aria-expanded` and `aria-controls`; folder content is constrained with `max-w-full overflow-hidden`. Existing authored destinations and parent-block analytics semantics are preserved.
- The old review hypothesis that folder content was directly rendered without tracking was current and is addressed. The prior presence of a folder menu/control alone was not treated as evidence of complete behavior.

### Acceptance criteria

- PASS — Create a folder with several links, reorder them, reload, and preserve identities/destinations. Evidence: `tests/folders.test.ts` creates three items, reverses them through the API, and verifies Studio/public persistence.
- PASS — Empty, long-content, unsupported, and incomplete states fail or render honestly. Evidence: test coverage for empty destination, nested item, unsafe URL, overlong title, and server-enforced description/item limits; public empty state and non-clickable placeholder are implemented.
- PASS — Destinations open through the intended tracking path and attribution is consistent. Evidence: folder item redirect returns 302 to the item URL and one `link_clicks` row is attributed to the parent folder block.
- PASS — Supported nesting depth is explicit and enforced. Evidence: editor disclosure says one-level folders are not subpages; strict schema rejects nested-folder fields with HTTP 400.
- NOT RUN — Actual browser keyboard activation, narrow viewport overflow, and visual responsive behavior. Native semantic controls and overflow constraints are source evidence only; browser-client Node REPL was unavailable.

### Exact commands and outcomes

- `git rev-parse HEAD` — PASS, baseline `f3671ff2975b5ea2d5761d56c362db795486e60a` on `main`.
- `tmpdir=$(mktemp -d) && DATABASE_PATH="$tmpdir/liinx.db" UPLOADS_DIR="$tmpdir/uploads" NODE_ENV=test npm run lint && DATABASE_PATH="$tmpdir/liinx.db" UPLOADS_DIR="$tmpdir/uploads" NODE_ENV=test npm test -- --run tests/folders.test.ts tests/acceptance.test.ts tests/basic_link.test.ts tests/security.test.ts && npm run build && git diff --check` — PASS, TypeScript check, 4 files / 58 tests, production build/prerender of 10 routes, and diff check. Existing warning: one generated chunk exceeds 500 kB.
- Browser/public visual and keyboard verification — NOT RUN; no supported browser-client Node REPL was available. No production database or uploads directory was used; tests used disposable `mktemp` database/uploads paths.

### Existing test utilities and remaining risks

- Vitest/Supertest, SQLite global setup, and disposable database/uploads directories are the existing test utilities used here.
- Real browser confirmation is still required for keyboard activation, focus behavior, long-content layout at narrow widths, and public visual rendering. Tracking was verified through local API execution, not a deployed browser journey.
- This task does not add nested folders, subpage conversion, or a new analytics model. Existing provider/deployment behavior remains outside this scope.

### Next eligible prompt

`26 — Standalone image block`

## Task 26 — Standalone image block

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `f8c1a8cc0f8d419053cd161a656bb082790d3596` at task start. The worktree was clean; Task 25 changes were preserved. Implementation commit: `042433bfced070e0a311cbef4f61850cfa995f3e`.

### Scope and changed files

- `server/contracts.ts`: extends the image block contract with safe optional destination, alt/decorative semantics, caption, fit, aspect, and crop-position fields; legacy image fields remain compatible.
- `server/routes/analytics.ts`: resolves an image block’s optional `linkUrl` through the existing validated redirect/tracking path.
- `src/components/BuilderStudio.tsx`: wires image URL/upload replacement, alt text, decorative toggle, caption, destination, fit, shape, and crop-position controls to the existing save queue and shared uploader.
- `src/components/PublicBioView.tsx`: renders configured image sizing/crop, safe tracked destinations, meaningful or decorative alt text, translated unavailable fallback, and preview-safe non-navigation behavior.
- `tests/image_block.test.ts`: covers two owned uploads, replacement persistence, Studio/public round-trip, tracked destination, unsafe destination rejection, and retained broken-image data.

### Findings and behavior

- The previous standalone image editor only exposed image URL/upload and the renderer silently omitted the image when empty or broken. It had no destination, caption, accessibility mode, or crop/sizing persistence.
- Replacements use `/api/upload` and create a new owned asset; the prior asset is not deleted, so shared or historically referenced assets are not destroyed.
- New image settings are validated at the shared block boundary. Destinations allow only the existing safe HTTP(S), `mailto:`, or `tel:` protocols. Upload validation remains exclusively in the shared upload service.
- Informative images use authored alt text with a title fallback; decorative images expose an empty alt attribute. Broken or missing images render an honest unavailable state without making the page unusable.
- Public image destinations use `/r/:blockId` and are disabled in preview. Fit (`cover`/`contain`), aspect (`auto`/square/portrait/landscape), and crop position are persisted and used by the public/preview renderer.

### Acceptance criteria

- PASS — Upload and replace images without deleting prior assets. Evidence: `tests/image_block.test.ts` uploads two owned files, verifies distinct paths, replacement persistence, and two `uploaded_files` rows.
- PASS — Edit alt text/caption and persist after reload. Evidence: API update plus Studio/public profile reload assertions.
- PASS — Optional destination is validated and tracked. Evidence: unsafe `javascript:` update returns HTTP 400; valid destination returns HTTP 302 through `/r/:blockId`.
- PASS — Informative and decorative image semantics are supported. Evidence: shared `alt`/`decorative` fields and renderer behavior; informative fallback uses title when authored alt is absent.
- PASS — Broken image data has a useful fallback path. Evidence: renderer has an `onError` status fallback and the test preserves an unreachable image URL without falsely claiming it loaded.
- NOT RUN — Actual browser upload interaction, replacement UI journey, preview/public visual comparison, and responsive image inspection. Browser-client Node REPL was unavailable; API/source evidence is not equivalent to browser evidence.

### Exact commands and outcomes

- `git rev-parse HEAD` — PASS, baseline `f8c1a8cc0f8d419053cd161a656bb082790d3596` on `main`.
- `tmpdir=$(mktemp -d) && DATABASE_PATH="$tmpdir/liinx.db" UPLOADS_DIR="$tmpdir/uploads" NODE_ENV=test npm run lint && DATABASE_PATH="$tmpdir/liinx.db" UPLOADS_DIR="$tmpdir/uploads" NODE_ENV=test npm test -- --run tests/image_block.test.ts tests/audit_fixes.test.ts tests/backend-e2e.dynamic.test.ts tests/preview.test.ts && npm run build && git diff --check` — PASS, TypeScript check, 3 files / 35 tests, production build/prerender of 10 routes, and diff check. Existing warning: one generated chunk exceeds 500 kB.
- Browser/public/preview visual verification — NOT RUN; no supported browser-client Node REPL was available. Tests used disposable `mktemp` SQLite database and uploads directories; no production data or assets were changed.

### Existing test utilities and remaining risks

- Vitest/Supertest, SQLite global setup, and the shared upload route are the existing test utilities and services used here.
- Browser verification remains required for actual upload/replacement controls, image load-error presentation, keyboard activation of linked images, crop appearance, and narrow responsive layout.
- The renderer cannot verify that an external image URL is reachable until the browser requests it; unreachable URLs are handled client-side with the fallback. No image transformation or crop-processing service was introduced.

### Next eligible prompt

`27 — Gallery block`

## Task 27 — Gallery block

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `134a4cfe3899dcdbabe0af5db5c3297de6ad9572` at task start. The worktree was clean; Task 26 changes were preserved. Implementation commit: `1d07819e67fa95df636611d950b162500549d1d1`.

### Scope and changed files

- `server/contracts.ts`: adds a validated optional `linkUrl` to gallery/carousel items while preserving the existing image, alt, caption, and identity contract.
- `server/routes/analytics.ts`: resolves gallery item links through the existing item-id or legacy item-index redirect path.
- `src/components/BuilderStudio.tsx`: adds gallery item link editing and passes stable item ids into shared image uploads; delayed uploads refuse to update removed items and use current state when saving.
- `src/components/PublicBioView.tsx`: renders gallery captions, empty and unavailable-image states, safe optional links, responsive bounded layout, and non-navigating unlinked items without `#` placeholders.
- `tests/gallery_block.test.ts`: covers multi-item persistence/reorder, captions, linked/unlinked tracking, empty galleries, and unsafe-link rejection.

### Findings and behavior

- The existing structured editor already had add/remove/reorder, upload, alt, and caption controls, but gallery items lacked optional links and upload callbacks used mutable indexes. A delayed response could therefore target a different item after deletion/reordering.
- Gallery upload callbacks now carry the item id. At completion, the handler reads the latest block state, updates only that id, and refuses to restore a deleted item. The uploaded file remains an owned asset rather than being destructively removed.
- Public gallery items with no validated link render as non-anchor content. Linked items use the existing tracked redirect and captions are rendered below each image.
- Empty galleries show an explicit empty state. Missing or failed image loads show an unavailable state; layout remains bounded by the existing gallery/card container and carousel overflow behavior.
- Gallery remains a bounded grid/carousel presentation; this task does not expand its layout model or claim arbitrary nesting.

### Acceptance criteria

- PASS — Create a multi-item gallery, edit/reorder/remove, and reload. Evidence: `tests/gallery_block.test.ts` persists three identified items, reverses order, edits a caption, and verifies Studio/public data.
- PASS — Optional links open through tracking; unlinked items do not navigate to `#` or a new tab. Evidence: linked item returns HTTP 302; unlinked item returns HTTP 404; renderer has separate anchor/non-anchor branches and no gallery `#` fallback.
- PASS — Captions appear publicly. Evidence: public profile round-trip includes all reordered captions; renderer explicitly outputs captions.
- PASS — Empty and partial/unavailable states are represented. Evidence: empty-gallery API fixture and renderer empty state; image URL failures have a client fallback.
- PASS — Delayed upload cannot restore a deleted item. Evidence: stable-id upload handler checks current state before updating; no index-based gallery upload callback remains.
- NOT RUN — Actual browser slow-upload/edit/delete race, keyboard interaction, responsive visual overflow, and public image-load fallback. Browser-client Node REPL was unavailable; source/API evidence is not browser evidence.

### Exact commands and outcomes

- `git rev-parse HEAD` — PASS, baseline `134a4cfe3899dcdbabe0af5db5c3297de6ad9572` on `main`.
- `tmpdir=$(mktemp -d) && DATABASE_PATH="$tmpdir/liinx.db" UPLOADS_DIR="$tmpdir/uploads" NODE_ENV=test npm run lint && DATABASE_PATH="$tmpdir/liinx.db" UPLOADS_DIR="$tmpdir/uploads" NODE_ENV=test npm test -- --run tests/gallery_block.test.ts tests/image_block.test.ts tests/audit_fixes.test.ts tests/backend-e2e.dynamic.test.ts && npm run build && git diff --check` — PASS, TypeScript check, 4 files / 37 tests, production build/prerender of 10 routes, and diff check. Existing warning: one generated chunk exceeds 500 kB.
- Browser/editor/public verification — NOT RUN; no supported browser-client Node REPL was available. Tests used disposable `mktemp` SQLite database and uploads directories; no production data or assets were changed.

### Existing test utilities and remaining risks

- Vitest/Supertest, SQLite global setup, disposable database/uploads directories, and the shared upload route were used.
- Real-browser verification remains required for the slow-upload race, keyboard controls, visual responsive grid/carousel behavior, and image load-error fallback.
- An upload whose item is deleted remains in the owner’s uploaded-assets inventory by design; cleanup/lifecycle policy is owned by the file-lifecycle task.

### Next eligible prompt

`28 — Carousel block`

## Task 28 — Carousel block

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `c0f5f06330cf6f66f3621d6edf4ffa77c1aadb23` at task start. The worktree was clean; Task 27 changes were preserved. Implementation commit: `d1f7065c449ec747a0249b84461a2f2e37d64e80`.

### Scope and changed files

- `src/components/PublicBioView.tsx`: replaces the carousel’s horizontal-gallery behavior with active-slide state, previous/next controls, Home/End and arrow-key navigation, touch swipe handling, bounded responsive sizing, captions, safe optional links, empty/unavailable states, and no autoplay.
- `server/contracts.ts`: reuses the gallery item contract, including image, caption, alt, identity, and validated optional link fields.
- `server/routes/analytics.ts`: retains item-id and item-index tracking for carousel destinations through the existing redirect path.
- `tests/carousel_block.test.ts`: covers zero, one, and many slides, long-caption rejection, Arabic slide data, saved ordering, linked/unlinked destinations, and unsafe-link rejection.

### Findings and behavior

- The previous carousel was only a horizontally styled row and had no actual slide controls, active-slide model, keyboard behavior, or touch navigation.
- Carousel autoplay is not offered and is therefore off by default without a hidden timer or external media action. The carousel exposes Previous/Next controls, disables them at the boundaries, supports ArrowLeft/ArrowRight/Home/End, and handles horizontal touch swipes.
- Each active slide keeps its caption visible. Image failures use the existing honest unavailable state. A slide without a validated link renders as content rather than an anchor; linked slides use the existing tracked redirect.
- The carousel is bounded to its card width with a responsive 4:3 slide and `overflow-hidden`, so navigation does not intentionally scroll the document. Focus remains on the carousel or native controls; no focus trap was introduced.
- Slide order remains the persisted item-array order and is shared with the gallery editor contract. Arabic content inherits the public page direction; browser visual verification remains pending.

### Acceptance criteria

- PASS — Zero, one, and many slides are represented and persisted in order. Evidence: `tests/carousel_block.test.ts` covers empty, valid one-slide, oversized-caption rejection, and reordered three-slide fixtures.
- PASS — Long captions are bounded by the shared 500-character contract and rendered in the active slide. Evidence: oversized caption returns HTTP 400; valid captions round-trip in public data.
- PASS — Optional links open through tracking, while unlinked slides do not navigate. Evidence: linked item returns HTTP 302; unlinked item returns HTTP 404 through the redirect endpoint; renderer uses separate anchor/content branches.
- PASS — Actual slide controls exist with keyboard and touch handlers. Evidence: source implementation includes native Previous/Next buttons, ArrowLeft/ArrowRight/Home/End handling, active-slide counter, and touch swipe threshold.
- PASS — Autoplay is off by default. Evidence: no autoplay timer or automatic slide transition exists in the carousel implementation.
- NOT RUN — Browser touch/keyboard journey, RTL visual direction, reduced-motion behavior, focus traversal, and narrow viewport visual inspection. Browser-client Node REPL was unavailable; source/API evidence is not browser evidence.

### Exact commands and outcomes

- `git rev-parse HEAD` — PASS, baseline `c0f5f06330cf6f66f3621d6edf4ffa77c1aadb23` on `main`.
- `tmpdir=$(mktemp -d) && DATABASE_PATH="$tmpdir/liinx.db" UPLOADS_DIR="$tmpdir/uploads" NODE_ENV=test npm run lint && DATABASE_PATH="$tmpdir/liinx.db" UPLOADS_DIR="$tmpdir/uploads" NODE_ENV=test npm test -- --run tests/carousel_block.test.ts tests/gallery_block.test.ts tests/image_block.test.ts tests/preview.test.ts && npm run build && git diff --check` — PASS, TypeScript check, 3 files / 6 tests, production build/prerender of 10 routes, and diff check. Existing warning: one generated chunk exceeds 500 kB.
- Browser/editor/public verification — NOT RUN; no supported browser-client Node REPL was available. Tests used disposable `mktemp` SQLite database and uploads directories; no production data or assets were changed.

### Existing test utilities and remaining risks

- Vitest/Supertest, SQLite global setup, disposable database/uploads directories, and the existing gallery/upload services were used.
- Real-browser verification remains required for swipe behavior, keyboard focus traversal, RTL presentation, reduced-motion expectations, and responsive sizing at actual viewport widths.
- Reduced-motion does not need to suppress carousel movement because movement is user initiated and no autoplay or animation timer is present; this should still be confirmed in browser accessibility testing.

### Next eligible prompt

`29 — Spacer and section spacing`

## Task 29 — Spacer and section spacing

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `6da320cd5149c05398faaa30ff42831a243b2b5c` at task start. The worktree was clean; prior task changes were preserved. Implementation commit is recorded below after verification.

### Scope and changed files

- `src/components/BuilderStudio.tsx`: clamps the editor's spacer height to 16–240px, gives the field an explicit label/help relationship, and explains that the configured value is intentional spacing rather than a CSS value.
- `src/components/PublicBioView.tsx`: keeps spacers decorative and noninteractive, bounds legacy values, and cancels only the surrounding 1rem stack/grid gaps so configured height is the resulting separation. The same behavior applies to filtered and mixed block layouts.
- `tests/spacer.test.ts`: covers API validation, minimum/maximum heights, persistence, public ordering/data, reload, and deletion.

### Findings and behavior

- The existing shared contract already rejected spacer heights outside 16–240px and non-integer values; that contract was retained rather than duplicated or broadened.
- The editor previously sent `NaN` for an empty numeric field and did not explain the visual result. It now presents a bounded integer value and accessible help text.
- The public renderer previously combined spacer height with the generic `space-y-4` or grid gap. Adjacent gaps are now cancelled per spacer position, including first/last and consecutive spacers, without changing ordinary block spacing.
- Spacer output has `aria-hidden="true"`, `pointer-events-none`, no focusable descendants, and no width-setting styles; it cannot create a focus target or horizontal overflow.
- No unrestricted layout engine or new contract was introduced. Existing legacy records continue to use the renderer fallback of 48px when their height is absent/invalid.

### Acceptance criteria

- PASS — Minimum/maximum valid values persist and invalid values/types fail cleanly. Evidence: `tests/spacer.test.ts` receives 201 for 16/240 and 400 for 15/241/NaN/string.
- PASS — Multiple spacers, ordering, deletion, and reload preserve the remaining content. Evidence: the focused test creates two spacers between links, verifies their order/heights through Studio and public API, deletes one, and reloads.
- PASS — Spacer blocks are decorative/noninteractive and bounded in the public renderer. Evidence: source inspection shows `aria-hidden`, `pointer-events-none`, bounded height, and no interactive descendants.
- PASS — Normal block spacing is not cumulatively added around a spacer. Evidence: renderer cancels only the adjacent 1rem stack/grid gaps based on block position; ordinary blocks retain their existing spacing.
- NOT RUN — Actual browser visual comparison at mobile/desktop preview widths, narrow-viewport overflow inspection, and keyboard focus traversal. No supported browser-client execution was available; source/API evidence is not browser evidence.

### Exact commands and outcomes

- `git rev-parse HEAD` — PASS, baseline `6da320cd5149c05398faaa30ff42831a243b2b5c` on `main`; worktree was clean before changes.
- `npm run lint` — PASS, TypeScript check exited 0.
- `mkdir -p /tmp/liinx-task-29c-db /tmp/liinx-task-29c-uploads && DATABASE_PATH=/tmp/liinx-task-29c-db/liinx.db UPLOADS_DIR=/tmp/liinx-task-29c-uploads NODE_ENV=test npm test -- --run tests/spacer.test.ts` — first attempt was NOT RUN because the disposable parent directory was absent; after creating the isolated directory, the focused test passed: 1 file / 1 test.
- `mkdir -p /tmp/liinx-task-29d-db /tmp/liinx-task-29d-uploads && DATABASE_PATH=/tmp/liinx-task-29d-db/liinx.db UPLOADS_DIR=/tmp/liinx-task-29d-uploads NODE_ENV=test npm test -- --run tests/backend-e2e.dynamic.test.ts tests/acceptance.test.ts` — PASS, 2 files / 35 tests.
- `npm run build` — PASS, production build and prerender completed; 10 routes prerendered. Existing non-blocking warning: one generated chunk exceeds 500 kB.
- `git diff --check` — pending until the final commit is created.

### Unresolved risks and dependencies

- Browser verification remains required for actual 390px/mobile and desktop preview geometry, visual gap measurement, and keyboard/focus inspection.
- The negative adjacent-margin technique is intentionally scoped to the existing 1rem stack/grid gap; any future container-spacing redesign must preserve or revisit this invariant.
- Public API tests verify serialized block data, not browser layout pixels.

### Implementation commit

`83c3acd30597cf42d8476b960e0da65c388fd1ae` — `feat: make spacer spacing predictable`.

### Next eligible prompt

`30 — Video block`

## Task 30 — Video block

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `9d4efef` at task start. The worktree was clean; Task 29 changes were preserved. Implementation commit is recorded below after verification.

### Scope and changed files

- `src/utils/mediaEmbeds.ts`: validates exact YouTube/Vimeo host shapes, parses watch/short/embed and Vimeo numeric URLs, removes autoplay parameters, and requires HTTP(S) direct-media URLs.
- `src/components/PublicBioView.tsx`: lazy-loads user-initiated YouTube/Vimeo iframes, uses metadata-only direct video loading, adds thumbnail failure fallback and validated external fallback links, and disables empty-source no-op controls.
- `src/components/BuilderStudio.tsx`: makes the video starter an explicit empty draft, documents supported URL shapes/hosting boundaries, and explains thumbnail fallback behavior.
- `tests/embeds_and_branding.test.ts`: updates embed expectations and adds malformed/host-spoof regression cases.
- `tests/video_block.test.ts`: covers YouTube, Vimeo, direct media, persistence/public serialization, and active-scheme rejection.

### Findings and behavior

- Existing video playback supported YouTube, Vimeo, and direct video extensions, but generated autoplay URLs and used `autoPlay` on direct files. These were removed. YouTube’s official parameter documentation states autoplay is opt-in and causes playback/data collection without user interaction; Vimeo’s official embed guidance likewise treats autoplay as an explicit parameter. [YouTube embed parameters](https://developers.google.com/youtube/player_parameters), [Vimeo autoplay/embed guidance](https://help.vimeo.com/hc/en-us/articles/12426486963857-How-to-add-autoplay-and-loop-parameters-to-my-video-s-embed-code).
- Supported native behavior is limited to YouTube embeds, Vimeo embeds, and direct HTTPS MP4/WebM/OGV/MOV URLs. Liinx does not host remote video URLs. TikTok remains a legacy contract/platform value but has no native video renderer or false playback claim; it falls back only if a validated external URL is supplied.
- Provider privacy, removed, private, or domain-denied videos cannot be confirmed locally. The public card keeps a validated “Open video” fallback; provider error pages remain provider-controlled.
- The existing CSP already allows the genuinely used video frame origins (`www.youtube.com`, `www.youtube-nocookie.com`, and `player.vimeo.com`) and HTTPS media. No broad CSP relaxation was needed. The CSP also contains entries owned by other media/features and was not removed in this task.
- Thumbnail URLs are validated as safe public HTTP(S) values at the shared contract boundary. Missing/failed thumbnails render a neutral preview state. Empty or malformed video sources cannot trigger a no-op or unsafe window-open control.

### Acceptance criteria

- PASS — One supported URL shape per implemented provider and direct-media files are parsed/accepted. Evidence: `tests/embeds_and_branding.test.ts` and `tests/video_block.test.ts` cover YouTube watch/short/embed parsing, Vimeo numeric parsing, and direct MP4.
- PASS — Malformed host-spoofed URLs and active schemes are rejected by parser/API. Evidence: utility tests return null for malformed/spoofed providers; API test returns 400 for `javascript:`.
- PASS — Responsive aspect ratio and lazy loading are present. Evidence: public renderer uses `aspect-video`, `w-full`, `overflow-hidden`, and `loading="lazy"` for iframes/thumbnails.
- PASS — Preview/public playback does not start automatically. Evidence: no autoplay URL parameter, no `autoPlay` attribute, and playback iframe/video mounts only after user activation.
- PASS — Missing thumbnails and unsupported/empty sources have honest fallback behavior. Evidence: renderer provides neutral thumbnail fallback, validated external “Open video” link, or disabled unavailable control.
- PASS — Persistence and public serialization preserve video URLs. Evidence: `tests/video_block.test.ts` creates three video blocks and verifies public values.
- NOT RUN — Live provider playback, private/removed/domain-denied provider responses, slow network behavior, and actual browser preview journey. External provider access and browser execution were unavailable.

### Exact commands and outcomes

- `git status --short --branch && git log -3 --oneline` — PASS, baseline `9d4efef` on `main`; clean worktree before Task 30.
- `npm run lint` — PASS, TypeScript check exited 0.
- `task30_tmp=$(mktemp -d) && DATABASE_PATH="$task30_tmp/liinx.db" UPLOADS_DIR="$task30_tmp/uploads" NODE_ENV=test npm test -- --run tests/video_block.test.ts tests/embeds_and_branding.test.ts tests/acceptance.test.ts` — PASS, 3 files / 37 tests using a disposable database/uploads directory.
- `npm run build` — PASS, production build and prerender completed; 10 routes prerendered. Existing non-blocking warning: one generated chunk exceeds 500 kB.
- `git diff --check` — PASS.

### Implementation commit

`14bc11a0039325e1d54af0e633d822d333962b22` — `feat: make video embeds safe and explicit`.

### Unresolved risks and dependencies

- Browser and live-provider verification remain required for actual playback, provider error/fallback UX, network timing, and preview behavior.
- Vimeo owners can disable embedding or use privacy requirements; the application cannot certify those remote settings without live provider checks.
- Direct media support depends on the remote server’s CORS/range/content behavior; Liinx only accepts and renders the URL and does not provide hosting.

### Next eligible prompt

`31 — Audio and music block`

## Task 31 — Audio and music block

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `156710c` at task start. The worktree was clean; Task 30 changes were preserved. Implementation commit is recorded below after verification.

### Scope and changed files

- `src/utils/mediaEmbeds.ts`: tightens Spotify, Apple Music, and SoundCloud URL parsing to exact HTTPS hosts and makes direct audio detection require an HTTP(S) URL/path extension. SoundCloud embeds explicitly use `auto_play=false` and `single_active=true`.
- `src/components/PublicBioView.tsx`: adds visible titles/artist labels and provider fallback links, lazy/user-initiated provider player loading, direct-file metadata preload, artwork fallback, audio errors, and single-active direct playback.
- `src/components/BuilderStudio.tsx`: makes new audio blocks explicit empty drafts and documents supported providers/file extensions and hosting limits.
- `tests/embeds_and_branding.test.ts`: adds spoofed-host and no-autoplay parser regressions.
- `tests/audio_block.test.ts`: covers supported provider/direct sources, public persistence, and active-scheme rejection.

### Findings and behavior

- Existing audio branches rendered Spotify, SoundCloud, Apple Music, and direct files, but all provider iframes mounted immediately, SoundCloud requested `auto_play=true`, direct audio used one global playing flag, and artwork/fallback states were incomplete.
- Supported native behavior is Spotify track/album/playlist/artist/episode embeds, Apple Music page embeds, SoundCloud track embeds, and direct HTTPS MP3/WAV/OGG/M4A/AAC files. Liinx does not host remote audio or invent stream/progress metrics.
- Provider players are initially replaced by an accessible “Load audio player” button. Only one embedded provider iframe is mounted at a time. Direct audio playback pauses other Liinx direct audio elements and tracks the active block by ID.
- Provider iframes retain `encrypted-media` where needed for Spotify and use the existing CSP origins: `open.spotify.com`, `w.soundcloud.com`, and `embed.music.apple.com`. No broader CSP relaxation was added.
- Missing artwork uses a neutral fallback. Direct-file load/play errors expose an alert and the validated external audio link. Provider availability/private-track/embed restrictions remain provider-controlled and cannot be certified locally.
- This behavior is consistent with current provider documentation: [Spotify Embeds](https://developer.spotify.com/documentation/embeds), [Spotify embed troubleshooting](https://developer.spotify.com/documentation/embeds/tutorials/troubleshooting), and [SoundCloud Widget API](https://developers.soundcloud.com/docs/api/html5-widget).

### Acceptance criteria

- PASS — Each currently implemented provider and direct audio source is parsed and persisted. Evidence: `tests/embeds_and_branding.test.ts` and `tests/audio_block.test.ts` cover Spotify, Apple Music, SoundCloud, and direct MP3 sources.
- PASS — Active schemes and spoofed provider hosts are rejected. Evidence: parser tests reject spoofed hosts; API test returns 400 for `javascript:alert(1)`.
- PASS — Unexpected concurrent Liinx direct streams are prevented. Evidence: direct `onPlay` pauses all other `audio[data-liinx-audio="true"]` elements; SoundCloud URL uses `single_active=true`; provider iframe mounting is single-active.
- PASS — No automatic playback is requested. Evidence: provider URLs use no autoplay parameter except SoundCloud’s explicit `auto_play=false`; no direct `autoPlay` is present; iframe loading requires user activation.
- PASS — Titles, artist labels, responsive width, lazy loading, artwork fallback, and external fallback links are implemented. Evidence: source inspection and API round-trip tests.
- NOT RUN — Live private/removed/unavailable tracks, provider embed-denial responses, artwork network failure, browser keyboard operation, slow load, and mobile visual sizing. Browser/provider execution was unavailable; source/API evidence is not live-provider evidence.

### Exact commands and outcomes

- `git status --short --branch && git log -3 --oneline` — PASS, baseline `156710c` on `main`; clean worktree before Task 31.
- `task31_tmp=$(mktemp -d) && DATABASE_PATH="$task31_tmp/liinx.db" UPLOADS_DIR="$task31_tmp/uploads" NODE_ENV=test npm run lint && DATABASE_PATH="$task31_tmp/liinx.db" UPLOADS_DIR="$task31_tmp/uploads" NODE_ENV=test npm test -- --run tests/audio_block.test.ts tests/embeds_and_branding.test.ts tests/acceptance.test.ts tests/e2e-workflow.test.ts && npm run build && git diff --check` — PASS, TypeScript check, 4 files / 49 tests, production build/prerender of 10 routes, and diff check. Existing non-blocking warning: one generated chunk exceeds 500 kB.
- Tests used a disposable SQLite database and uploads directory; no production data, provider credentials, or external playback was used.

### Implementation commit

`963641c9875f302a501e92f9925d0eb2b74b76e8` — `feat: make audio embeds accessible and single active`.

### Unresolved risks and dependencies

- Live provider sandbox/browser verification remains required for private, removed, denied, slow, and unavailable media states.
- External provider iframe controls may have provider-specific playback concurrency behavior beyond the application-controlled mount policy.
- Apple Music and SoundCloud provider requirements should be rechecked before any future CSP or embed API change.

### Next eligible prompt

`32 — Location block`

## Task 32 — Location block

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `6454172` at task start. The worktree was clean; Task 31 changes were preserved. Implementation commit is recorded below after verification.

### Scope and changed files

- `src/utils/mapLinks.ts`: adds a bounded, encoded Google Maps search-link builder that returns null for empty/non-string locations.
- `src/components/PublicBioView.tsx`: renders the location block as a directions/search card, with a validated Maps URL only when an address exists and an explicit empty state otherwise. No embedded map or geolocation request was added.
- `src/components/BuilderStudio.tsx`: labels the editor as an address/place field and explains that the feature is directions-only.
- `tests/location_block.test.ts`: covers Arabic/English persistence, encoding, exact Maps URL shape, empty input, and overlong input rejection.

### Findings and behavior

- The prior renderer always created a Google Maps search link, including for empty input, and did not make clear that it was not an embedded map. It now uses `https://www.google.com/maps/search/?api=1&query=...`, with a visible “Get directions” label and accessible destination label.
- The saved value remains the creator’s address/search text, not a fabricated geocoded result or place ID. Google Maps performs the search when the visitor activates the link.
- Existing legacy records using `subtitle` for the location remain renderable through the existing fallback path. New editor values are capped at the shared 300-character contract limit.
- Empty locations show “Add an address to show directions” and expose no dead/blank link. Invalid overlong values return 400. No iframe, Maps SDK, API key, or device geolocation request is used.
- The URL shape follows [Google Maps URLs official documentation](https://developers.google.com/maps/documentation/urls/get-started), which documents the required `api=1` search format, URL encoding, cross-device behavior, and no API-key requirement.

### Acceptance criteria

- PASS — Arabic and English addresses save, reload, and remain present in public data. Evidence: `tests/location_block.test.ts` persists both values and verifies the public API round trip.
- PASS — Public directions/search target is deterministic and properly encoded. Evidence: the test verifies exact Google Maps origin/path, `api=1`, and decoded `query` for both languages.
- PASS — Empty input has a clear state. Evidence: `getGoogleMapsSearchUrl('   ')` returns null and renderer emits an explicit empty status without an anchor.
- PASS — Invalid input fails cleanly. Evidence: 301-character location returns HTTP 400 through the shared block contract.
- PASS — No unnecessary geolocation or embedded-map behavior is claimed. Evidence: no map iframe/SDK or geolocation API was added; editor/public copy says directions-only.
- NOT RUN — Actual browser activation, Google Maps handoff, narrow/mobile layout, and external Maps availability. Browser execution and live external navigation were unavailable.

### Exact commands and outcomes

- `git status --short --branch && git log -3 --oneline` — PASS, baseline `6454172` on `main`; clean worktree before Task 32.
- `task32_tmp=$(mktemp -d) && DATABASE_PATH="$task32_tmp/liinx.db" UPLOADS_DIR="$task32_tmp/uploads" NODE_ENV=test npm run lint && DATABASE_PATH="$task32_tmp/liinx.db" UPLOADS_DIR="$task32_tmp/uploads" NODE_ENV=test npm test -- --run tests/location_block.test.ts tests/backend-e2e.dynamic.test.ts tests/acceptance.test.ts && npm run build && git diff --check` — PASS, TypeScript check, 3 files / 36 tests, production build/prerender of 10 routes, and diff check. Existing non-blocking warning: one generated chunk exceeds 500 kB.
- Tests used a disposable SQLite database and uploads directory; no external Maps request was made.

### Implementation commit

`78e9497b4fbe97bd37d731402f91f95b8a44c6ec` — `feat: make location block directions explicit`.

### Unresolved risks and dependencies

- Live Google Maps handoff and browser responsive/accessibility verification remain required.
- Search links depend on Google Maps resolving the creator-provided text; the application does not verify a place identity or guarantee a pin.

### Next eligible prompt

`33 — FAQ block`

## Task 33 — FAQ block

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `927a6d565df0b4ec4c73dca8cb472d55b30fabd9` at task start. The worktree was clean; Task 32 changes were preserved.

### Scope and changed files

- `server/contracts.ts`: trims and rejects blank FAQ questions while preserving multiline answers up to 5,000 characters.
- `src/components/BuilderStudio.tsx`: new FAQ items start empty instead of public-looking sample Q&A; question/answer limits and plain-text/line-break behavior are visible in the editor.
- `src/components/PublicBioView.tsx`: adds a labelled FAQ section, native keyboard-accessible disclosure controls, Arabic/English direction handling, long-content wrapping, and an honest empty state; malformed legacy items are omitted.
- `tests/faq_block.test.ts`: covers ordered persistence/public round-trip, Arabic/English and multiline content, empty FAQ state, and blank-question rejection.

### Findings and behavior

- Existing native `<details>/<summary>` controls already provided browser disclosure and keyboard activation. They now have a proper section heading, visible focus indication, and stable item keys where supplied.
- FAQ answers remain plain text. Line breaks are preserved with `whitespace-pre-wrap`; links are intentionally not supported by this block, so no unsafe HTML/link pipeline was added.
- Reordering sends and persists the complete item array, preserving each question-answer pair and item identity together.
- New FAQ blocks contain no fabricated public answers. The creator must add each question and answer; empty blocks render an explicit “No questions yet.” state.
- Legacy malformed items with blank/non-string questions are excluded from public rendering without deleting stored creator data.

### Acceptance criteria

- PASS — Several questions can be edited, reordered, persisted, reloaded, and returned by the public API. Evidence: `tests/faq_block.test.ts`.
- PASS — Answers remain associated with their questions during reorder. Evidence: the test compares the complete reordered item array, including answers.
- PASS — Long Arabic/English and multiline content is contract-bounded and preserved. Evidence: API round-trip test plus `whitespace-pre-wrap`, `break-words`, and `dir="auto"` public rendering.
- PASS — Only the intended FAQ item expands through independent native `<details>` elements. Evidence: source inspection; no shared expanded state or cross-item rendering exists.
- PASS — Empty state is honest and contains no fabricated FAQ content. Evidence: empty-array API test and blank defaults in the editor.
- NOT RUN — Actual browser keyboard journey, visual narrow-width wrapping, and screen-reader behavior. The browser runtime was unavailable in this session; source evidence is not browser evidence.

### Exact commands and outcomes

- `git status --short --branch` — PASS at baseline: clean `main`, ahead of `origin/main` by prior task commits.
- `task33_tmp=$(mktemp -d); DATABASE_PATH="$task33_tmp/liinx.db" UPLOADS_DIR="$task33_tmp/uploads" NODE_ENV=test npm run lint && DATABASE_PATH="$task33_tmp/liinx.db" UPLOADS_DIR="$task33_tmp/uploads" NODE_ENV=test npm test -- --run tests/faq_block.test.ts tests/backend-e2e.dynamic.test.ts tests/acceptance.test.ts && npm run build && git diff --check` — PASS: typecheck, 3 test files / 37 tests, production build with 10 prerendered routes, and diff check.
- Build emitted the existing non-blocking warning that one generated chunk exceeds 500 kB.
- Tests used a disposable SQLite database and uploads directory; no production data or external provider was used.
- Browser attempt — NOT RUN: no `node_repl` browser tool was exposed, so keyboard and responsive claims remain unverified.

### Implementation commit

`b4997a0d9defb23b13a4e2c6c7e0778ddd30fd35` — `feat: make FAQ blocks honest and accessible`.

### Unresolved risks and dependencies

- Browser keyboard, screen-reader, narrow viewport, and deployed public rendering still require verification when the browser workflow is available.
- FAQ links are intentionally unsupported; creators should use a supported rich-text block when they need safe links.

### Next eligible prompt

`34 — Testimonials block`

## Task 35 — Event and release-link cards

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `2484487` at task start. The worktree was clean; prior task changes were preserved.

### Scope and changed files

- `server/contracts.ts`: extends event data with description, date, time, timezone, location, artwork URL, and safe destination fields; preserves the existing pre-save URL/description contract.
- `src/components/BuilderStudio.tsx`: adds editor controls and explicit policy copy for event metadata and external release links; new defaults contain no invented event or release claim.
- `src/components/PublicBioView.tsx`: renders distinct event and external-release cards, metadata, artwork, honest missing-configuration states, legacy subtitle fallback, and preview-disabled actions.
- `server/routes/analytics.ts`: allows event/pre-save destinations stored in `extra.url` to use the existing tracked redirect path with server-side URL sanitization.
- `tests/event_release_cards.test.ts`: covers full event/release persistence, multilingual/multiline event data, safe redirects, invalid destinations, and missing-link 404 behavior.

### Findings and behavior

- The prior renderer treated event, pre-save, and unrelated cards as one generic anchor, used `#` when configuration was missing, and did not expose event time/location/artwork controls. Event and release cards are now separate.
- Date/time/timezone are display-only creator-entered strings. Liinx does not parse or convert them by visitor timezone; creators are instructed to include the timezone. An event with no date remains publishable if its destination is configured, and does not claim expiry because no scheduling model exists for event dates.
- An event with no destination shows an unavailable status rather than a functional-looking link. A release card is explicitly labelled “External release link”; it does not imply music-service pre-save authorization or completion.
- Existing event descriptions stored in `subtitle` remain visible through the public fallback. Safe destinations go through `/r/:blockId` for click tracking and server validation. Preview actions are disabled by the existing preview mode behavior.
- Artwork is URL-based only in this task; no new upload or provider dependency was added.

### Acceptance criteria

- PASS — Event title, description, date, time, timezone, location, artwork, and destination persist and reload. Evidence: `tests/event_release_cards.test.ts` and shared contract validation.
- PASS — Creator/visitor timezone policy is explicit and consistent: entered date/time/timezone are displayed as saved without conversion. Evidence: editor copy and renderer implementation.
- PASS — Missing-date/destination behavior is intentional. Missing dates display no fabricated date; missing destinations return an unavailable state and tracked redirect returns 404.
- PASS — External event and release links open through validated tracked redirects. Evidence: regression test asserts 302 targets.
- PASS — Missing release configuration does not look functional and no native pre-save workflow is claimed. Evidence: explicit external-link copy and unavailable-state rendering.
- NOT RUN — Actual browser visual rendering, live ticket/release provider availability, timezone locale behavior in browsers, and mobile layout. Browser/provider execution was unavailable.

### Exact commands and outcomes

- `git status --short --branch` — PASS at baseline: clean `main`, ahead of `origin/main` by prior task commits.
- `task35_tmp=$(mktemp -d); DATABASE_PATH="$task35_tmp/liinx.db" UPLOADS_DIR="$task35_tmp/uploads" NODE_ENV=test npm run lint && DATABASE_PATH="$task35_tmp/liinx.db" UPLOADS_DIR="$task35_tmp/uploads" NODE_ENV=test npm test -- --run tests/event_release_cards.test.ts tests/backend-e2e.dynamic.test.ts tests/acceptance.test.ts && npm run build && git diff --check` — PASS: typecheck, 3 test files / 37 tests, production build with 10 prerendered routes, and diff check.
- Build emitted the existing non-blocking warning that one generated chunk exceeds 500 kB.
- Tests used a disposable SQLite database and uploads directory; no production data, tickets, payments, or external provider request was used.

### Implementation commit

`524d44f0bcc95aa6113f9b38baf2fa658b7b5b1e` — `feat: complete event and release cards`.

### Unresolved risks and dependencies

- Live browser/provider verification remains required for actual external destination availability, artwork failures, responsive layout, and timezone presentation.
- There is no native ticketing or music-service authorization/pre-save workflow; external destinations are the supported scope.

### Next eligible prompt

`36 — Product and support-link cards`

## Task 36 — Product and support-link cards

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `c86d10a` at task start. The worktree was clean; prior task changes were preserved.

### Scope and changed files

- `server/contracts.ts`: adds bounded product image, numeric amount, and three-letter currency fields while retaining legacy price labels and safe external URLs.
- `server/routes/analytics.ts`: allows product/tip destinations stored in `extra.url` to use the existing tracked redirect path and sanitizer.
- `src/components/BuilderStudio.tsx`: adds product description/image/price/currency controls and explicit external-commerce/support policy copy; removes fabricated default copy.
- `src/components/PublicBioView.tsx`: renders separate product checkout and support cards, consistent display-only price labels, external-action labels, honest unavailable states, preview-disabled actions, and no inventory/payment claims.
- `tests/product_support_cards.test.ts`: covers full field persistence/public data, safe redirects, malformed price/currency rejection, unsafe links, and missing destinations.

### Findings and behavior

- Product and tips previously shared a generic anchor that became `#` without configuration and did not distinguish checkout/support behavior. They now render as separate cards.
- Product `priceAmount` accepts up to eight integer digits and two decimals; `currency` accepts a three-letter uppercase code. When present, public output consistently renders `CURRENCY amount`; legacy `price` labels remain compatible.
- Product cards state that checkout happens on another service. Tip cards state that support happens on another service. Liinx does not process payments, taxes, inventory, payouts, memberships, or earnings.
- Missing product/tip destinations do not render an actionable link and tracked redirects return 404. Preview actions are disabled through the existing preview-only behavior.
- Product artwork is URL-based only; no new upload or commerce/provider dependency was introduced.

### Acceptance criteria

- PASS — Product and support fields persist and appear in public data after reload. Evidence: `tests/product_support_cards.test.ts`.
- PASS — Price/currency formatting is bounded and consistent for structured values; legacy labels remain supported. Evidence: shared contract and public renderer.
- PASS — Missing destinations disable the action and return 404 through the redirect endpoint. Evidence: regression test.
- PASS — External checkout and support links are accurately labelled and tracked. Evidence: public renderer and redirect assertions.
- PASS — No fake inventory, purchases, earnings, or payment confirmations are created. Evidence: defaults/policy copy and source inspection.
- NOT RUN — Actual browser public-page visuals, mobile layout, and live external checkout/support destinations. Browser/provider execution was unavailable.

### Exact commands and outcomes

- `git status --short --branch` — PASS at baseline: clean `main`, ahead of `origin/main` by prior task commits.
- `task36_tmp=$(mktemp -d); DATABASE_PATH="$task36_tmp/liinx.db" UPLOADS_DIR="$task36_tmp/uploads" NODE_ENV=test npm run lint && DATABASE_PATH="$task36_tmp/liinx.db" UPLOADS_DIR="$task36_tmp/uploads" NODE_ENV=test npm test -- --run tests/product_support_cards.test.ts tests/event_release_cards.test.ts tests/backend-e2e.dynamic.test.ts tests/acceptance.test.ts && npm run build && git diff --check` — PASS: typecheck, 4 test files / 39 tests, production build with 10 prerendered routes, and diff check.
- Build emitted the existing non-blocking warning that one generated chunk exceeds 500 kB.
- Tests used a disposable SQLite database and uploads directory; no production data, payments, inventory, or external provider request was used.

### Implementation commit

`9da627eca10dfa2e9f9dc3bab056765c89a2b8c5` — `feat: complete product and support cards`.

### Unresolved risks and dependencies

- Live browser, responsive, and external destination verification remain required.
- Price labels are informational only; the application does not verify external price availability or checkout completion.

### Next eligible prompt

`37 — Phone and direct-contact blocks`

## Task 37 — Phone and direct-contact blocks

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `953ff8e` at task start. The worktree was clean; prior task changes were preserved.

### Scope and changed files

- `src/utils/contactLinks.ts`: adds shared phone normalization and safe `tel:`/`mailto:` URI construction with encoded subject/body parameters.
- `server/contracts.ts`: validates phone/email contact modes, bounded message fields, and international number shape at the shared contract boundary.
- `server/routes/analytics.ts`: resolves phone/email block destinations for the existing tracked redirect path using the shared safe builders.
- `src/components/BuilderStudio.tsx`: adds click-to-call/email mode, country-code guidance, optional availability/description, and optional email parameters; explicitly distinguishes this from visitor data collection.
- `src/components/PublicBioView.tsx`: renders separate call/email actions, preserves readable LTR contact values in RTL pages, provides availability and no-dialer guidance, and disables actions in preview.
- `tests/direct_contact_blocks.test.ts`: covers international numbers, spaces/plus signs, invalid characters and lengths, mailto parameters, persistence, public output, safe redirects, and missing configuration.

### Findings and behavior

- The previous phone block accepted arbitrary text and built `tel:` targets in the renderer. It now accepts only 4–15 digits with optional international `+`, spaces, parentheses, or hyphens, while displaying the creator’s formatted input and redirecting to normalized digits.
- A phone block can now be explicitly configured as click-to-call or send-email. Email subjects and bodies are URL-encoded; neither mode collects visitor data in Liinx.
- Availability is optional creator text. Desktop devices without a dialer are not treated as an application failure; the public card says the device may not support calling.
- Missing or invalid contact data shows a non-actionable status and the tracked redirect returns 404. No messaging provider integration was invented; existing social/contact links remain separate.
- Phone and email display values use `dir="ltr"` so addresses and handles remain readable inside Arabic/RTL pages.

### Acceptance criteria

- PASS — International numbers, spaces, plus signs, invalid characters, and overlong numbers are covered. Evidence: `tests/direct_contact_blocks.test.ts` and shared contract validation.
- PASS — Mailto subject/body parameters are safely encoded and preserved after reload. Evidence: helper and public API/redirect assertions.
- PASS — Desktop/no-dialer behavior is honestly disclosed. Evidence: public renderer copy; no device capability claim is made.
- PASS — RTL display preserves phone/email destination text direction. Evidence: `dir="ltr"` on public contact values and source review.
- PASS — Public controls disclose call versus email action and preserve the correct destination through reload/tracked redirect. Evidence: API round-trip and 302 assertions.
- PASS — Visitor contact data is not collected by this block. Evidence: creator-published `tel:`/`mailto:` actions only; no submission endpoint was added.
- NOT RUN — Actual browser activation, OS dialer/mail-client availability, mobile layout, and screen-reader verification. Browser execution was unavailable.

### Exact commands and outcomes

- `git status --short --branch` — PASS at baseline: clean `main`, ahead of `origin/main` by prior task commits.
- `task37_tmp=$(mktemp -d); DATABASE_PATH="$task37_tmp/liinx.db" UPLOADS_DIR="$task37_tmp/uploads" NODE_ENV=test npm run lint && DATABASE_PATH="$task37_tmp/liinx.db" UPLOADS_DIR="$task37_tmp/uploads" NODE_ENV=test npm test -- --run tests/direct_contact_blocks.test.ts tests/social_links.test.ts tests/backend-e2e.dynamic.test.ts tests/acceptance.test.ts && npm run build && git diff --check` — PASS: typecheck, 4 test files / 44 tests, production build with 10 prerendered routes, and diff check.
- Build emitted the existing non-blocking warning that one generated chunk exceeds 500 kB.
- Tests used a disposable SQLite database and uploads directory; no visitor contact data, production messaging, or device action was used.

### Implementation commit

`9f917457531bcfbdbe0ddd6d6a95d4721e9a5e72` — `feat: complete direct contact blocks`.

### Unresolved risks and dependencies

- Browser/OS verification remains required for actual dialer/mail-client handoff, mobile behavior, and screen-reader announcements.
- No WhatsApp or other messaging-provider action is implemented in this task; adding one requires an explicit supported-provider decision.

### Next eligible prompt

`38 — Download block and file lifecycle`

## Task 38 — Download block and file lifecycle

Status: IMPLEMENTED / EXTERNAL CHECK BLOCKED

Baseline: branch `main`, commit `9f91745` at task start. The worktree was clean; prior task changes were preserved. Task changes were validated against the current code rather than assuming Prompt 02 findings were still present.

### Scope and changed files

- `server/contracts.ts`: permits only an exact local upload path or HTTP(S) URL for download resources; retains bounded display name, size, and validated MIME metadata.
- `server/routes/upload.ts`: sanitizes returned display filenames and adds authenticated cleanup for unreferenced owned uploads.
- `server/services/uploadLifecycle.ts`: centralizes ownership, shared-reference checks, path-safe deletion, and database/file cleanup.
- `server/routes/blocks.ts`: validates ownership when attaching local uploads and cleans replaced/deleted download assets only after reference checks.
- `src/services/api.ts`: exposes upload metadata and cleanup calls.
- `src/components/BuilderStudio.tsx`: persists uploaded file URL, server-derived filename, size, and MIME; failed block persistence attempts clean up the newly uploaded file.
- `src/components/PublicBioView.tsx`: renders filename/size information, honest unavailable and preview states, and an accessible download action without a fake `#` destination.
- `tests/download_file_lifecycle.test.ts`: isolated regression coverage for supported formats, byte equality, headers, ownership, shared references, cleanup, missing resources, and metadata validation.

### Findings and behavior

- Download resources are public by product policy, not protected by an unguessable URL. The public route serves only validated files recorded by the upload service; local files are delivered as attachments with `nosniff`, immutable caching, and server-derived MIME handling. Non-image uploaded active content is not rendered inline on the application origin.
- Supported file signatures are PDF, ZIP, MP3, WAV, MP4, and plain text, with a 25 MiB upload limit. The persisted extension and response MIME come from content detection, not the user filename or declared multipart MIME.
- Display-label edits cannot alter the stored content type or delivery headers. Local upload references can be attached only by their owning account.
- Replacements and block deletion remove an upload only when no block or supported profile field references it. Failed persistence cleanup is best-effort and reports the save error rather than claiming success; existing Prompt 02 persistence-failure coverage remains green.
- Missing resources return an unavailable state/404. Preview download actions are disabled. External HTTP(S) download URLs remain creator-configured public links and are not transformed into Liinx-hosted protected downloads.
- Existing unsafe/legacy files are not blindly deleted. The current serving path does not serve unregistered legacy paths; cleanup is reference-aware.

### Acceptance criteria

- PASS — Supported formats upload and download byte-for-byte. Evidence: `tests/download_file_lifecycle.test.ts`, 6 signatures and response-body equality.
- PASS — Download delivery uses server-derived MIME, attachment disposition, and `nosniff`; display labels do not control executable MIME handling. Evidence: lifecycle assertions and serving implementation.
- PASS — Missing/malformed resources fail cleanly without a fake successful download. Evidence: missing block public route returns 404; invalid MIME metadata returns 400.
- PASS — Ownership is enforced for local upload attachment and cleanup; cross-account deletion returns 404. Evidence: lifecycle regression test.
- PASS — Replacement/removal cleanup preserves shared assets and removes unreferenced assets. Evidence: shared-reference and replacement/deletion assertions, including filesystem checks.
- PASS — Failed block persistence removes the newly uploaded file through the cleanup path. Evidence: BuilderStudio error path plus existing Prompt 02 persistence-failure regression coverage.
- PASS — Public files are explicitly documented as public; protected-download authorization is not promised. Evidence: route policy and ledger.
- NOT RUN — Actual browser download UX, mobile layouts, deployed asset-origin isolation, CDN cache behavior, and live storage outage/retry verification. Local API execution used disposable storage only.

### Exact commands and outcomes

- `task38_tmp=$(mktemp -d); DATABASE_PATH="$task38_tmp/liinx.sqlite" UPLOADS_DIR="$task38_tmp/uploads" mkdir -p "$UPLOADS_DIR"` — PASS: disposable SQLite database and uploads directory established for validation.
- `task38_tmp=$(mktemp -d); export DATABASE_PATH="$task38_tmp/liinx.sqlite"; export UPLOADS_DIR="$task38_tmp/uploads"; mkdir -p "$UPLOADS_DIR"; npm run lint && npm test -- --run tests/download_file_lifecycle.test.ts` — PASS: typecheck and 1 test file / 3 tests.
- `task38_tmp=$(mktemp -d); export DATABASE_PATH="$task38_tmp/liinx.sqlite"; export UPLOADS_DIR="$task38_tmp/uploads"; mkdir -p "$UPLOADS_DIR"; npm run lint && npm test -- --run tests/download_file_lifecycle.test.ts tests/audit_fixes.test.ts tests/backend-e2e.dynamic.test.ts tests/acceptance.test.ts && npm run build && git diff --check` — PASS: typecheck, 4 test files / 67 tests, production build, 10 prerendered routes, and diff check.
- Build emitted the existing non-blocking warning that one generated chunk exceeds 500 kB.
- Tests did not use production data, production storage, paid providers, or external file services.

### Implementation commit

`9efbff79767916e25170f1b1497ae879b7419aca` — `feat: complete download block and file lifecycle`.

### Unresolved risks and dependencies

- Browser and deployed-origin checks remain required for actual download UX, responsive behavior, cache invalidation, and confirmation that deployment keeps uploaded active content off the application execution origin.
- Public-resource policy is intentional; a future protected-download feature must add authenticated/expiring delivery rather than relying on URL secrecy.
- Orphan cleanup after an infrastructure-level file/database outage is not a background reconciliation job; operational storage reconciliation remains outside this task.

### Next eligible prompt

`39 — Form field editor`
