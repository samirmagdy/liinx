import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';

describe('FAQ block', () => {
  let token = '';
  let username = '';
  let pageId = '';

  beforeAll(async () => {
    const unique = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    username = `faq_${unique}`.slice(0, 30);
    const registration = await request(app).post('/api/auth/register').send({ email: `faq-${unique}@raloa.test`, password: 'FaqPassword2026!', username }).expect(201);
    token = registration.body.token;
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    pageId = studio.body.pages.find((page: any) => page.isHome).id;
  });

  it('round-trips ordered multilingual questions and multiline answers', async () => {
    const items = [
      { id: 'faq-ar', question: 'كيف أبدأ؟', answer: 'الخطوة الأولى\nالخطوة الثانية' },
      { id: 'faq-en', question: 'How do I start?', answer: 'Create a page\nAdd your content' },
      { id: 'faq-long', question: 'A question with a long answer', answer: 'Long content '.repeat(300) }
    ];
    const created = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'faq', title: 'Questions', extra: { items } }).expect(201);
    const reordered = [items[2], items[0], items[1]];
    await request(app).put(`/api/studio/blocks/${created.body.id}`).set('Authorization', `Bearer ${token}`).send({ extra: { items: reordered } }).expect(200);

    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    expect(studio.body.blocks.find((block: any) => block.id === created.body.id).items).toEqual(reordered);
    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(publicProfile.body.blocks.find((block: any) => block.id === created.body.id).items).toEqual(reordered);
  });

  it('supports an empty FAQ and rejects blank questions without changing saved content', async () => {
    const empty = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'faq', title: 'Empty questions', extra: { items: [] } }).expect(201);
    const invalid = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'faq', title: 'Invalid questions', extra: { items: [{ id: 'blank', question: '   ', answer: 'Not saved' }] } }).expect(400);
    expect(invalid.body.error).toMatch(/at least|characters/i);
    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(publicProfile.body.blocks.find((block: any) => block.id === empty.body.id).items).toEqual([]);
  });
});
