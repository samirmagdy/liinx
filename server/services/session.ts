import { db } from '../db.js';
import { signJwt } from '../auth.js';

/** Sign a session using the user's current database session version. */
export function issueCurrentSession(userId: string, profileId: string, username: string, email: string): string {
  const user = db.prepare('SELECT session_version FROM users WHERE id = ?').get(userId) as { session_version: number } | undefined;
  if (!user) throw new Error('Cannot issue a session for a missing user.');

  return signJwt({
    userId,
    profileId,
    username,
    email,
    sessionVersion: Number(user.session_version)
  });
}
