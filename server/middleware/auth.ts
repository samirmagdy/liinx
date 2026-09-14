import { Request, Response, NextFunction } from 'express';
import { verifyJwt, AuthPayload } from '../auth.js';
import { db } from '../db.js';

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyJwt(token);

  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session token. Please log in again.' });
  }

  // Ensure user still exists
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(payload.userId);
  if (!user) {
    return res.status(401).json({ error: 'User account not found.' });
  }

  req.user = payload;
  next();
}
