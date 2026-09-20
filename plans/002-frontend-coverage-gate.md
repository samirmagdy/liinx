# Measure production React code in the coverage gate

**Status:** TODO  
**Written against:** `57e4c23`  
**Finding:** The Vitest coverage `include` list currently measures backend/shared modules and only `src/config/**/*.ts` plus `src/utils/**/*.ts`. The React application in `src/components`, `src/features`, `src/pages`, `src/hooks`, `src/context`, and `src/animations` is not included, so the CI coverage job provides no coverage measurement for those production modules.

## Goal

Make `npm run test:coverage` collect and enforce coverage for production React/TypeScript source, including current UI tests. Preserve all existing backend/global thresholds. Add a separate nonzero aggregate threshold for frontend source and add focused tests until it passes. Do not manufacture a green result by excluding difficult UI code, reducing existing thresholds, or setting the new frontend threshold to zero.

## Repository context and conventions

- Node.js 22+, TypeScript, React 19, Vitest 5, Vite 6, and npm.
- Vitest config lives in `vite.config.ts`. The coverage provider is V8; reports are written under ignored `coverage/`.
- CI runs `npm test` and then `npm run test:coverage` in `.github/workflows/ci.yml`.
- Component tests use server rendering with `renderToString` in the Node test environment. Examples include `tests/builder_decomposition.test.tsx`, `tests/public_bio_decomposition.test.tsx`, and `tests/builder_production_states.test.tsx`.
- Tests for production state and component behavior should extend the existing suites or use a clearly named test matching their patterns. Do not add dependencies or switch the test environment unless existing test capabilities prove insufficient.
- `src/demo/**` contains fixture/demo data, and `src/**/types/**` plus declaration files are not meaningful executable coverage targets.

## Current implementation

`vite.config.ts` currently configures:

```ts
include: [
  'server/**/*.ts',
  'shared/**/*.ts',
  'src/config/**/*.ts',
  'src/utils/**/*.ts'
],
exclude: [
  '**/*.d.ts',
  '**/types/**',
  'scripts/**',
  'dist/**',
  'server/maintenance.ts',
  'server/instagramScheduler.ts'
],
thresholds: {
  statements: 76,
  lines: 79,
  functions: 80,
  branches: 72,
  // Existing backend file-specific thresholds follow.
}
```

Vitest is configured with a single Node environment and serial file execution. Existing React component tests render using `react-dom/server`; follow those conventions for static component coverage.

## Scope

Files in scope:

- `vite.config.ts`
- Relevant UI test files under `tests/` to establish useful coverage for included application code.

Explicitly out of scope:

- Lowering any current global or backend file-specific coverage threshold.
- Excluding whole React feature areas, pages, hooks, or components to raise the reported percentage.
- Adding a browser-test framework, third-party testing library, or dependency solely for this work.
- Refactoring product components only to improve coverage numbers.
- Changing CI job ordering or deployment/build behavior.

## Ordered implementation steps

1. **Expand coverage collection to executable production frontend source.** Include production `src/**/*.ts` and `src/**/*.tsx` while preserving current `server/**`, `shared/**`, config, and utility coverage. Exclude only non-production/demo data and non-executable type declarations/types using precise globs; do not exclude `src/components`, `src/features`, `src/pages`, `src/hooks`, `src/context`, or `src/animations`.

   Verification: `npm run test:coverage`  
   Expected: report lists production frontend files and test coverage is still generated. It may fail thresholds before tests are added; capture the frontend aggregate figures and uncovered production files in the executor's working notes, not by lowering existing gates.

2. **Add a separate frontend aggregate threshold.** Use Vitest's documented per-glob threshold configuration for `src/**/*.ts` and `src/**/*.tsx` (or a single supported frontend glob) so the frontend has its own gate, independent of the already established backend aggregate. Set a meaningful initial minimum of at least 50% statements, 50% lines, 40% functions, and 40% branches for the included production frontend set. Keep every existing threshold unchanged. If current local Vitest rejects the glob configuration, stop and report the type/runtime constraint before changing the intended scope.

   Verification: `npm run typecheck`  
   Expected: TypeScript accepts the Vitest configuration.

3. **Add tests for uncovered, user-critical branches until the frontend threshold passes.** Use the initial coverage report to identify uncovered production modules. Prioritize builder save/error states, account/auth UI state, and public profile rendering. Reuse existing `renderToString` fixtures/providers and test patterns. Assert visible state or returned behavior, not implementation details. If testing a module requires browser-only APIs that existing Node/SSR tests cannot model, document that gap and stop for a browser-testing design decision rather than excluding the module.

   Verification: `npm run test:coverage`  
   Expected: backend/global thresholds and the new frontend thresholds all pass; the report includes frontend source rather than only server/shared/utilities.

4. **Review the final include/exclude and thresholds.** Check that no broad exclusion hides production React files, no threshold was reduced, and reports distinguish frontend coverage from the existing backend aggregate. Keep the change limited to coverage configuration and focused tests.

   Verification: `npm run lint`  
   Expected: ESLint exits 0 (warnings may remain if they are pre-existing).

## Test plan

- First run `npm run test:coverage` in the executor's isolated worktree after changing the include list; the command writes reports under ignored `coverage/`.
- Add or extend focused UI tests under `tests/`, following `tests/builder_decomposition.test.tsx` and `tests/public_bio_decomposition.test.tsx` for provider setup and SSR rendering.
- Ensure test assertions cover both successful and error/empty states for prioritized UI modules where those states exist.
- Do not treat a test pass without frontend files in the coverage output as completion.

## Done criteria

- Coverage report includes executable production `.ts` and `.tsx` under `src/`, including builder, public-bio, components, hooks, pages, contexts, and animations.
- Separate frontend aggregate floors pass: statements >=50%, lines >=50%, functions >=40%, branches >=40%.
- All existing coverage thresholds remain byte-for-byte numerically unchanged.
- `npm run test:coverage`, `npm run typecheck`, `npm run lint`, and `npm run architecture:check` exit 0.
- No blanket exclusion hides an entire production frontend area.

## Maintenance note

When adding a new frontend feature, add tests that exercise its meaningful states and check that its files remain in the coverage report. Review coverage threshold changes alongside test reports; threshold reductions require a specific explanation and are outside this plan.

## Stop conditions

- If including all production frontend files makes the test suite exceed the 25-minute CI job limit, stop and report measured runtime and file-scope options; do not silently drop a feature subtree.
- If the existing global coverage aggregate falls below its current thresholds after inclusion, add tests to restore the thresholds. Do not lower established thresholds to accommodate the wider source set.
- If non-React production frontend modules cannot be collected with the pinned Vitest version, stop and report an alternative that preserves coverage visibility for every listed React area.
