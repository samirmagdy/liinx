import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { db, initDatabase } from '../server/db';
import { profilesRouter } from '../server/routes/profiles';
import { blocksRouter } from '../server/routes/blocks';
import { analyticsRouter } from '../server/routes/analytics';
import { formsRouter } from '../server/routes/forms';
import { newsletterRouter } from '../server/routes/newsletter';
import { signJwt } from '../server/auth';

describe('link scheduling and time-release', () => {
  const app = express();
  app.use(express.json());
  app.use('/api', profilesRouter);
  app.use('/api', blocksRouter);
  app.use('/api', formsRouter);
  app.use('/api', newsletterRouter);
  app.use('/', analyticsRouter);

  const testProfileId = 'prf_schedule_test';
  const testUsername = 'scheduletester';
  const testUserId = 'usr_schedule_test';

  beforeAll(() => {
    initDatabase();

    const now = Date.now();
    // This fixture may be rerun against the shared local test database. The
    // current schema intentionally requires page reassignment before deletion.
    db.prepare('UPDATE blocks SET page_id = NULL WHERE profile_id = ?').run(testProfileId);
    db.prepare('DELETE FROM blocks WHERE profile_id = ?').run(testProfileId);
    db.prepare('DELETE FROM pages WHERE profile_id = ?').run(testProfileId);
    db.prepare('DELETE FROM profiles WHERE id = ?').run(testProfileId);
    db.prepare(`INSERT OR REPLACE INTO users (id, email, password_hash, session_version, subscription_plan, created_at) VALUES (?, ?, ?, 1, 'pro', ?)`)
      .run(testUserId, 'schedule@example.test', 'fixture-hash', now);
    // Insert test profile
    db.prepare(`
      INSERT OR REPLACE INTO profiles (
        id, user_id, username, display_name, plan, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(testProfileId, testUserId, testUsername, 'Schedule Tester', 'pro', now, now);

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

  it('treats the end boundary as unavailable for public reads and click redirects', async () => {
    const now = Date.now();
    db.prepare('UPDATE blocks SET end_at = ? WHERE id = ?').run(now, 'blk_active_window');

    const profile = await request(app).get(`/api/profiles/${testUsername}`).expect(200);
    expect(profile.body.blocks.map((block: any) => block.id)).not.toContain('blk_active_window');
    await request(app).get('/r/blk_active_window').expect(404);
  });

  it('does not allow scheduled-hidden forms or newsletters to bypass public visibility', async () => {
    const now = Date.now();
    db.prepare(`INSERT INTO blocks (id, profile_id, type, title, position, end_at, page_id, extra_json, created_at, updated_at)
      VALUES (?, ?, 'form', 'Expired form', 10, ?, (SELECT id FROM pages WHERE profile_id = ? AND is_home = 1), ?, ?, ?)`)
      .run('blk_expired_form', testProfileId, now, testProfileId, JSON.stringify({ fields: [{ id: 'name', name: 'name', label: 'Name', type: 'text', required: true }] }), now, now);
    db.prepare(`INSERT INTO blocks (id, profile_id, type, title, position, end_at, page_id, created_at, updated_at)
      VALUES (?, ?, 'newsletter', 'Expired newsletter', 11, ?, (SELECT id FROM pages WHERE profile_id = ? AND is_home = 1), ?, ?)`)
      .run('blk_expired_newsletter', testProfileId, now, testProfileId, now, now);

    await request(app).post('/api/forms/submit').send({
      profileId: testProfileId, blockId: 'blk_expired_form', fields: { name: 'Visitor' }
    }).expect(404);
    await request(app).post('/api/newsletter/subscribe').send({
      profileId: testProfileId, blockId: 'blk_expired_newsletter', email: 'visitor@example.com', consent: true
    }).expect(404);
  });

  it('rejects a self-referential page redirect', async () => {
    const response = await request(app).put('/api/studio/profile').send({
      pageRedirectUrl: `http://127.0.0.1/@${testUsername}`
    }).set('Authorization', `Bearer ${signJwt({ userId: testUserId, email: 'schedule@example.test', profileId: testProfileId, username: testUsername, sessionVersion: 1 })}`);
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/cannot point back/i);
  });
});
