# Architecture guardrails

RALOA treats source size as a review signal, not a formatting target. New
production code should be organized by responsibility: route handlers should
validate and delegate, React components should compose focused views/hooks, and
storage, analytics, persistence, and provider code should remain behind their
interfaces.

## Checks

`npm run architecture:check` scans production TypeScript/TSX under `src/` and
`server/` and blocks new or worsened violations against
`.architecture-baseline.json`:

- files over 800 lines require architectural review;
- functions over 100 lines require review;
- cyclomatic-style complexity over 25 requires review;
- control-flow nesting deeper than 4 requires review.

The baseline prevents existing debt from making CI permanently unusable while
still preventing a new change from expanding a known god-file or function. If
an existing violation is intentionally changed, the pull request must explain
the responsibility boundary and update the baseline deliberately with
`npm run architecture:baseline`. A baseline update is evidence of review, not
permission to increase size without justification.

ESLint configures the same complexity, max-lines, max-lines-per-function, and
max-depth rules as warnings. This keeps the signal visible in editor and lint
output while the baseline-aware check supplies the CI blocking behavior.

Generated output, build artifacts, migrations/data-heavy configuration, and
fixture-like data are explicit exceptions in the baseline (`src/config/**`,
`src/demo/**`, `server/db.ts`, `dist/**`, `dist-server/**`, `coverage/**`, and
`data/**`). They should still be reviewed when they materially affect runtime
behavior. Do not split a file into meaningless fragments merely to satisfy a
line count; extract a coherent responsibility or document why an exception is
appropriate.
