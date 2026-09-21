# From theme picker to first win: activation and trust roadmap

**Status:** Phases 1, 2, 3, 4, 5a, 6 and 7 are shipped. Phase 5b (draft → preview → publish) is its own XL plan and is not started. Phase 8 stays blocked on maintainer-owned Google/Apple credentials — a provider button that 404s is a fake implementation and is refused.
**Written against:** `6fc47ac`
**Source:** external UX review, overall score ~7/10, "Template UX 4.5/10", headline complaint: *"I get the full product before I get the first win."*
**Supersedes nothing.** Plans 001 and 002 remain independent.

## What "no fake implementation" means for this roadmap

Every phase below is written so that it can only be marked done when the *product behaviour* changed, not its appearance. Concretely, a phase is done when all of these exist:

1. **Server truth changed.** The behaviour is stored in SQLite or computed from stored data — never a `localStorage` flag that resets on another device, and never a component that renders a promise the API does not keep.
2. **A test that fails first.** A test is written against the desired behaviour, confirmed red on the pre-change commit, then green. Not a snapshot of the new code.
3. **Live proof.** Verified in a real browser on the dev server (port 3155) with DOM evidence plus a DB query showing the persisted row, on a throwaway account.
4. **Arabic parity.** Every new or changed user-facing literal has an Arabic entry and is verified in `/ar` RTL, because `translateRuntime` silently falls back to English when a key is missing (`src/config/runtimeTranslations.ts:183-186`).
5. **No invented content.** No fabricated metrics, testimonials, users, competitor facts, or "coming soon" affordances wired to dead buttons.
6. Gates stay green: `npm run build`, `npm run architecture:check`, `npm run typecheck`, ESLint 0 errors, full Vitest suite. The coverage gate is red today by maintainer decision (plan 002) and this roadmap does not touch thresholds.

## Fact-check of the review before planning

The review is directionally right about the product's biggest lever, but three of its concrete claims are wrong or stale. The plan is built on verified behaviour.

| Review claim | Verdict | Evidence |
|---|---|---|
| "Use this template" effectively only applies a theme | **CONFIRMED in effect** | `src/App.tsx:49-52` keeps only `profile.themeId` and discards the demo profile's blocks/socials/category; the Studio consumer at `src/features/builder/hooks/useProfile.ts:87-91` writes only `themeId` + `customTheme`. Templates never touch `pages` or `blocks`. |
| "No builder logic consumes `?template=`" | **REFUTED** | `useProfile.ts:86-105` reads the param, persists it, refetches, and strips the URL. The real defects are narrower: it applies a theme only, and it is skipped when the effect early-returns at `useProfile.ts:75-78` or the profile is empty (`:82-84`). |
| Handle dialog shows `raloa.me/@username` | **REFUTED at HEAD — already fixed** | `src/features/builder/components/panels/UsernameChangeDialog.tsx:36` renders `{brand.domain}/@…` from `shared/config/brand.ts:39`. `raloa.me` exists nowhere in the tree; it was removed in `a381396`. The reviewer looked at an older build. **Hardcoded hosts do still exist elsewhere** (Phase 3 list). |
| Registration "applies theme and category" | **PARTIAL** | The server seeds fixed values (`server/routes/auth.ts:236-266`: category `Creator`, theme `editorial-stone`, starter socials, one `My Website` block). Theme + intent category are applied *afterwards* by the client in `src/pages/RegisterPage.tsx:117-122`, wrapped in `try { … } catch {}` — so a failed profile update is silently swallowed and the user keeps the default theme with no message. Category comes from the intent picker, not the template. |
| Signup is email/password only; no Google/Apple | **CONFIRMED** | Zero OAuth login anywhere; only Instagram *account linking* (`server/routes/instagram.ts:70-160`). Reusable precedent exists: `server/secretStore.ts` AES-256-GCM, `instagram_oauth_states` table, `.env.example` naming convention. |
| Signup CTA says "Launch My Page" before any content exists | **CONFIRMED** | `src/pages/RegisterPage.tsx:333`. It also has **no Arabic translation**, so RTL users see English. |
| ~20 block types in the catalog, nothing recommended | **CONFIRMED — 22 items** | `src/features/builder/components/blocks/addBlockCatalog.ts:40`; flat grid with category chips (`AddBlockHeader.tsx:20-26`). No recommendations, no plan badges; `shared/config/plans.ts:10-14` gates only profiles/domain/paidCustomization/scheduling/API — **all 22 blocks are usable on Free**, so "recommended" must not imply a paywall. |
| Settings is a dumping ground and shows plan cards inside the editor | **CONFIRMED** | `SettingsPanel.tsx` is 799 lines: three side-by-side plan cards (`:113-165`), branding, pixels, domain, CSS/fonts, public-page controls, duplicate profile, **form-submission inbox** (`:657-790`), `<IntegrationsPanel/>`, `<SubscribersPanel/>`. |
| "I am not sure what Saved means" | **CONFIRMED — there is no draft model at all** | `pages.published` (`server/db.ts:139`) is the only publish flag; `profiles` has none. Autosave writes straight to live rows. The UI already states it honestly at `PageManager.tsx:135`: *"Changes save directly to the published page… RALOA does not keep a separate draft revision."* The toolbar (`BuilderToolbar.tsx:122-139`) says only "Saved". |
| Competitor table full of "Not assessed" | **CONFIRMED in data, currently invisible** | 48 `Not assessed`/`غير مُقيّم` values in `src/config/i18n.ts:220-239,418-428` + `src/config/marketing.ts`. **No component renders it** — only `tests/critical_security_coverage.test.ts:969`. Dead marketing data is a liability, not a feature. |
| Comparison against a "generic link list" is a strawman | **CONFIRMED** | `ComparisonSection.tsx:26` vs an unnamed "Basic link list" (`comparisonContent.ts:6-27`, five all-✕ rows). |
| Fictional showcase examples are honestly labelled | **CONFIRMED** | `TrustProofSection.tsx:76-80` disclaimer, hero `Demo Profile`/`Sample Data` chips (`Hero.tsx:170-173`), `DemoProfileNotice.tsx:11`. No real testimonials, logos or metrics exist anywhere. |

## Sequencing and effort

| Order | Phase | Priority | Depends on | Effort |
|---|---|---|---|---|
| 1 | Templates become real starter sites | P0 activation | none | L |
| 2 | Guided first run, recommended blocks, share moment | P0 activation | Phase 1 | L |
| 3 | One domain, one vocabulary | P0 trust, cheap | none | S–M |
| 4 | Studio information architecture + real upgrade modal | P1 | Phase 3 | M |
| 5a | "Saved · Live" made unmistakable | P1 | none | S |
| 5b | Draft → Preview → Publish | P2 epic | Phases 1–4 | XL, own plan |
| 6 | Guided custom-domain wizard | P2 | Phase 3 | M |
| 7 | Marketing: prove the outcome, delete dead comparison | P2 | Phase 1 | M |
| 8 | Social signup | blocked on external credentials | Phase 3 | M after unblock |

Do 3 before 4 (the new tab names come from the glossary). Do 1 before 2 (Phase 2's "your starter site is ready" depends on a template that actually builds one).

---

## Phase 1 — A template must produce a site, not a colour

**Problem:** clicking "Use this template" promises a page and delivers `theme_id`. This is the single highest-leverage fix in the review.

**Design decision (deliberate, to stay honest):** a template is a *composition*, and compositions live on the server where they can be applied transactionally and tested against the real schema. Client-only JSON in `src/config/templates.ts` (8 entries, `previewColor`, and a `profile` borrowed from `src/demo/demoProfiles.ts` with fabricated `stats` such as `viewsThisMonth: '48.2K'`) cannot be applied to an account and drags fake engagement numbers into the data path.

1. **Define the contract.** New `shared/contracts/templates.ts`: `siteTemplateSchema` = id, name, category, description, `themeId` validated against `presetThemeIds`, optional profile fields to set, `pages[]` (slug/title/description/isHome), `blocks[]` with `type` validated against `blockTypeSchema` (`shared/contracts/blocks.ts:151-155`), `position`, `pageSlug`, plus `socials[]`. Every field must be one the DB actually stores. Reject unknown keys (`.strict()`) so a template can never smuggle a column.
2. **Author the catalog in `shared/config/siteTemplates.ts`.** Port the existing 8 templates into real compositions, and add composition-only entries for the five intents the signup form already collects (`RegisterPage.tsx:27-34`). Placeholder copy must read as placeholder ("Replace this link", "Your headline"), never as a live site with fake numbers — do not carry `stats` across.
3. **One materializer, reused.** Extract the page/block writing that today lives in `duplicatePagesAndBlocks` (`server/routes/profiles.ts:679-693`) into a module both duplication and template-apply call, so there is one INSERT path (column order, `visible` default, `extra_json` sanitising via `duplicatedBlockExtra`, id remapping). Keep it in a new file: `server/routes/profiles.ts` is pinned at the 826-line ratchet baseline and must not grow.
4. **New endpoint** `POST /studio/templates/:templateId/apply` (`requireAuth`, body `{ mode: 'append' | 'replace' }`), transactional, page-scoped, plan-checked (`hasEntitlement` for `startAt`/`endAt` in seeded blocks — refuse rather than silently drop a scheduled block), invalidating the public profile cache and returning the full studio payload so the client re-renders from server truth. Failure returns a real status + message; nothing partial is committed.
5. **Route the UX through it.** "Use this template" (`TemplateCard.tsx:58-64` → `App.tsx:49-52`) passes the template **id**, not a theme id. Logged-in: `/studio?template=<id>` calls apply (extend `useProfile.ts:86-105` beyond its theme-only branch and remove the early-return skip). Logged-out: `?template=` survives into registration.
6. **Apply templates server-side at signup.** Add optional `templateId` to `registerSchema` (`shared/schemas/auth.ts:3-13`) and materialise it inside `createRegisteredAccount`'s existing transaction (`server/routes/auth.ts:236-266`). Delete the swallowed `try { updateProfile } catch {}` in `RegisterPage.tsx:117-123`; if setup fails, the user must see an error, not a silently default-branded site.
7. **Make theme choice concrete, not abstract.** Replace the six colour dots in signup step 2 with real mini previews using the existing `PhonePreview` component, one per theme, horizontally swipeable, each labelled with the theme name — pure render of existing data, so this is genuinely deliverable, and it also fixes "names like Editorial Stone don't tell me enough".
8. **Preview fidelity.** The gallery already renders live phone previews (`TemplateCard.tsx:34`); point it at the shared template's own blocks so what a visitor previews is what apply will create. Preview and result must be the same source of truth.

**Acceptance**
- API test: applying a template writes the expected `pages` and `blocks` rows (count, `type`, `position`, `page_id`, `visible`) and the public `GET /api/profiles/:username` returns the same structure in order.
- API test: `mode: 'replace'` and `'append'` behave differently and both keep positions contiguous; a second apply does not orphan rows.
- API test: applying a template containing scheduling on Free returns 403 with a specific message and writes **nothing** (transaction rollback proven by row count).
- API test: registration with `templateId` yields the composed site in one request; invalid template id yields 400 and a default account still created (or explicitly not created — choose, assert, document).
- Contract test: every entry in `shared/config/siteTemplates.ts` parses, references a real theme id and real block types, and contains no `stats`/metric keys.
- Live proof: fresh account → choose Music template at signup → Studio shows the assembled multi-page site → published page matches preview → reload persists.

**Stop conditions:** if a template needs a block shape the contract rejects, fix the contract deliberately — do not bypass validation. If `profiles.ts`/`blocks.ts` ratchet lines block the refactor, split into new modules rather than raising the baseline.

---

## Phase 2 — Guide the first three minutes, then tell the user how to share

**Problem:** after signup the user lands in the full application. Confirmed: no onboarding, checklist, tour or empty state exists anywhere; `BlockList.tsx` (67 lines) renders *nothing* when the list is empty.

1. **Progress derived from real state, never stored as a number.** Compute `setup` in the studio profile payload (`server/routes/profiles.ts`) from actual rows: photo set (`avatar_url` differs from the seeded placeholder), at least one meaningful block beyond the seeded `My Website`, at least one social, a bio the user edited, a preview performed, a published page. Ship an explicit `setupDismissedAt` column rather than `localStorage`, so progress follows the account.
2. **Checklist card** in the Content tab, visible while incomplete, each row deep-linking to the exact control (handle → identity card, photo → avatar field, link → Add block, social → socials editor, preview → "View Live Page"). At 100% it becomes a "Your site is ready" card with the share actions.
3. **Recommended blocks, driven by data.** `shared/config/recommendedBlocks.ts` maps the intents already collected at signup (`RegisterPage.tsx:27-34`) to catalog entries with suggested titles. Render "Recommended for you" above the grid in `BlockCatalogGrid.tsx` plus "Browse all blocks". Because Free already unlocks all 22 types, the section may **not** imply exclusivity; if a suggestion needs Pro dates (e.g. tour dates), label it truthfully.
4. **Empty state** for the block list: one primary action, one line of copy, no decorative illustration placeholder.
5. **Share moment after publish.** Compose from the real URL: Copy link (exists), QR (reuse `QrCodeModal`), WhatsApp `https://wa.me/?text=…`, and "Add to Instagram bio" that copies the URL and opens Instagram's profile-edit page with instructions. No "we'll boost your reach" copy.
6. **Milestones from real analytics only.** First visitor / first click / first subscriber computed from the existing event and subscriber tables and shown once per account (persist the acknowledgement server-side with the event id that triggered it). If there is no data, show nothing.

**Acceptance:** server test that setup progress advances only on the corresponding DB write; test that `recommendedBlocks` returns only ids present in `BLOCK_CATALOG` and that the rendered section is plan-neutral; share-URL construction tests including Arabic and custom-domain origin; milestone test proving no banner appears on an empty profile; live proof end to end.

---

## Phase 3 — One domain, one vocabulary

**Problem:** trust leaks through inconsistency. The reviewer's `raloa.me` example is already fixed, but the underlying cause — hosts and nouns written inline — is not.

1. **Remove every remaining user-facing hardcoded host.** Confirmed list: `src/features/public-bio/hooks/usePublicProfile.ts:35-36` (canonical + OG fallback), `src/App.tsx:305` ("back to Studio"), `src/config/i18n.ts:138,257,327,446`, `src/config/faq.ts:16,29`, `src/features/builder/components/panels/IntegrationsPanel.tsx:146` (API snippet), `src/features/builder/components/panels/SettingsPanel.tsx:339` (should read `brand.cnameTarget`, not `raloa-app.fly.dev`), `src/features/builder/hooks/useBlocks.ts:127` (starter block URL), `public/robots.txt:6`. All read `shared/config/brand.ts`.
2. **Regression guard, not a grep of hope:** a test that fails when any `src/**/*.tsx` literal contains `raloa.app`, `raloa.me` or `fly.dev` outside an allowlist, mirroring the architecture-ratchet style already used in `tests/architecture_boundaries.test.ts`.
3. **Decide and document the origin rule:** QR/copy-link deliberately use `window.location.origin` so custom domains share the right address (`useQrTarget.ts:25-28`, `BuilderContext.tsx:455`); marketing text uses `brand.domain`. Keep both, and state the rule in a comment at the brand config rather than per call site.
4. **One glossary, applied.** Adopt Account → Site → Pages → Blocks (Studio as the tool). Replacements: "Bio Profile"/"New Bio Profile" → "Site"/"New Site" (`NewProfileDialog.tsx:21,25`, `BuilderToolbar.tsx:115`), "Blocks & Content" → "Content" (`BuilderSidebar.tsx:21`), "Studio Builder" → "Studio" (`i18n.ts:129`), and stop mixing mini-site/micro-site (counts today: mini-site 22, micro-site 4) — pick one per surface: "site" in-app, and one fixed phrase in marketing.
5. **Fix the string architecture that allows drift.** Convert the inline bilingual ternaries (`GuidesPage.tsx:51,60`, `FeaturesPage.tsx:137`, `ProfilesSettingsPanel.tsx:10`, `src/components/comparison/*`) into dictionary entries, and add the missing Arabic for `Launch My Page` (see step 6).
6. **Language precision:** rename the signup CTA to "Create my site" and reserve "Publish"/"Live" for the actual live action (aligns with Phase 5a). Rename the dead `'Real Analytics'` key (`runtimeTranslations.ts:33`).
7. **Arabic-parity ratchet:** a test collecting every `ui('…')` literal in `src/` and asserting an Arabic entry exists. Land it as a ratchet (baseline the current missing set, then fail on any addition) — a full sweep is out of scope and would produce a 500-line unverifiable diff.

**Acceptance:** guard tests green; every renamed string verified in both languages in the browser; no orphaned translation keys; `git grep` free of user-facing hardcoded hosts.

---

## Phase 4 — Studio information architecture, and a paywall that is real

1. **Tabs:** Content · Design · Audience · Analytics · Settings, defined once in `BuilderSidebar.tsx` with ids added to `types/builder.types.ts:3`. Audience holds the form-submission inbox, subscribers and newsletter list — today buried in Settings (`SettingsPanel.tsx:657-790`, `:796`).
2. **Settings sub-navigation:** Site · Domain & SEO · Integrations · Billing · Advanced (CSS, fonts, background media, redirect). Split the 799-line `SettingsPanel.tsx` into one file per section — this is also required by the 800-line architecture ceiling, so the split is a constraint, not a stylistic choice.
3. **Stop monetising the editor.** Replace the three plan cards (`SettingsPanel.tsx:113-165`) with a compact "Current plan: Free" row + one "Upgrade" action.
4. **Contextual upgrades that actually work:** one shared `UpgradeDialog` opened from each locked affordance (domain, pixels, custom CSS, white-label, background media, scheduling, API keys, profile limit), stating the specific capability and its plan, then routing to the existing Stripe portal/checkout (`useProfile.ts:214-225`). Today those spots are only a `PRO FEATURE` badge plus `disabled` input — the dialog must be wired to real Stripe entry points, never a mock.
5. **Mobile Studio:** replace the four equal-width long labels with a bottom bar (Content · Design · Stats · More) while desktop keeps full labels; the existing floating Editor/Live Preview pill (`BuilderWorkspace.tsx:63-83`) stays as the preview toggle. Verify at 360/390/414px with screenshots and an overflow test; keep the ≥44px tap-target and 13px type floors already enforced.

**Acceptance:** `builder_decomposition.test.tsx` updated to render each new tab/panel; behaviour-preserving move proven by diff review plus live check that every setting reachable before is reachable after (enumerate before/after in the PR notes); `UpgradeDialog` tested to open with the right reason and to hit the real billing endpoint (mock the API call, not the routing).

---

## Phase 5a — Make "Saved · Live" true and unambiguous (now)

RALOA genuinely has no draft revision, so the honest UI is Model A. `BuilderToolbar.tsx:122-139` must show `Saved · Live` with the tooltip "Changes are published automatically", plus per-page truth ("Home is live", "Archive is unpublished") from `pages.published`. **Do not display the word "Draft"** anywhere before Phase 5b exists — that is precisely the kind of label this roadmap forbids.

## Phase 5b — Draft → Preview → Publish (separate plan, XL)

Requires stored revisions and a read-path switch across *every* public surface: `publicBlocksForPage` (`profiles.ts:101-110`), `loadVisibleProfileBlocks` (`server.ts:329-335`), `/r/:blockId` (`analytics.ts:178`), content-gate verify (`blocks.ts:126`), form submit (`forms.ts:33`), newsletter (`newsletter.ts:56`), the v1 API, prerendered SEO pages and the sitemap. Deserves its own document once Phases 1-4 land; until then the roadmap records it as *deliberately not built*.

---

## Phase 6 — Guided custom-domain connection

Keep the existing verification endpoint; rebuild the UI as three steps: enter host → exactly the records to add, from `brand.cnameTarget` with copy buttons → "Waiting for DNS…" polling with a plain-language outcome. TLS/CSR vocabulary moves behind "Advanced diagnostics". Failure text must name the specific missing record. Also add domain-aware canonical/OG behaviour consistently (Phase 3 step 3) so a connected domain never renders `raloa.app` in share metadata.

**Acceptance:** component test per state (idle / awaiting / verified / failed), server test that a misconfigured domain reports the missing record rather than a generic error, live proof against a real test domain or a documented DNS-simulation stub that fails closed.

---

## Phase 7 — Marketing that proves the outcome

1. **Above the fold, three answers only:** what it is, why better, "can I see one?". Confirmed today all ten of the review's items are stacked in the hero (badge, subheadline with links/media/bookings/newsletter/EN+AR/RTL, two guarantee lines, four `HeroFeatureShowcase` badges, four demo tabs + six theme dots). Move feature detail below the fold; the phone preview carries the proof. Keep the claim-input handle CTA — it is good.
2. **Delete dead competitor data or make it defensible.** 48 "Not assessed" cells in configs no component renders (`i18n.ts:220-239,418-428`, `marketing.ts:1-11`) is a trap waiting for a future render. Remove the dormant table, or rebuild it with a dated methodology and every cell actually checked. Filling cells from memory is explicitly forbidden.
3. **Replace the strawman comparison** ("Basic link list", `comparisonContent.ts:6-27`) with "Choose RALOA if you need…" plus an honest "a simple link list may be enough for you" close. Keep `MigrationBanner`'s named-competitor copy — that one is factual.
4. **Show real examples** from Phase 1: the gallery previews real compositions, so "can I see one?" becomes answerable without inventing anything.
5. **Social proof is not implementable now.** Only five or so real, consenting users would qualify, and none exist in the codebase today. Honest options: keep the clearly-labelled fictional examples and add a genuine "made with RALOA" gallery of real published profiles behind explicit owner consent (a server-side `showcase_opt_in` flag) — never scraped, never fabricated.

---

## Phase 8 — Google / Apple signup (blocked: needs credentials)

Design is ready and reuses existing infrastructure: an `account_identities` table (provider, stable provider id, email, encrypted tokens) alongside `server/secretStore.ts`, the `instagram_oauth_states` single-use-state pattern, and `session_version`-aware cookie issuance in `server/routes/auth.ts`.

**Hard blocker — external, maintainer-owned:** Google OAuth client id/secret plus authorised origins for `raloa.app`, and an Apple Services ID with a key. `.env.example` has no Google/Apple variables today. Until those exist, the shippable, honest friction reduction is: single-screen email signup with autofill attributes, intent/theme moved *after* account creation (Phase 1 step 6 makes the site work without them), and password-policy text that matches `shared/schemas/auth.ts` exactly. Building a Google button that 404s is a fake implementation and is refused.

---

## Explicitly rejected as fake

- `localStorage`-backed onboarding progress or a checklist that reappears/disappears per device.
- A "Recommended for you" list not derived from the stored intent, or one that implies paywalling blocks Free already includes.
- Any label implying drafts, scheduling or domains work when the server has no such state.
- Fabricated testimonials, visitor counts, or competitor comparison cells.
- Rendering `?template=` as a theme-only action while calling it "Use this template".
- Lowering coverage thresholds, widening exclusions, or bumping the architecture baseline to make a phase look finished.

## Risks

- **Phase 1 writes more rows at signup**, touching account deletion, duplication, importers, API v1 and prerendering. Mitigation: apply through the shared materializer only, and re-run `block_visibility`, `profile_duplication`, `e2e-workflow`, `acceptance` suites per step.
- **Vocabulary rename** touches Arabic keys and Playwright label assertions (`playwright/e2e/core-journeys.spec.ts` pins `Launch My Page`) — rename copy and assertions in the same commit.
- **Settings split** risks losing a control; mitigate with a before/after control inventory in the PR description.
- Local DB `data/raloa.db` still contains prior throwaway accounts (`@vischeckb1lz20`, `splitcheck*`); live verification will add more and must not be mistaken for product data.
