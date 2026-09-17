import { CacheStore } from './interfaces.js';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCacheStore<T = unknown> implements CacheStore<T> {
  readonly name = 'memory-map';
  private cache = new Map<string, CacheEntry<T>>();
  private readonly defaultTtlMs: number;
  private readonly maxEntries: number;
  private purgeTimer?: NodeJS.Timeout;

  constructor(defaultTtlMs = 60_000, maxEntries = 10_000) {
    this.defaultTtlMs = defaultTtlMs;
    this.maxEntries = maxEntries;
    this.purgeTimer = setInterval(() => this.purgeExpired(), 60_000);
    this.purgeTimer.unref();
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() >= entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    if (this.cache.size >= this.maxEntries) {
      this.purgeExpired();
    }
    const duration = typeof ttlMs === 'number' ? ttlMs : this.defaultTtlMs;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + duration
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  deleteByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.purgeTimer) {
      clearInterval(this.purgeTimer);
    }
    this.cache.clear();
  }
}

export const memoryCacheStore = new MemoryCacheStore();
