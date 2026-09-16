import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';

describe('gallery block', () => {
  let token = '';
  let username = '';
  let pageId = '';

  beforeAll(async () => {
    const unique = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    username = `gallery_${unique}`.slice(0, 30);
    const registration = await request(app).post('/api/auth/register').send({ email: `gallery-${unique}@liinx.test`, password: 'GalleryPassword2026!', username }).expect(201);
    token = registration.body.token;
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    pageId = studio.body.pages.find((page: any) => page.isHome).id;
  });

  it('creates, edits, reorders, persists, renders captions, and tracks only linked items', async () => {
    const items = [
      { id: 'gallery-a', imageUrl: 'https://example.com/a.jpg', alt: 'A', caption: 'Caption A', linkUrl: 'https://example.com/a' },
      { id: 'gallery-b', imageUrl: 'https://example.com/b.jpg', alt: 'B', caption: 'Caption B' },
      { id: 'gallery-c', imageUrl: 'https://example.com/c.jpg', alt: 'C', caption: 'Caption C', linkUrl: 'https://example.com/c' }
    ];
    const created = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'gallery', title: 'Portfolio gallery', extra: { items } }).expect(201);
    const blockId = created.body.id;
    const reordered = [items[2], { ...items[1], caption: 'Updated caption' }, items[0]];
    await request(app).put(`/api/studio/blocks/${blockId}`).set('Authorization', `Bearer ${token}`).send({ extra: { items: reordered } }).expect(200);

    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    expect(studio.body.blocks.find((block: any) => block.id === blockId).items).toEqual(reordered);
    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(publicProfile.body.blocks.find((block: any) => block.id === blockId).items).toEqual(reordered);
    await request(app).get(`/r/${blockId}?item=gallery-c`).expect(302).expect(response => expect(response.headers.location).toBe('https://example.com/c'));
    await request(app).get(`/r/${blockId}?item=gallery-b`).expect(404);
  });

  it('supports empty galleries and rejects unsafe optional links without losing existing items', async () => {
    const empty = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'gallery', title: 'Empty gallery', extra: { items: [] } }).expect(201);
    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(publicProfile.body.blocks.find((block: any) => block.id === empty.body.id).items).toEqual([]);
    const populated = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'gallery', title: 'Safe gallery', extra: { items: [{ id: 'kept', imageUrl: 'https://example.com/kept.jpg', caption: 'Keep me' }] } }).expect(201);
    await request(app).put(`/api/studio/blocks/${populated.body.id}`).set('Authorization', `Bearer ${token}`).send({ extra: { items: [{ id: 'kept', imageUrl: 'https://example.com/kept.jpg', linkUrl: 'javascript:alert(1)' }] } }).expect(400);
    const after = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    expect(after.body.blocks.find((block: any) => block.id === populated.body.id).items[0].caption).toBe('Keep me');
  });
});
