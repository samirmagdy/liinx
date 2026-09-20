import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { initDatabase } from '../server/db.js';

describe('link animation contract', () => {
  let token = '';
  let pageId = '';

  beforeAll(async () => {
    initDatabase();
    const unique = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    const registration = await request(app).post('/api/auth/register').send({
      email: `link-animation-${unique}@raloa.test`, password: 'LinkAnimationPassword2026!', username: `animation${unique}`.slice(0, 30)
    }).expect(201);
    token = registration.body.token;
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    pageId = studio.body.pages.find((page: any) => page.isHome).id;
  });

  it('persists all supported animations and leaves none explicitly inert', async () => {
    const animations = ['none', 'fade', 'lift', 'pulse'];
    for (const animation of animations) {
      await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({
        pageId, type: 'link', title: `${animation} link`, url: `https://example.com/${animation}`, extra: { animation }
      }).expect(201);
    }
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    const links = studio.body.blocks.filter((block: any) => block.type === 'link');
    expect(links.map((block: any) => block.animation)).toEqual(expect.arrayContaining(animations));
  });

  it('rejects unsupported animation values', async () => {
    await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({
      pageId, type: 'link', title: 'Unsupported animation', url: 'https://example.com', extra: { animation: 'flash' }
    }).expect(400);
  });
});
