import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';

describe('published pages and public routing', () => {
  beforeAll(() => initDatabase());

  it('exposes only published pages through the public profile API', async () => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const slugSuffix = unique.replace('_', '-');
    const registration = await request(app).post('/api/auth/register').send({
      email: `public-pages-${unique}@liinx.test`,
      password: 'PublishedPagesPassword2026!',
      username: `publicpages${unique}`.slice(0, 30)
    }).expect(201);
    const token = registration.body.token as string;
    const username = registration.body.user.username as string;
    const published = await request(app).post('/api/studio/pages').set('Authorization', `Bearer ${token}`).send({ title: 'About', slug: `about-${slugSuffix}`, published: true }).expect(201);
    const unpublished = await request(app).post('/api/studio/pages').set('Authorization', `Bearer ${token}`).send({ title: 'Private', slug: `private-${slugSuffix}`, published: false }).expect(201);

    const home = await request(app).get(`/api/profiles/${encodeURIComponent(username)}?page=home`).expect(200);
    expect(home.body.page.isHome).toBe(true);
    expect(home.body.pages.every((page: any) => page.published)).toBe(true);
    expect(home.body.pages.map((page: any) => page.id)).toContain(published.body.page.id);
    expect(home.body.pages.map((page: any) => page.id)).not.toContain(unpublished.body.page.id);
    expect(home.body.page.published).toBe(true);

    await request(app).get(`/api/profiles/${encodeURIComponent(username)}?page=${encodeURIComponent(published.body.page.slug)}`).expect(200);
    await request(app).get(`/api/profiles/${encodeURIComponent(username)}?page=${encodeURIComponent(unpublished.body.page.slug)}`).expect(404);
    await request(app).get(`/api/profiles/${encodeURIComponent(username)}?page=does-not-exist-${unique}`).expect(404);
  });

  it('routes a verified custom-domain page only when its page is published', async () => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const slugSuffix = unique.replace('_', '-');
    const registration = await request(app).post('/api/auth/register').send({
      email: `custom-pages-${unique}@liinx.test`,
      password: 'PublishedPagesPassword2026!',
      username: `custompages${unique}`.slice(0, 30)
    }).expect(201);
    const token = registration.body.token as string;
    const username = registration.body.user.username as string;
    db.prepare('UPDATE profiles SET plan = ?, custom_domain = ?, custom_domain_verified = 1 WHERE username = ?').run('pro', `${username}.example.test`, username);
    const page = await request(app).post('/api/studio/pages').set('Authorization', `Bearer ${token}`).send({ title: 'Public', slug: `public-${slugSuffix}`, published: true }).expect(201);

    const publicPage = await request(app).get(`/api/profiles/by-domain/${username}.example.test?page=${page.body.page.slug}`).expect(307);
    expect(publicPage.headers.location).toContain(`page=${encodeURIComponent(page.body.page.slug)}`);
    await request(app).get(`/api/profiles/by-domain/${username}.example.test?page=missing-${unique}`).expect(307);
    await request(app).get(`/missing-${unique}`).set('Host', `${username}.example.test`).set('Accept', 'text/html').expect(404);
  });
});
