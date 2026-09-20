import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { initDatabase } from '../server/db.js';

describe('safe rich text block journey', () => {
  let token = '';
  let username = '';
  let pageId = '';

  beforeAll(async () => {
    initDatabase();
    const unique = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    username = `rich_${unique}`.slice(0, 30);
    const registration = await request(app).post('/api/auth/register').send({
      email: `rich-text-${unique}@raloa.test`, password: 'RichTextPassword2026!', username
    }).expect(201);
    token = registration.body.token;
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    pageId = studio.body.pages.find((page: any) => page.isHome).id;
  });

  it('round-trips the documented markdown-like format and literal markup', async () => {
    const body = '# مرحباً\n\n**Bold** and *italic*\n- عنصر أول\n- عنصر ثانٍ\n1. First\n2. Second\n[Safe link](https://example.com/path?q=1)\n[Unsafe link](javascript:alert(1))\n<script>alert(1)</script>';
    const created = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'rich_text', title: 'Accessible story', extra: { body } }).expect(201);
    const reloaded = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    expect(reloaded.body.blocks.find((block: any) => block.id === created.body.id).body).toBe(body);
    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(publicProfile.body.blocks.find((block: any) => block.id === created.body.id).body).toBe(body);
  });

  it('rejects oversized rich text without changing the saved record', async () => {
    const created = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'rich_text', title: 'Short story', extra: { body: 'Keep this' } }).expect(201);
    await request(app).put(`/api/studio/blocks/${created.body.id}`).set('Authorization', `Bearer ${token}`).send({ extra: { body: 'x'.repeat(20001) } }).expect(400);
    const reloaded = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    expect(reloaded.body.blocks.find((block: any) => block.id === created.body.id).body).toBe('Keep this');
  });
});
