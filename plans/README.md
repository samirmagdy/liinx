# Improvement plans

Written against commit `57e4c23` on 2026-09-20. The repository had no existing `plans/` directory when this audit began. Both vetted findings were selected by the maintainer (“fix all findings”).

The referenced `references/plan-template.md` and `references/audit-playbook.md` were not present in the available skill or plugin files. These plans follow the self-contained requirements supplied in the request.

## Recommended order

| Order | Plan | Priority | Depends on | Status |
|---|---|---|---|---|
| 1 | [001-atomic-password-reset-token-consumption.md](001-atomic-password-reset-token-consumption.md) | High: close a concurrency hole in one-time credential recovery | None | TODO |
| 2 | [002-frontend-coverage-gate.md](002-frontend-coverage-gate.md) | Medium: make the coverage gate measure production React code | None; can run in parallel with 001 | TODO |

## Considered and rejected

- None in this audit.
