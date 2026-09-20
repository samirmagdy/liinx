import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomBytes } from 'node:crypto';
import { app } from '../server/server.js';

function unique(prefix: string): string {
  return `${prefix}_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

async function creator(prefix: string) {
  const username = unique(prefix).slice(0, 30);
  const response = await request(app).post('/api/auth/register').send({
    email: `${username}@raloa.test`,
    password: 'PageSettingsPassword2026!',
    username
  }).expect(201);
  return { token: response.body.token as string, username };
}

function auth(token: string, method: 'get' | 'post' | 'put' | 'delete', path: string) {
  return request(app)[method](path).set('Authorization', `Bearer ${token}`);
}

describe('page creation and settings', () => {
  it('creates, normalizes, saves, reloads, and publicly routes a page', async () => {
    const { token, username } = await creator('page');
    const slug = `portfolio-${Date.now()}`;
    const created = await auth(token, 'post', '/api/studio/pages').send({ title: '  Portfolio  ', slug: `  ${slug}  `, description: '  Selected work  ' }).expect(201);
    expect(created.body.page).toMatchObject({ title: 'Portfolio', slug, description: 'Selected work', published: true });

    await auth(token, 'put', `/api/studio/pages/${created.body.page.id}`).send({ title: 'Case Studies', slug: `case-studies-${Date.now()}`, description: 'Selected case studies', published: true, revision: created.body.page.revision }).expect(200);
    const reloaded = await auth(token, 'get', '/api/studio/profile').expect(200);
    const page = reloaded.body.pages.find((candidate: any) => candidate.id === created.body.page.id);
    expect(page).toMatchObject({ title: 'Case Studies', description: 'Selected case studies', published: true });
    await request(app).get(`/api/profiles/${username}?page=${page.slug}`).expect(200);
  });

  it('rejects reserved, duplicate, malformed, and overlong slugs', async () => {
    const { token } = await creator('slug');
    const created = await auth(token, 'post', '/api/studio/pages').send({ title: 'Portfolio', slug: `valid-${Date.now()}` }).expect(201);
    await auth(token, 'post', '/api/studio/pages').send({ title: 'Duplicate', slug: created.body.page.slug }).expect(409);
    for (const slug of ['home', 'api', ' Studio ', 'UPPERCASE', 'bad slug', 'a'.repeat(41)]) {
      await auth(token, 'post', '/api/studio/pages').send({ title: 'Invalid', slug }).expect(400);
    }
  });

  it('protects home-page rules and cross-account page ownership', async () => {
    const first = await creator('owner');
    const second = await creator('other');
    const studio = await auth(first.token, 'get', '/api/studio/profile').expect(200);
    const home = studio.body.pages.find((page: any) => page.isHome);
    await auth(first.token, 'delete', `/api/studio/pages/${home.id}`).expect(400);
    await auth(first.token, 'put', `/api/studio/pages/${home.id}`).send({ published: false, slug: 'not-home', revision: home.revision }).expect(400);
    await auth(second.token, 'put', `/api/studio/pages/${home.id}`).send({ title: 'Cross-account overwrite' }).expect(404);
  });

  it('moves deleted-page blocks to Home in deterministic append order', async () => {
    const { token } = await creator('delete');
    const studio = await auth(token, 'get', '/api/studio/profile').expect(200);
    const home = studio.body.pages.find((page: any) => page.isHome);
    const created = await auth(token, 'post', '/api/studio/pages').send({ title: 'Archive', slug: `archive-${Date.now()}` }).expect(201);
    const first = await auth(token, 'post', '/api/studio/blocks').send({ pageId: created.body.page.id, type: 'link', title: 'First', url: 'https://example.com/first' }).expect(201);
    const second = await auth(token, 'post', '/api/studio/blocks').send({ pageId: created.body.page.id, type: 'link', title: 'Second', url: 'https://example.com/second' }).expect(201);
    const deleted = await auth(token, 'delete', `/api/studio/pages/${created.body.page.id}`).expect(200);
    expect(deleted.body.message).toMatch(/moved to Home in their original order/i);

    const after = await auth(token, 'get', '/api/studio/profile').expect(200);
    const moved = after.body.blocks.filter((block: any) => [first.body.id, second.body.id].includes(block.id)).sort((a: any, b: any) => a.position - b.position);
    expect(moved.map((block: any) => block.title)).toEqual(['First', 'Second']);
    expect(moved.every((block: any) => block.pageId === home.id)).toBe(true);
    expect(after.body.pages.some((page: any) => page.id === created.body.page.id)).toBe(false);
  });

  it('does not expose unpublished draft blocks by deleting their page', async () => {
    const { token } = await creator('draft');
    const created = await auth(token, 'post', '/api/studio/pages').send({ title: 'Draft', slug: `draft-${Date.now()}`, published: false }).expect(201);
    const block = await auth(token, 'post', '/api/studio/blocks').send({ pageId: created.body.page.id, type: 'link', title: 'Private draft', url: 'https://example.com/private' }).expect(201);
    const deletion = await auth(token, 'delete', `/api/studio/pages/${created.body.page.id}`).expect(409);
    expect(deletion.body.error).toMatch(/draft content/i);
    const studio = await auth(token, 'get', '/api/studio/profile').expect(200);
    expect(studio.body.pages.some((page: any) => page.id === created.body.page.id)).toBe(true);
    expect(studio.body.blocks.find((candidate: any) => candidate.id === block.body.id).pageId).toBe(created.body.page.id);
  });
});
