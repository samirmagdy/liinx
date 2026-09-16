import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';
import { flushAnalyticsBuffers } from '../server/routes/analytics.js';

describe('basic link block journey', () => {
  let token = '';
  let username = '';
  let profileId = '';
  let homePageId = '';

  beforeAll(async () => {
    initDatabase();
    const unique = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    username = `link_${unique}`.slice(0, 30);
    const registration = await request(app).post('/api/auth/register').send({
      email: `basic-link-${unique}@liinx.test`, password: 'BasicLinkPassword2026!', username
    }).expect(201);
    token = registration.body.token;
    profileId = registration.body.profileId;
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    homePageId = studio.body.pages.find((page: any) => page.isHome).id;
  });

  it('creates, persists, renders, tracks, and deletes a valid link', async () => {
    const title = 'A'.repeat(150);
    const destination = 'https://例え.テスト/مسار?q=مرحبا';
    const created = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({
      pageId: homePageId, type: 'link', title, url: destination, subtitle: 'Unicode destination', icon: '🔗', badge: 'READ', highlighted: true
    }).expect(201);
    const blockId = created.body.id;
    expect(created.body.url).toBe(destination);
    expect(created.body.icon).toBe('🔗');

    const persisted = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    expect(persisted.body.blocks.find((block: any) => block.id === blockId)).toMatchObject({ title, url: destination, badge: 'READ', highlighted: true });

    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(publicProfile.body.blocks.find((block: any) => block.id === blockId)).toMatchObject({ title, url: destination, icon: '🔗' });
    const redirect = await request(app).get(`/r/${blockId}`).expect(302);
    expect(decodeURI(redirect.headers.location)).toBe(destination);
    flushAnalyticsBuffers();
    expect((db.prepare('SELECT COUNT(*) AS count FROM link_clicks WHERE block_id = ?').get(blockId) as any).count).toBe(1);

    await request(app).delete(`/api/studio/blocks/${blockId}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect((await request(app).get(`/api/profiles/${username}`).expect(200)).body.blocks.some((block: any) => block.id === blockId)).toBe(false);
    await request(app).get(`/r/${blockId}`).expect(404);
  });

  it('rejects unsafe and unfinished destinations without persisting them', async () => {
    for (const url of ['<not-a-url>', 'javascript:alert(1)', 'data:text/html,hello', 'https://']) {
      const response = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({
        pageId: homePageId, type: 'link', title: 'Invalid destination', url
      });
      expect(response.status).toBe(400);
    }
    expect((db.prepare("SELECT COUNT(*) AS count FROM blocks WHERE profile_id = ? AND title = 'Invalid destination'").get(profileId) as any).count).toBe(0);
  });

  it('allows an honest draft placeholder that cannot be clicked', async () => {
    const created = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({
      pageId: homePageId, type: 'link', title: 'Untitled link', subtitle: 'Add a destination before publishing'
    }).expect(201);
    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(publicProfile.body.blocks.find((block: any) => block.id === created.body.id).url).toBeNull();
    await request(app).get(`/r/${created.body.id}`).expect(404);
  });
});
