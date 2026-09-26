import { type Request, type Response, type NextFunction } from 'express';
import { verifyJwt, type AuthPayload } from '../auth.js';
import { db } from '../db.js';

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie || '';
  const item = header.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = bearer || readCookie(req, 'raloa_session');
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  const payload = verifyJwt(token);

  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session token. Please log in again.' });
  }

  // Ensure user still exists
  const user = db.prepare('SELECT id, session_version FROM users WHERE id = ?').get(payload.userId) as { id: string; session_version: number } | undefined;
  if (!user) {
    return res.status(401).json({ error: 'User account not found.' });
  }
  if (payload.sessionVersion !== undefined && Number(payload.sessionVersion) !== Number(user.session_version || 1)) {
    return res.status(401).json({ error: 'This session has been revoked. Please log in again.' });
  }

  // The active profile must belong to the authenticated user. This prevents a
  // forged/stale profileId claim from crossing tenant boundaries.
  const profile = db.prepare('SELECT id FROM profiles WHERE id = ? AND user_id = ?').get(payload.profileId, payload.userId);
  if (!profile) return res.status(401).json({ error: 'Your selected profile is no longer available. Please sign in again.' });

  req.user = payload;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!bearer) return next();
  const payload = verifyJwt(bearer);
  if (!payload) return next();
  const user = db.prepare('SELECT id, session_version FROM users WHERE id = ?').get(payload.userId) as { id: string; session_version: number } | undefined;
  const profile = db.prepare('SELECT id FROM profiles WHERE id = ? AND user_id = ?').get(payload.profileId, payload.userId);
  if (user && profile && (payload.sessionVersion === undefined || Number(payload.sessionVersion) === Number(user.session_version || 1))) req.user = payload;
  next();
}
