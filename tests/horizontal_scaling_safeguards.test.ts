import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { getSystemCapabilities } from '../server/routes/capabilities.js';
import {
  supportsHorizontalScaling,
  detectMultiNodeAttempt,
  enforceSingleNodeSafeguards,
  sqliteDatabaseAdapter,
  localFileObjectStorage,
  memoryRateLimitStore,
  memoryBufferedEventStore,
  inProcessJobScheduler,
  MemoryCacheStore
} from '../server/infrastructure/index.js';

describe('Horizontal Scaling Safeguards & Infrastructure Interfaces', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.CLUSTER;
    delete process.env.HORIZONTAL_SCALING_ENABLED;
    delete process.env.INSTANCE_COUNT;
    delete process.env.REPLICAS;
    delete process.env.NODE_APP_INSTANCE;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('1. Runtime Capability Reporting', () => {
    it('declares supportsHorizontalScaling as false in the infrastructure layer', () => {
      expect(supportsHorizontalScaling).toBe(false);
    });

    it('returns supportsHorizontalScaling: false from getSystemCapabilities()', () => {
      const caps = getSystemCapabilities();
      expect(caps.supportsHorizontalScaling).toBe(false);
    });

    it('returns supportsHorizontalScaling: false over GET /api/capabilities', async () => {
      const res = await request(app).get('/api/capabilities');
      expect(res.status).toBe(200);
      expect(res.body.supportsHorizontalScaling).toBe(false);
      expect(typeof res.body.supportsHorizontalScaling).toBe('boolean');
    });
  });

  describe('2. Multi-Node Startup Safeguards', () => {
    it('detects a clean single-node environment by default', () => {
      const detection = detectMultiNodeAttempt();
      expect(detection.isMultiNode).toBe(false);
      expect(detection.reasons).toHaveLength(0);
      expect(() => enforceSingleNodeSafeguards(true)).not.toThrow();
    });

    it('detects and rejects CLUSTER=true', () => {
      process.env.CLUSTER = 'true';
      const detection = detectMultiNodeAttempt();
      expect(detection.isMultiNode).toBe(true);
      expect(detection.reasons[0]).toContain('CLUSTER=true');
      expect(() => enforceSingleNodeSafeguards(true)).toThrow(
        /Production horizontal scaling is disabled/i
      );
    });

    it('detects and rejects HORIZONTAL_SCALING_ENABLED=true', () => {
      process.env.HORIZONTAL_SCALING_ENABLED = 'true';
      const detection = detectMultiNodeAttempt();
      expect(detection.isMultiNode).toBe(true);
      expect(detection.reasons[0]).toContain('HORIZONTAL_SCALING_ENABLED=true');
      expect(() => enforceSingleNodeSafeguards(true)).toThrow(
        /Production horizontal scaling is disabled/i
      );
    });

    it('detects and rejects INSTANCE_COUNT > 1', () => {
      process.env.INSTANCE_COUNT = '3';
      const detection = detectMultiNodeAttempt();
      expect(detection.isMultiNode).toBe(true);
      expect(detection.reasons[0]).toContain('INSTANCE_COUNT=3');
      expect(() => enforceSingleNodeSafeguards(true)).toThrow(
        /Production horizontal scaling is disabled/i
      );
    });

    it('detects and rejects REPLICAS > 1', () => {
      process.env.REPLICAS = '2';
      const detection = detectMultiNodeAttempt();
      expect(detection.isMultiNode).toBe(true);
      expect(detection.reasons[0]).toContain('REPLICAS=2');
      expect(() => enforceSingleNodeSafeguards(true)).toThrow(
        /Production horizontal scaling is disabled/i
      );
    });

    it('detects and rejects PM2 secondary cluster workers (NODE_APP_INSTANCE > 0)', () => {
      process.env.NODE_APP_INSTANCE = '1';
      const detection = detectMultiNodeAttempt();
      expect(detection.isMultiNode).toBe(true);
      expect(detection.reasons[0]).toContain('NODE_APP_INSTANCE=1');
      expect(() => enforceSingleNodeSafeguards(true)).toThrow(
        /Production horizontal scaling is disabled/i
      );
    });

    it('permits PM2 primary worker (NODE_APP_INSTANCE=0)', () => {
      process.env.NODE_APP_INSTANCE = '0';
      const detection = detectMultiNodeAttempt();
      expect(detection.isMultiNode).toBe(false);
      expect(() => enforceSingleNodeSafeguards(true)).not.toThrow();
    });
  });

  describe('3. Infrastructure Interface Implementations', () => {
    it('SqliteDatabaseAdapter executes queries and health check', () => {
      expect(sqliteDatabaseAdapter.engine).toBe('sqlite');
      const health = sqliteDatabaseAdapter.healthCheck();
      expect(health.healthy).toBe(true);
      expect(health.engine).toBe('sqlite');
      expect(typeof health.latencyMs).toBe('number');

      const rows = sqliteDatabaseAdapter.query<{ result: number }>('SELECT 42 as result');
      expect(rows).toHaveLength(1);
      expect(rows[0].result).toBe(42);

      const one = sqliteDatabaseAdapter.queryOne<{ val: string }>('SELECT \'hello\' as val');
      expect(one?.val).toBe('hello');
    });

    it('LocalFileObjectStorage performs file lifecycle operations', async () => {
      expect(localFileObjectStorage.provider).toBe('local-fs');
      const testKey = `test-file-${Date.now()}.txt`;
      const testContent = Buffer.from('hello storage');

      const stored = await localFileObjectStorage.put(testKey, testContent, {
        mimeType: 'text/plain'
      });
      expect(stored.key).toBe(testKey);
      expect(stored.sizeBytes).toBe(testContent.length);
      expect(localFileObjectStorage.getUrl(testKey)).toContain(`/uploads/${testKey}`);

      const exists = await localFileObjectStorage.exists(testKey);
      expect(exists).toBe(true);

      const retrieved = await localFileObjectStorage.get(testKey);
      expect(retrieved?.toString('utf-8')).toBe('hello storage');

      const deleted = await localFileObjectStorage.delete(testKey);
      expect(deleted).toBe(true);

      const existsAfter = await localFileObjectStorage.exists(testKey);
      expect(existsAfter).toBe(false);
    });

    it('MemoryRateLimitStore limits and tracks request counts', () => {
      const key = `test-limit-${Date.now()}`;
      const res1 = memoryRateLimitStore.checkAndIncrement(key, 2, 60_000);
      expect(res1.allowed).toBe(true);
      expect(res1.current).toBe(1);
      expect(res1.remaining).toBe(1);

      const res2 = memoryRateLimitStore.checkAndIncrement(key, 2, 60_000);
      expect(res2.allowed).toBe(true);
      expect(res2.current).toBe(2);
      expect(res2.remaining).toBe(0);

      const res3 = memoryRateLimitStore.checkAndIncrement(key, 2, 60_000);
      expect(res3.allowed).toBe(false);
      expect(res3.current).toBe(2);

      memoryRateLimitStore.reset(key);
      const res4 = memoryRateLimitStore.checkAndIncrement(key, 2, 60_000);
      expect(res4.allowed).toBe(true);
      expect(res4.current).toBe(1);
    });

    it('MemoryBufferedEventStore accepts events and flushes cleanly', () => {
      expect(memoryBufferedEventStore.name).toBe('memory-buffered-sqlite');
      expect(() => {
        memoryBufferedEventStore.recordClick({
          id: `clk_test_${Date.now()}`,
          blockId: 'blk_test',
          profileId: 'prof_test',
          targetUrl: 'https://example.com',
          ipHash: 'hash',
          referrer: 'direct',
          userAgent: 'vitest',
          createdAt: Date.now()
        });
        memoryBufferedEventStore.recordView({
          id: `view_test_${Date.now()}`,
          profileId: 'prof_test',
          ipHash: 'hash',
          referrer: 'direct',
          userAgent: 'vitest',
          createdAt: Date.now()
        });
        memoryBufferedEventStore.flush();
      }).not.toThrow();
    });

    it('InProcessJobScheduler registers, starts, and stops jobs', () => {
      let runCount = 0;
      inProcessJobScheduler.register({
        name: 'test-job',
        intervalMs: 10_000,
        run: () => {
          runCount++;
        }
      });
      inProcessJobScheduler.start();
      inProcessJobScheduler.stop();
      expect(runCount).toBe(0); // Interval hasn't passed
    });

    it('MemoryCacheStore supports set, get, TTL, and prefix invalidation', () => {
      const cache = new MemoryCacheStore<string>(10_000);
      cache.set('user:1:profile', 'Profile One');
      cache.set('user:1:settings', 'Settings One');
      cache.set('user:2:profile', 'Profile Two');

      expect(cache.get('user:1:profile')).toBe('Profile One');
      expect(cache.get('non-existent')).toBeNull();

      cache.deleteByPrefix('user:1:');
      expect(cache.get('user:1:profile')).toBeNull();
      expect(cache.get('user:1:settings')).toBeNull();
      expect(cache.get('user:2:profile')).toBe('Profile Two');

      cache.destroy();
    });
  });
});
