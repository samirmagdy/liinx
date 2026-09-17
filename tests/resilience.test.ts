import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';
import { flushAnalyticsBuffers } from '../server/routes/analytics.js';
import { createDatabaseBackup } from '../scripts/backup-db.js';

describe('Resilience, Fault Tolerance & Database Integrity Testing', () => {
  beforeAll(() => {
    initDatabase();
  });

  it('should gracefully handle malformed JSON in profile extra and socials columns', async () => {
    const corruptUsername = `corrupt_${Date.now()}`;
    const corruptProfileId = `prf_corrupt_${Date.now()}`;
    const now = Date.now();

    // Directly insert corrupt non-JSON strings into database
    db.prepare(`
      INSERT INTO profiles (
        id, username, display_name, custom_theme_json, socials_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      corruptProfileId,
      corruptUsername,
      'Corrupt Test',
      '{ invalid_json: ',
      '[ "not_json" ',
      now,
      now
    );

    // Insert block with corrupt extra_json
    const corruptBlockId = `blk_corrupt_${Date.now()}`;
    db.prepare(`
      INSERT INTO blocks (
        id, profile_id, type, title, url, position, extra_json, created_at, updated_at
      ) VALUES (?, ?, 'link', 'Corrupt Block', 'https://example.com', 0, 'INVALID_JSON_HERE', ?, ?)
    `).run(corruptBlockId, corruptProfileId, now, now);

    // Fetching the profile should NOT throw 500 error
    const res = await request(app).get(`/api/profiles/${corruptUsername}`);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe(corruptUsername);
    expect(res.body.customTheme).toBeNull();
    expect(res.body.socials).toEqual([]);
    expect(res.body.blocks).toHaveLength(1);
    expect(res.body.blocks[0].id).toBe(corruptBlockId);
  });

  it('should reject invalid block types with 400 Bad Request', async () => {
    const user = db.prepare('SELECT * FROM users LIMIT 1').get() as any;
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id) as any;

    // Login to get token
    const resLogin = await request(app).post('/api/auth/login').send({ email: user.email, password: 'password123' });
    const token = resLogin.body.token;

    const res = await request(app)
      .post('/api/studio/blocks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'non_existent_exploit_type',
        title: 'Exploit Block'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should gracefully handle 404 for missing link redirector targets', async () => {
    const res = await request(app).get('/r/non_existent_block_id_9999');
    expect(res.status).toBe(404);
    expect(res.text).toMatch(/not found or inactive/i);
  });

  it('should verify database disk integrity check succeeds without corruption', () => {
    // Flush any pending memory buffers to disk first
    flushAnalyticsBuffers();

    const integrity = db.pragma('integrity_check') as { integrity_check: string }[];
    expect(integrity).toHaveLength(1);
    expect(integrity[0].integrity_check).toBe('ok');
  });

  it('should create a valid zero-downtime database backup snapshot with verified integrity', async () => {
    const result = await createDatabaseBackup(5);
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(result.durationMs).toBeGreaterThan(0);
    expect(result.backupPath).toMatch(/\.db(\.enc)?$/);
  });
});
