import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';

describe('Task 55 API key and page-aware REST boundaries', () => {
  const suffix = Date.now();
  let token = '';
  let profileId = '';
  let username = '';
  let pageId = '';
  let foreignPageId = '';
  let apiKey = '';
  let foreignApiKey = '';
  let createdBlockId = '';

  beforeAll(async () => {
    initDatabase();
    const first = await request(app).post('/api/auth/register').send({ email: `api55-${suffix}@liinx.test`, password: 'Password123!', username: `api55_${suffix}` });
    const second = await request(app).post('/api/auth/register').send({ email: `api55b-${suffix}@liinx.test`, password: 'Password123!', username: `api55b_${suffix}` });
    token = first.body.token;
    profileId = first.body.profileId;
    username = `api55_${suffix}`;
    db.prepare('UPDATE profiles SET plan = ? WHERE id IN (?, ?)').run('studio', profileId, second.body.profileId);
    pageId = (db.prepare('SELECT id FROM pages WHERE profile_id = ? AND is_home = 1').get(profileId) as { id: string }).id;
    foreignPageId = (db.prepare('SELECT id FROM pages WHERE profile_id = ? AND is_home = 1').get(second.body.profileId) as { id: string }).id;
    apiKey = (await request(app).post('/api/studio/api-keys').set('Authorization', `Bearer ${token}`).send({ name: 'Task 55 test key' })).body.apiKey;
    foreignApiKey = (await request(app).post('/api/studio/api-keys').set('Authorization', `Bearer ${second.body.token}`).send({ name: 'Task 55 foreign key' })).body.apiKey;
  });

  it('creates exactly one block when a page-aware request is retried with the same idempotency key', async () => {
    const body = { title: 'Page-scoped API link', url: 'https://example.com/page-scoped', pageId };
    const first = await request(app).post('/api/v1/blocks').set('Authorization', `Bearer ${apiKey}`).set('Idempotency-Key', 'task55-retry-1').send(body);
    const retry = await request(app).post('/api/v1/blocks').set('Authorization', `Bearer ${apiKey}`).set('Idempotency-Key', 'task55-retry-1').send(body);
    expect(first.status).toBe(201);
    expect(retry.status).toBe(200);
    expect(retry.body.idempotentReplay).toBe(true);
    createdBlockId = first.body.block.id;
    expect(first.body.block.pageId).toBe(pageId);
    expect((db.prepare('SELECT COUNT(*) AS count FROM blocks WHERE id = ?').get(createdBlockId) as { count: number }).count).toBe(1);
  });

  it('rejects a foreign page and foreign-profile block deletion without leaking details', async () => {
    const foreignPage = await request(app).post('/api/v1/blocks').set('Authorization', `Bearer ${apiKey}`).send({ title: 'Should not land here', url: 'https://example.com/foreign', pageId: foreignPageId });
    expect(foreignPage.status).toBe(404);
    const foreignDelete = await request(app).delete(`/api/v1/blocks/${createdBlockId}`).set('Authorization', `Bearer ${foreignApiKey}`);
    expect(foreignDelete.status).toBe(404);
    expect(foreignDelete.body.error).not.toContain(profileId);
  });

  it('keeps API-created blocks hidden when their selected page is unpublished', async () => {
    const page = await request(app).post('/api/studio/pages').set('Authorization', `Bearer ${token}`).send({ slug: 'private-api-page', title: 'Private API page', published: false });
    expect(page.status).toBe(201);
    const created = await request(app).post('/api/v1/blocks').set('Authorization', `Bearer ${apiKey}`).send({ title: 'Hidden API link', url: 'https://example.com/hidden', pageId: page.body.page.id });
    expect(created.status).toBe(201);
    const publicPage = await request(app).get(`/api/profiles/${username}?page=private-api-page`);
    expect(publicPage.status).toBe(404);
  });

  it('rejects malformed pagination and expired keys safely', async () => {
    const malformed = await request(app).get('/api/v1/profile?limit=101').set('Authorization', `Bearer ${apiKey}`);
    expect(malformed.status).toBe(400);
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    db.prepare('UPDATE api_keys SET expires_at = ? WHERE key_hash = ?').run(Date.now() - 1, keyHash);
    const expired = await request(app).get('/api/v1/profile').set('Authorization', `Bearer ${apiKey}`);
    expect(expired.status).toBe(401);
    expect(expired.body.error).toBe('Invalid or revoked API key.');
  });

  it('removes API entitlement immediately on plan downgrade', async () => {
    const activeKey = (await request(app).post('/api/studio/api-keys').set('Authorization', `Bearer ${token}`).send({ name: 'Downgrade test key' })).body.apiKey;
    db.prepare('UPDATE profiles SET plan = ? WHERE id = ?').run('free', profileId);
    const response = await request(app).get('/api/v1/profile').set('Authorization', `Bearer ${activeKey}`);
    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/studio tier/i);
  });
});
