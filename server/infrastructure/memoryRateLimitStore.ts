import { RateLimitStore, RateLimitResult } from './interfaces.js';
import { db } from '../db.js';

interface MemoryBucket {
  timestamps: number[];
}

export class MemoryRateLimitStore implements RateLimitStore {
  readonly name = 'memory-sqlite-hybrid';
  private buckets = new Map<string, MemoryBucket>();
  private readonly maxBuckets: number;

  constructor(maxBuckets = 100_000) {
    this.maxBuckets = maxBuckets;
  }

  checkAndIncrement(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const cutoff = now - windowMs;

    // Purge expired records in SQLite
    db.prepare('DELETE FROM rate_limit_events WHERE bucket_key = ? AND occurred_at <= ?').run(key, cutoff);
    const row = db.prepare('SELECT COUNT(*) AS count FROM rate_limit_events WHERE bucket_key = ?').get(key) as { count: number };
    const current = row.count;

    // In-memory bucket tracking for fast local process eviction
    let bucket = this.buckets.get(key);
    if (!bucket) {
      if (this.buckets.size >= this.maxBuckets) {
        this.purgeExpired(now, windowMs);
      }
      bucket = { timestamps: [] };
      this.buckets.set(key, bucket);
    }

    const allowed = current < limit;
    const remaining = Math.max(0, limit - current - 1);

    if (allowed) {
      db.prepare('INSERT INTO rate_limit_events (bucket_key, occurred_at) VALUES (?, ?)').run(key, now);
      bucket.timestamps.push(now);
    }

    const oldest = (db.prepare('SELECT occurred_at FROM rate_limit_events WHERE bucket_key = ? ORDER BY occurred_at ASC LIMIT 1').get(key) as { occurred_at?: number } | undefined)?.occurred_at || now;
    const resetMs = Math.max(1000, oldest + windowMs - now);

    return {
      allowed,
      current: allowed ? current + 1 : current,
      limit,
      remaining,
      resetMs
    };
  }

  reset(key?: string): void {
    if (key) {
      this.buckets.delete(key);
      db.prepare('DELETE FROM rate_limit_events WHERE bucket_key = ?').run(key);
    } else {
      this.buckets.clear();
      db.prepare('DELETE FROM rate_limit_events').run();
    }
  }

  private purgeExpired(now: number, windowMs: number): void {
    for (const [key, bucket] of this.buckets) {
      bucket.timestamps = bucket.timestamps.filter(ts => now - ts < windowMs);
      if (bucket.timestamps.length === 0) {
        this.buckets.delete(key);
      }
    }
  }
}

export const memoryRateLimitStore = new MemoryRateLimitStore();
