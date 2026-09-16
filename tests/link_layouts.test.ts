import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { initDatabase } from '../server/db.js';

describe('link layout contracts and persistence', () => {
  let token = '';
  let username = '';
  let pageId = '';

  beforeAll(async () => {
    initDatabase();
    const unique = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    username = `layout_${unique}`.slice(0, 30);
    const registration = await request(app).post('/api/auth/register').send({
      email: `link-layout-${unique}@liinx.test`, password: 'LinkLayoutPassword2026!', username
    }).expect(201);
    token = registration.body.token;
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    pageId = studio.body.pages.find((page: any) => page.isHome).id;
  });

  it('round-trips list, grid, and featured links without enabling carousel semantics', async () => {
    const layouts = ['list', 'grid', 'featured'];
    const ids = await Promise.all(layouts.map(async layout => {
      const response = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({
        pageId, type: 'link', title: `${layout} link`, url: `https://example.com/${layout}`, extra: { layout }
      }).expect(201);
      return response.body.id;
    }));
    await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'header', title: 'Section heading' }).expect(201);
    await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'form', title: 'Contact form', extra: { fields: [{ name: 'message', label: 'Message', type: 'textarea' }] } }).expect(201);
    await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'video', title: 'Video', extra: { videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', platform: 'youtube' } }).expect(201);

    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    const blocks = publicProfile.body.blocks;
    expect(ids.map(id => blocks.find((block: any) => block.id === id).layout)).toEqual(layouts);
    expect(blocks.map((block: any) => block.type)).toEqual(expect.arrayContaining(['link', 'header', 'form', 'video']));
    expect(blocks.some((block: any) => block.layout === 'carousel')).toBe(false);
  });

  it('rejects unsupported layout values at the API boundary', async () => {
    await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({
      pageId, type: 'link', title: 'Unsupported layout', url: 'https://example.com', extra: { layout: 'carousel' }
    }).expect(400);
  });
});
