# Improvement plans

Written against commit `57e4c23` on 2026-09-20. The repository had no existing `plans/` directory when this audit began. Both vetted findings were selected by the maintainer (“fix all findings”).

The referenced `references/plan-template.md` and `references/audit-playbook.md` were not present in the available skill or plugin files. These plans follow the self-contained requirements supplied in the request.

## Recommended order

| Order | Plan | Priority | Depends on | Status |
|---|---|---|---|---|
| 1 | [001-atomic-password-reset-token-consumption.md](001-atomic-password-reset-token-consumption.md) | High: close a concurrency hole in one-time credential recovery | None | TODO |
| 2 | [002-frontend-coverage-gate.md](002-frontend-coverage-gate.md) | Medium: make the coverage gate measure production React code | None; can run in parallel with 001 | TODO |
| 3 | [003-first-win-activation-roadmap.md](003-first-win-activation-roadmap.md) | High: turn templates into real starter sites, guide the first three minutes, unify domain and vocabulary | Internal phase ordering inside the document; Phase 8 is blocked on external OAuth credentials | TODO — awaiting priority call |

Plan 003 was written against `6fc47ac` from an external UX review. Its first section records which review claims were confirmed, which were refuted against current code (the `raloa.me` report is stale — fixed in `a381396`; the "`?template=` is unconsumed" report is wrong — `src/features/builder/hooks/useProfile.ts:86-105` consumes it), and which were only partly right.

## Considered and rejected

- None in the 2026-09-20 audit.
- Plan 003 rejects a list of cheap-looking but dishonest implementations (localStorage-only onboarding progress, theme-only "templates", draft labels without draft storage, fabricated social proof or competitor data, an OAuth button with no credentials). See its final sections.
