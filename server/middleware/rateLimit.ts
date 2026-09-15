import { Request, Response, NextFunction } from 'express';

interface RateLimitBucket {
  timestamps: number[];
}

// Rate limiting is deliberately process-local. A database write on every public
// request serializes SQLite under load and turns abuse protection into the
// application's primary bottleneck. Clustered deployments should place a
// shared edge limiter (for example, a reverse proxy/WAF) in front of workers.
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

    bucket.timestamps = bucket.timestamps.filter(timestamp => now - timestamp < options.windowMs);
    res.setHeader('X-RateLimit-Limit', options.limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.limit - bucket.timestamps.length - 1));

    if (bucket.timestamps.length >= options.limit) {
      const oldest = bucket.timestamps[0] || now;
      res.setHeader('Retry-After', Math.max(1, Math.ceil((oldest + options.windowMs - now) / 1000)));
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    bucket.timestamps.push(now);
    return next();
  };
}
