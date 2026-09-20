import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

describe('standalone image block', () => {
  let token = '';
  let username = '';
  let pageId = '';

  beforeAll(async () => {
    initDatabase();
    const unique = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    username = `image_${unique}`.slice(0, 30);
    const registration = await request(app).post('/api/auth/register').send({
      email: `image-${unique}@raloa.test`, password: 'ImagePassword2026!', username
    }).expect(201);
    token = registration.body.token;
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    pageId = studio.body.pages.find((page: any) => page.isHome).id;
  });

  it('uploads, replaces, persists, and publicly renders image settings', async () => {
    const first = await request(app).post('/api/upload').set('Authorization', `Bearer ${token}`)
      .attach('image', png, 'first.png').expect(201);
    const second = await request(app).post('/api/upload').set('Authorization', `Bearer ${token}`)
      .attach('image', png, 'replacement.png').expect(201);
    expect(first.body.url).not.toBe(second.body.url);

    const createResponse = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({
      pageId, type: 'image', title: 'Arabic artwork', extra: {
        imageUrl: first.body.url, alt: 'لوحة زرقاء', caption: 'مقدمة الصورة', linkUrl: 'https://example.com/image',
        decorative: false, fit: 'contain', aspect: 'portrait', cropPosition: 'top'
      }
    }).expect(201);
    const created = createResponse;
    const blockId = created.body.id;

    await request(app).put(`/api/studio/blocks/${blockId}`).set('Authorization', `Bearer ${token}`).send({
      extra: { imageUrl: second.body.url, alt: 'Replacement artwork', caption: 'Updated caption', decorative: false, fit: 'cover', aspect: 'square', cropPosition: 'center', linkUrl: 'https://example.com/replacement' }
    }).expect(200);

    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    expect(studio.body.blocks.find((block: any) => block.id === blockId)).toMatchObject({ imageUrl: second.body.url, alt: 'Replacement artwork', fit: 'cover', aspect: 'square' });
    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(publicProfile.body.blocks.find((block: any) => block.id === blockId)).toMatchObject({ imageUrl: second.body.url, caption: 'Updated caption', linkUrl: 'https://example.com/replacement' });
    await request(app).get(`/r/${blockId}`).expect(302).expect(response => {
      expect(response.headers.location).toBe('https://example.com/replacement');
    });
    expect((db.prepare('SELECT COUNT(*) AS count FROM uploaded_files WHERE path IN (?, ?)').get(first.body.url, second.body.url) as any).count).toBe(2);
  });

  it('rejects unsafe destinations and preserves an honest broken-image fallback state', async () => {
    const created = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({
      pageId, type: 'image', title: 'Broken image', extra: { imageUrl: 'https://invalid.example/image.png', alt: 'An unavailable image' }
    }).expect(201);
    await request(app).put(`/api/studio/blocks/${created.body.id}`).set('Authorization', `Bearer ${token}`).send({ extra: { linkUrl: 'javascript:alert(1)' } }).expect(400);
    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(publicProfile.body.blocks.find((block: any) => block.id === created.body.id).imageUrl).toBe('https://invalid.example/image.png');
  });
});
