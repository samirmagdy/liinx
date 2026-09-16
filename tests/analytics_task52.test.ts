import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';

describe('Task 52 analytics measurement contract', () => {
  const suffix = Date.now();
  let token = '';
  let profileId = '';
  let pageId = '';
  let blockId = '';

  beforeAll(async () => {
    initDatabase();
    const registered = await request(app).post('/api/auth/register').send({
      email: `analytics-${suffix}@liinx.test`, password: 'Password123!', username: `analytics_${suffix}`
    });
    token = registered.body.token;
    profileId = registered.body.profileId;
    pageId = (db.prepare('SELECT id FROM pages WHERE profile_id = ? AND is_home = 1').get(profileId) as { id: string }).id;
    const block = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({
      type: 'link', title: 'Measured link', url: 'https://example.com/task-52'
    });
    blockId = block.body.id;
  });

  it('records one page-attributed view for repeated delivery of the same minute bucket', async () => {
    const payload = { profileId, pageId, referrer: 'https://example.test/source', utmSource: 'newsletter', utmCampaign: 'task52' };
    const first = await request(app).post('/api/analytics/view').send(payload);
    const second = await request(app).post('/api/analytics/view').send(payload);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const rows = db.prepare('SELECT page_id, COUNT(*) AS count FROM profile_views WHERE profile_id = ? AND page_id = ?').get(profileId, pageId) as { page_id: string; count: number };
    expect(rows.page_id).toBe(pageId);
    expect(rows.count).toBe(1);
  });

  it('keeps click attribution, UTM forwarding, and report totals consistent', async () => {
    const first = await request(app).get(`/r/${blockId}?utm_source=profile&utm_campaign=task52`);
    const second = await request(app).get(`/r/${blockId}?utm_source=profile&utm_campaign=task52`);
    expect(first.status).toBe(302);
    expect(second.status).toBe(302);

    const click = db.prepare('SELECT page_id, target_url, utm_source FROM link_clicks WHERE block_id = ?').get(blockId) as { page_id: string; target_url: string; utm_source: string };
    expect(click).toMatchObject({ page_id: pageId, target_url: 'https://example.com/task-52', utm_source: 'profile' });

    const stats = await request(app).get('/api/analytics/stats').set('Authorization', `Bearer ${token}`);
    expect(stats.status).toBe(200);
    expect(stats.body.timezone).toBe('UTC');
    expect(stats.body.ctrBasis).toBe('total_clicks / total_views');
    expect(stats.body.totalViews).toBe(1);
    expect(stats.body.totalClicks).toBe(1);
    expect(stats.body.topLinks[0]).toMatchObject({ id: blockId, clicks: 1 });
  });

  it('rejects a foreign page without recording a view', async () => {
    const foreign = db.prepare('SELECT id FROM pages WHERE profile_id <> ? LIMIT 1').get(profileId) as { id?: string } | undefined;
    if (!foreign?.id) return;
    const response = await request(app).post('/api/analytics/view').send({ profileId, pageId: foreign.id });
    expect(response.status).toBe(404);
  });
});
