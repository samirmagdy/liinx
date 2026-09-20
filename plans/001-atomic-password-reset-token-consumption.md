# Atomically consume password reset tokens

**Status:** TODO  
**Written against:** `57e4c23`  
**Finding:** Password reset confirmation reads an unused token before starting its database transaction, then updates the password and token without a conditional consume. Concurrent requests using the same reset token can both succeed against the shared SQLite database.

## Goal

Make successful password reset a single-use operation across concurrent requests and SQLite connections. Exactly one request may consume a token. Losing requests must return the existing generic invalid-or-expired response and must not change the password or session version.

## Repository context and conventions

- Node.js 22+, TypeScript, Express, `better-sqlite3`, Vitest, and Supertest; package manager is npm.
- Route handlers live under `server/routes/`. Use synchronous database operations and `db.transaction(...)` for related state changes, following the existing account recovery route and other route transaction patterns.
- Authentication tests use direct API requests, a database fixture, deterministic inserted token rows, and assertions on HTTP status and persisted state. See `tests/account_recovery.test.ts`.
- Never log or return the raw reset token. Existing endpoint errors use a generic message so account-token validity is not disclosed.

## Current implementation

In `server/routes/auth.ts`, the handler currently selects the token before opening its transaction:

```ts
const token = db.prepare('SELECT user_id FROM account_tokens WHERE token_hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > ?')
  .get(tokenHash, 'password_reset', now) as { user_id: string } | undefined;
if (!token) return res.status(400).json({ error: 'This reset link is invalid or expired.' });
db.transaction(() => {
  db.prepare('UPDATE users SET password_hash = ?, session_version = session_version + 1 WHERE id = ?')
    .run(hashPassword(parsed.data.password), token.user_id);
  db.prepare('UPDATE account_tokens SET used_at = ? WHERE token_hash = ?').run(now, tokenHash);
})();
```

The predicate `used_at IS NULL AND expires_at > ?` is not rechecked by the write that marks the token consumed. With separate connections, two callers can both observe the unused row before either commits.

The existing sequential single-use regression test is `uses a single-use reset token and invalidates the old session` in `tests/account_recovery.test.ts`. It confirms a second request after the first response gets HTTP 400, but it does not exercise competing consumes.

## Scope

Files in scope:

- `server/routes/auth.ts`
- `tests/account_recovery.test.ts`
- Add a focused test helper or test file only if needed to exercise two independent SQLite connections against the same temporary database.

Explicitly out of scope:

- Email verification token handling, password reset email issuance, password policy, session JWT format, account deletion, schema migrations, rate limits, and frontend UI.
- Changing response text or status behavior for invalid, expired, or already-consumed tokens.

## Ordered implementation steps

1. **Add a concurrency regression test before changing production logic.** Extend `tests/account_recovery.test.ts` or add a focused sibling test. Arrange a valid reset token and send competing confirmations through independent database connections synchronized so both have an opportunity to observe the token before consumption. Assert exactly one successful response, all others return HTTP 400, and the token is marked used once. If the existing test harness cannot safely open a second connection to its live test database, use a temporary SQLite database in the focused test and the same route-level consume helper; do not make a nondeterministic timing-only test.

   Verification: `npm test -- tests/account_recovery.test.ts`  
   Expected before the fix: the concurrency assertion demonstrates the race or the test harness reports that it cannot create a deterministic two-connection case. If it cannot demonstrate the route-level race, stop and report the obstacle rather than claiming the regression is proven.

2. **Make consumption and password change conditional and atomic.** In the handler, move the token validity decision into the transaction that writes the password. Use a conditional `UPDATE account_tokens ... WHERE token_hash = ? AND purpose = 'password_reset' AND used_at IS NULL AND expires_at > ?`; only proceed to update the user password and increment `session_version` when exactly one row was changed. Ensure a failed consume does not modify the user, and that any exception rolls back both token consumption and the password/session update. Return the current generic HTTP 400 response when the conditional consume changes zero rows. Avoid relying on a prior `SELECT` as the authorization check.

   Verification: `npm test -- tests/account_recovery.test.ts`  
   Expected: all recovery tests pass, including one winner among competing requests, generic rejection for invalid/expired/replayed tokens, and old-session invalidation.

3. **Retain readable route behavior and add a persisted-state assertion.** Confirm the successful request increments the session version and the losing request cannot change the chosen password hash or further increment the version. Keep raw token material out of test failure messages and production logs.

   Verification: `npm run typecheck`  
   Expected: TypeScript exits 0.

## Test plan

- Extend `tests/account_recovery.test.ts`, using its `registerAccount`, `db`, generated reset-token fixture, and mocked mail flow as patterns.
- Exercise simultaneous requests with two SQLite connections when feasible; a `Promise.all` against one synchronous connection is not sufficient evidence of cross-connection atomicity.
- Verify only one request returns 200, at least one competing request returns 400, the token is used, the resulting password works once, and the pre-reset session is invalid.
- Verify expired and replayed requests continue returning HTTP 400.

## Done criteria

- Exactly one concurrent confirmation can consume a given reset token.
- A failed competing confirmation does not modify `users.password_hash` or increment `users.session_version`.
- Existing token replay, expiry, and session invalidation behavior remains intact.
- `npm test -- tests/account_recovery.test.ts`, `npm run typecheck`, `npm run lint`, and `npm run architecture:check` exit 0.
- No raw reset token is logged or included in a response.

## Maintenance note

Any future one-time account-token endpoint must put the unused/expiry predicate in its consuming write and make the protected action part of the same transaction. Review reset and verification token changes for the same check-then-act race.

## Stop conditions

- If the schema or SQLite library version cannot support the conditional update semantics described here, stop and report the constraint; do not replace it with a process-local mutex, because that does not protect multiple workers.
- If the route cannot be tested with separate connections without destabilizing the shared test database, stop and report a deterministic isolated-test design before weakening the concurrency assertion.
