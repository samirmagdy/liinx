import type { Database as BetterSqliteDatabase } from 'better-sqlite3';

/** Consume a reset token and update its account in one SQLite transaction. */
export function consumePasswordResetToken(
  database: BetterSqliteDatabase,
  tokenHash: string,
  now: number,
  passwordHash: string
): boolean {
  return database.transaction(() => {
    const consumed = database.prepare(
      "UPDATE account_tokens SET used_at = ? WHERE token_hash = ? AND purpose = 'password_reset' AND used_at IS NULL AND expires_at > ?"
    ).run(now, tokenHash, now);
    if (consumed.changes !== 1) return false;

    const token = database.prepare('SELECT user_id FROM account_tokens WHERE token_hash = ?').get(tokenHash) as { user_id: string };
    database.prepare('UPDATE users SET password_hash = ?, session_version = session_version + 1 WHERE id = ?').run(passwordHash, token.user_id);
    return true;
  })();
}
