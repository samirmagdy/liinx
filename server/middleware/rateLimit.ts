import { Request, Response, NextFunction } from 'express';
import { db } from '../db.js';

export function sharedRateLimit(options: { name: string; limit: number; windowMs: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'test') return next();
    const key = `${options.name}:${req.ip || req.socket.remoteAddress || 'unknown'}`;
    const now = Date.now();
    try {
      const allowed = db.transaction(() => {
        db.prepare('DELETE FROM rate_limit_events WHERE occurred_at < ?').run(now - options.windowMs);
        const current = db.prepare('SELECT COUNT(*) as count FROM rate_limit_events WHERE bucket_key = ? AND occurred_at >= ?').get(key, now - options.windowMs) as { count: number };
        if (current.count >= options.limit) return false;
        db.prepare('INSERT INTO rate_limit_events (bucket_key, occurred_at) VALUES (?, ?)').run(key, now);
        return true;
      })();
      if (!allowed) {
        res.setHeader('Retry-After', Math.ceil(options.windowMs / 1000));
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }
      return next();
    } catch (error) {
      console.error('Shared rate limiter error:', error);
      return res.status(503).json({ error: 'Request protection is temporarily unavailable. Please retry shortly.' });
    }
  };
}
