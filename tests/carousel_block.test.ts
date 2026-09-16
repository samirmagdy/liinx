import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';

describe('carousel block', () => {
  let token = '';
  let username = '';
  let pageId = '';

  beforeAll(async () => {
    const unique = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    username = `carousel_${unique}`.slice(0, 30);
    const registration = await request(app).post('/api/auth/register').send({ email: `carousel-${unique}@liinx.test`, password: 'CarouselPassword2026!', username }).expect(201);
    token = registration.body.token;
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    pageId = studio.body.pages.find((page: any) => page.isHome).id;
  });

  it('round-trips zero, one, and many slides in saved order', async () => {
    const empty = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'carousel', title: 'Empty carousel', extra: { items: [] } }).expect(201);
    const one = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'carousel', title: 'One slide', extra: { items: [{ id: 'one', imageUrl: 'https://example.com/one.jpg', alt: 'One slide', caption: 'A'.repeat(600) }] } }).expect(400);
    expect(one.body.error).toMatch(/500/);
    const oneValid = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'carousel', title: 'One valid slide', extra: { items: [{ id: 'one-valid', imageUrl: 'https://example.com/one.jpg', alt: 'One slide', caption: 'One caption' }] } }).expect(201);
    const slides = [
      { id: 'slide-a', imageUrl: 'https://example.com/a.jpg', alt: 'الشريحة الأولى', caption: 'First caption', linkUrl: 'https://example.com/a' },
      { id: 'slide-b', imageUrl: 'https://example.com/b.jpg', alt: 'الشريحة الثانية', caption: 'Second caption' },
      { id: 'slide-c', imageUrl: 'https://example.com/c.jpg', alt: 'الشريحة الثالثة', caption: 'Third caption', linkUrl: 'https://example.com/c' }
    ];
    const created = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'carousel', title: 'Many slides', extra: { items: slides } }).expect(201);
    await request(app).put(`/api/studio/blocks/${created.body.id}`).set('Authorization', `Bearer ${token}`).send({ extra: { items: [slides[2], slides[0], slides[1]] } }).expect(200);
    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(publicProfile.body.blocks.find((block: any) => block.id === empty.body.id).items).toEqual([]);
    expect(publicProfile.body.blocks.find((block: any) => block.id === oneValid.body.id).items).toHaveLength(1);
    expect(publicProfile.body.blocks.find((block: any) => block.id === created.body.id).items.map((item: any) => item.id)).toEqual(['slide-c', 'slide-a', 'slide-b']);
    expect(publicProfile.body.blocks.find((block: any) => block.id === created.body.id).items[0].caption).toBe('Third caption');
    await request(app).get(`/r/${created.body.id}?item=slide-c`).expect(302).expect(response => expect(response.headers.location).toBe('https://example.com/c'));
    await request(app).get(`/r/${created.body.id}?item=slide-b`).expect(404);
  });

  it('rejects unsafe slide links without altering existing order', async () => {
    const slides = [{ id: 'safe-slide', imageUrl: 'https://example.com/safe.jpg', alt: 'Safe', caption: 'Keep order' }];
    const created = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'carousel', title: 'Safe carousel', extra: { items: slides } }).expect(201);
    await request(app).put(`/api/studio/blocks/${created.body.id}`).set('Authorization', `Bearer ${token}`).send({ extra: { items: [{ ...slides[0], linkUrl: 'javascript:alert(1)' }] } }).expect(400);
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    expect(studio.body.blocks.find((block: any) => block.id === created.body.id).items).toEqual(slides);
  });
});
