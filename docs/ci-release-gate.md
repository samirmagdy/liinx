# CI and release gate

The production quality workflow in `.github/workflows/ci.yml` validates source,
tests, coverage, compiled artifacts, dependencies, secrets, CodeQL findings,
and the production Docker image. It never publishes or deploys an image. A
green run is evidence that the checked commit passed the configured local/CI
checks, not evidence that external providers, DNS, TLS, or production secrets
were verified.

## Required repository settings

For `main` (and any production branch), configure branch protection or rulesets
to require:

- pull requests, with at least one code-owner/team review where available;
- the `validate` job and the `codeql`, `secret-scan`, and dependency-review
  checks when applicable;
- conversation resolution and stale approval dismissal after new commits;
- no direct pushes or force-pushes to the production branch where GitHub
  settings permit it.

The repository owner must confirm the exact required-check names after enabling
the workflow because GitHub identifies checks by job/context name. Deployment,
release publication, and production secret changes belong in a separately
authorized workflow and are intentionally absent here.

## Test credentials

CI values are visibly marked `ci-only` and are not copied from `.env`, hosting
secrets, provider credentials, or production-like formats. They exist only for
local fixtures and signature/validation tests. Provider tests must use a
sanctioned sandbox and injected short-lived secrets; never commit those values.

## Gate order

The main job fails on the first real failure in this order: clean checkout,
locked dependency install, typecheck, ESLint and architecture checks, unit and
integration tests, coverage thresholds, frontend build, server build, dependency
audit, compiled artifact validation, and Docker build verification. CodeQL,
secret scanning, and pull-request dependency review run as independent required
security checks. No security, test, build, or artifact step uses
`continue-on-error`.
