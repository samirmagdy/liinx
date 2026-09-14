import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';
import { signJwt } from '../server/auth.js';

describe('Milestone 8: Public REST API Access (Studio Tier) (0% Fake Implementation)', () => {
  const freeUserId = 'usr_api_free';
  const freeProfileId = 'prf_api_free';
  const freeUsername = 'freeapidev';
  let freeToken = '';

  const studioUserId = 'usr_api_studio';
  const studioProfileId = 'prf_api_studio';
  const studioUsername = 'studioapidev';
  let studioToken = '';

  let generatedApiKey = '';
  let generatedKeyId = '';

  beforeAll(() => {
    initDatabase();
    const now = Date.now();

    // 1. Free user
    db.prepare('DELETE FROM users WHERE id = ?').run(freeUserId);
    db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
      freeUserId, 'freeapi@liinx.test', 'hashed', now
    );
    db.prepare('DELETE FROM profiles WHERE id = ? OR username = ?').run(freeProfileId, freeUsername);
    db.prepare(`
      INSERT INTO profiles (id, user_id, username, display_name, plan, created_at, updated_at)
      VALUES (?, ?, ?, 'Free Dev', 'free', ?, ?)
    `).run(freeProfileId, freeUserId, freeUsername, now, now);

    freeToken = signJwt({
      userId: freeUserId,
      email: 'freeapi@liinx.test',
      profileId: freeProfileId,
      username: freeUsername
    });

    // 2. Studio user
    db.prepare('DELETE FROM users WHERE id = ?').run(studioUserId);
    db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
      studioUserId, 'studioapi@liinx.test', 'hashed', now
    );
    db.prepare('DELETE FROM profiles WHERE id = ? OR username = ?').run(studioProfileId, studioUsername);
    db.prepare(`
      INSERT INTO profiles (id, user_id, username, display_name, plan, created_at, updated_at)
      VALUES (?, ?, ?, 'Studio Dev', 'studio', ?, ?)
    `).run(studioProfileId, studioUserId, studioUsername, now, now);

    studioToken = signJwt({
      userId: studioUserId,
      email: 'studioapi@liinx.test',
      profileId: studioProfileId,
      username: studioUsername
    });

    // Clean any prior keys
    db.prepare('DELETE FROM api_keys WHERE profile_id = ?').run(studioProfileId);
  });

  it('restricts API key creation to Studio plan only (Free gets 403)', async () => {
    const res = await request(app)
      .post('/api/studio/api-keys')
      .set('Authorization', `Bearer ${freeToken}`)
      .send({ name: 'My CLI Tool' })
      .expect(403);

    expect(res.body.error).toMatch(/exclusively on the studio tier/i);
  });

  it('allows Studio plan user to generate a real API key', async () => {
    const res = await request(app)
      .post('/api/studio/api-keys')
      .set('Authorization', `Bearer ${studioToken}`)
      .send({ name: 'Zapier Automation' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.apiKey).toBeDefined();
    expect(res.body.apiKey).toMatch(/^liinx_live_/);
    expect(res.body.key.name).toBe('Zapier Automation');

    generatedApiKey = res.body.apiKey;
    generatedKeyId = res.body.key.id;

    // Verify key appears in studio listing
    const listRes = await request(app)
      .get('/api/studio/api-keys')
      .set('Authorization', `Bearer ${studioToken}`)
      .expect(200);

    expect(listRes.body.keys.length).toBe(1);
    expect(listRes.body.keys[0].id).toBe(generatedKeyId);
  });

  it('rejects public v1 endpoints without valid API key (401)', async () => {
    await request(app)
      .get('/api/v1/profile')
      .expect(401);

    await request(app)
      .get('/api/v1/profile')
      .set('Authorization', 'Bearer invalid_key_format')
      .expect(401);

    await request(app)
      .get('/api/v1/profile')
      .set('Authorization', 'Bearer liinx_live_00000000000000000000000000000000')
      .expect(401);
  });

  it('retrieves creator profile via GET /api/v1/profile using live API key', async () => {
    const res = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${generatedApiKey}`)
      .expect(200);

    expect(res.body.id).toBe(studioProfileId);
    expect(res.body.username).toBe(studioUsername);
    expect(res.body.plan).toBe('studio');
  });

  it('creates and deletes a link block via REST API v1', async () => {
    // 1. Create block
    const createRes = await request(app)
      .post('/api/v1/blocks')
      .set('Authorization', `Bearer ${generatedApiKey}`)
      .send({
        title: 'API Generated Link',
        url: 'https://developer.liinx.app/docs',
        subtitle: 'Created programmatically via REST API',
        badge: 'NEW API'
      })
      .expect(201);

    expect(createRes.body.success).toBe(true);
    expect(createRes.body.block.title).toBe('API Generated Link');
    const createdBlockId = createRes.body.block.id;

    // 2. Verify block in profile
    const profileRes = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${generatedApiKey}`)
      .expect(200);

    const foundBlock = profileRes.body.blocks.find((b: any) => b.id === createdBlockId);
    expect(foundBlock).toBeDefined();

    // 3. Delete block via API
    const deleteRes = await request(app)
      .delete(`/api/v1/blocks/${createdBlockId}`)
      .set('Authorization', `Bearer ${generatedApiKey}`)
      .expect(200);

    expect(deleteRes.body.success).toBe(true);
  });

  it('revokes API key and verifies subsequent API requests are rejected (401)', async () => {
    // Revoke key
    const revokeRes = await request(app)
      .delete(`/api/studio/api-keys/${generatedKeyId}`)
      .set('Authorization', `Bearer ${studioToken}`)
      .expect(200);

    expect(revokeRes.body.success).toBe(true);

    // Attempt request with revoked key
    const res = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${generatedApiKey}`)
      .expect(401);

    expect(res.body.error).toMatch(/invalid or revoked/i);
  });
});
