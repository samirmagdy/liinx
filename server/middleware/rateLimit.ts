import { Request, Response, NextFunction } from 'express';
import { db } from '../db.js';

interface RateLimitBucket {
  timestamps: number[];
}

// The database bucket is shared by all workers that use the same persistent
// database. Production startup also rejects unsupported multi-node scaling.
const buckets = new Map<string, RateLimitBucket>();
const MAX_BUCKETS = 100_000;

function purgeExpired(now: number) {
  for (const [key, bucket] of buckets) {
    bucket.timestamps = bucket.timestamps.filter(timestamp => now - timestamp < 60 * 60 * 1000);
    if (bucket.timestamps.length === 0) buckets.delete(key);
  }
}

const purgeTimer = setInterval(() => purgeExpired(Date.now()), 60_000);
purgeTimer.unref();

export function resetSharedRateLimits() {
  buckets.clear();
}

export function sharedRateLimit(options: { name: string; limit: number; windowMs: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'test') return next();
    const key = `${options.name}:${req.ip || req.socket.remoteAddress || 'unknown'}`;
    const now = Date.now();
    const cutoff = now - options.windowMs;
    db.prepare('DELETE FROM rate_limit_events WHERE bucket_key = ? AND occurred_at <= ?').run(key, cutoff);
    const row = db.prepare('SELECT COUNT(*) AS count FROM rate_limit_events WHERE bucket_key = ?').get(key) as { count: number };
    const count = row.count;
    let bucket = buckets.get(key);
    if (!bucket) {
      // Prevent an unbounded memory growth attack using many source IPs.
      if (buckets.size >= MAX_BUCKETS) purgeExpired(now);
      if (buckets.size >= MAX_BUCKETS) {
        return res.status(503).json({ error: 'Request protection is temporarily busy. Please retry shortly.' });
      }
      bucket = { timestamps: [] };
      buckets.set(key, bucket);
    }

    res.setHeader('X-RateLimit-Limit', options.limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.limit - count - 1));

    if (count >= options.limit) {
      const oldest = (db.prepare('SELECT occurred_at FROM rate_limit_events WHERE bucket_key = ? ORDER BY occurred_at ASC LIMIT 1').get(key) as { occurred_at?: number } | undefined)?.occurred_at || now;
      res.setHeader('Retry-After', Math.max(1, Math.ceil((oldest + options.windowMs - now) / 1000)));
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    db.prepare('INSERT INTO rate_limit_events (bucket_key, occurred_at) VALUES (?, ?)').run(key, now);
    return next();
  };
}
