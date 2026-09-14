import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { db, initDatabase } from '../server/db';
import { profilesRouter } from '../server/routes/profiles';
import { blocksRouter } from '../server/routes/blocks';

describe('Link Scheduling & Time-Release Engine (0% Fake Implementation)', () => {
  const app = express();
  app.use(express.json());
  app.use('/api', profilesRouter);
  app.use('/api', blocksRouter);

  const testProfileId = 'prf_schedule_test';
  const testUsername = 'scheduletester';

  beforeAll(() => {
    initDatabase();

    const now = Date.now();
    // Insert test profile
    db.prepare(`
      INSERT OR REPLACE INTO profiles (
        id, username, display_name, plan, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(testProfileId, testUsername, 'Schedule Tester', 'pro', now, now);

    // Clear blocks for test profile
    db.prepare('DELETE FROM blocks WHERE profile_id = ?').run(testProfileId);

    // 1. Regular link (no schedule)
    db.prepare(`
      INSERT INTO blocks (id, profile_id, type, title, url, position, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('blk_always_live', testProfileId, 'link', 'Always Live', 'https://example.com/always', 0, now, now);

    // 2. Future link (start_at in 1 hour)
    db.prepare(`
      INSERT INTO blocks (id, profile_id, type, title, url, position, start_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('blk_future_live', testProfileId, 'link', 'Future Release', 'https://example.com/future', 1, now + 3600000, now, now);

    // 3. Expired link (end_at 1 hour ago)
    db.prepare(`
      INSERT INTO blocks (id, profile_id, type, title, url, position, end_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('blk_expired_link', testProfileId, 'link', 'Expired Drop', 'https://example.com/expired', 2, now - 3600000, now, now);

    // 4. Currently active scheduled link (started 1 hour ago, ends in 1 hour)
    db.prepare(`
      INSERT INTO blocks (id, profile_id, type, title, url, position, start_at, end_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('blk_active_window', testProfileId, 'link', 'Flash 2-Hour Sale', 'https://example.com/sale', 3, now - 3600000, now + 3600000, now, now);
  });

  it('filters out future and expired links from public profile requests', async () => {
    const res = await request(app)
      .get(`/api/profiles/${testUsername}`)
      .expect(200);

    const blockIds = res.body.blocks.map((b: any) => b.id);
    expect(blockIds).toContain('blk_always_live');
    expect(blockIds).toContain('blk_active_window');
    expect(blockIds).not.toContain('blk_future_live');
    expect(blockIds).not.toContain('blk_expired_link');
  });
});
