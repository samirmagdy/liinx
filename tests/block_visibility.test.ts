import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomBytes } from 'node:crypto';
import { app } from '../server/server.js';
import { parseBlockContract } from '../server/contracts.js';

function unique(prefix: string): string {
  return `${prefix}_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

async function creator(prefix: string) {
  const username = unique(prefix).slice(0, 30);
  const response = await request(app).post('/api/auth/register').send({ email: `${username}@raloa.test`, password: 'VisibilityPassword2026!', username }).expect(201);
  return { token: response.body.token as string, username };
}

function auth(token: string, method: 'get' | 'post' | 'put' | 'delete', path: string) {
  return request(app)[method](path).set('Authorization', `Bearer ${token}`);
}

async function homePage(token: string) {
  const studio = await auth(token, 'get', '/api/studio/profile').expect(200);
  return {
    profileId: studio.body.id as string,
    home: studio.body.pages.find((page: any) => page.isHome)
  };
}

async function makeBlock(token: string, pageId: string, title: string, body: Record<string, unknown> = {}) {
  return (await auth(token, 'post', '/api/studio/blocks')
    .send({ pageId, type: 'link', title, url: 'https://example.com/target', ...body })
    .expect(201)).body as { id: string; revision: number; visible?: boolean };
}

async function studioBlock(token: string, blockId: string) {
  const studio = await auth(token, 'get', '/api/studio/profile').expect(200);
  return studio.body.blocks.find((block: any) => block.id === blockId);
}

async function publicBlockIds(username: string, pageSlug?: string) {
  const response = await request(app).get(`/api/profiles/${username}${pageSlug ? `?page=${pageSlug}` : ''}`).expect(200);
  return response.body.blocks.map((block: any) => block.id) as string[];
}

describe('block visibility', () => {
  it('accepts visible on create and update, and reports it back to the editor', async () => {
    const { token } = await creator('vis');
    const { home } = await homePage(token);

    const created = await makeBlock(token, home.id, 'Always shown');
    expect(created.visible).toBe(true);
    const hiddenAtCreate = await makeBlock(token, home.id, 'Created hidden', { visible: false });
    expect(hiddenAtCreate.visible).toBe(false);

    const hide = await auth(token, 'put', `/api/studio/blocks/${created.id}`)
      .send({ visible: false, revision: created.revision }).expect(200);
    expect((await studioBlock(token, created.id)).visible).toBe(false);

    await auth(token, 'put', `/api/studio/blocks/${created.id}`)
      .send({ visible: true, revision: hide.body.revision }).expect(200);
    expect((await studioBlock(token, created.id)).visible).toBe(true);
    expect((await studioBlock(token, hiddenAtCreate.id)).visible).toBe(false);
  });

  it('keeps hidden blocks out of the public page payload and restores them when shown again', async () => {
    const { token, username } = await creator('vispub');
    const { home } = await homePage(token);
    const shown = await makeBlock(token, home.id, 'Shown');
    const hidden = await makeBlock(token, home.id, 'Hidden');

    await auth(token, 'put', `/api/studio/blocks/${hidden.id}`).send({ visible: false, revision: hidden.revision }).expect(200);

    const hiddenIds = await publicBlockIds(username);
    expect(hiddenIds).toContain(shown.id);
    expect(hiddenIds).not.toContain(hidden.id);

    const current = await studioBlock(token, hidden.id);
    await auth(token, 'put', `/api/studio/blocks/${hidden.id}`).send({ visible: true, revision: current.revision }).expect(200);
    expect(await publicBlockIds(username)).toContain(hidden.id);
  });

  it('preserves visibility across page moves and duplication', async () => {
    const { token, username } = await creator('vismove');
    const { home } = await homePage(token);
    const slug = `archive-${Date.now()}`;
    const other = (await auth(token, 'post', '/api/studio/pages').send({ title: 'Archive', slug }).expect(201)).body.page;
    const hidden = await makeBlock(token, home.id, 'Hidden work in progress', { visible: false });

    await auth(token, 'put', `/api/studio/blocks/${hidden.id}/move`).send({ pageId: other.id }).expect(200);
    const moved = await studioBlock(token, hidden.id);
    expect(moved.pageId).toBe(other.id);
    expect(moved.visible).toBe(false);
    expect(await publicBlockIds(username, slug)).toEqual([]);

    const duplicate = (await auth(token, 'post', `/api/studio/blocks/${hidden.id}/duplicate`).send({ pageId: other.id }).expect(201)).body.block;
    expect(duplicate.visible).toBe(false);
    expect(await publicBlockIds(username, slug)).not.toContain(duplicate.id);
  });

  it('refuses public access to hidden links, gates, and forms while leaving shown blocks usable', async () => {
    const { token, username } = await creator('visreach');
    const { profileId, home } = await homePage(token);
    const link = await makeBlock(token, home.id, 'Trackable link');
    const gate = (await auth(token, 'post', '/api/studio/blocks').send({
      pageId: home.id, type: 'content_gate', title: 'Members only', extra: { password: 'gate-access-code', body: 'Release notes.' }
    }).expect(201)).body as { id: string; revision: number };
    const form = (await auth(token, 'post', '/api/studio/blocks').send({
      pageId: home.id, type: 'form', title: 'Contact', extra: { fields: [{ name: 'name', label: 'Name', type: 'text', required: true }] }
    }).expect(201)).body as { id: string; revision: number };

    for (const [id, revision] of [[link.id, link.revision], [gate.id, gate.revision], [form.id, form.revision]] as const) {
      await auth(token, 'put', `/api/studio/blocks/${id}`).send({ visible: false, revision }).expect(200);
    }

    await request(app).get(`/r/${link.id}`).expect(404);
    await request(app).post('/api/content-gates/verify').send({ profileId, blockId: gate.id, password: 'gate-access-code' }).expect(404);
    await request(app).post('/api/forms/submit').send({ profileId, blockId: form.id, fields: { name: 'Ada' } }).expect(404);

    const current = await studioBlock(token, link.id);
    await auth(token, 'put', `/api/studio/blocks/${link.id}`).send({ visible: true, revision: current.revision }).expect(200);
    const restored = await request(app).get(`/r/${link.id}`).expect(302);
    expect(restored.headers.location).toBe('https://example.com/target');
    expect(username).toBeTruthy();
  });

  it('keeps the update envelope strict about keys the editor is allowed to send', () => {
    expect(parseBlockContract({ visible: false }, 'link').success).toBe(true);
    expect(parseBlockContract({ visible: 'no' }, 'link').success).toBe(false);
    expect(parseBlockContract({ clicks: 10 }, 'link').success).toBe(false);
    expect(parseBlockContract({ pageId: 'other' }, 'link').success).toBe(false);
    expect(parseBlockContract({ type: 'link' }, 'link').success).toBe(false);
    expect(parseBlockContract({ title: 'Renamed' }, 'link').success).toBe(true);
  });

  it('rejects a visibility flag smuggled through block extra data', async () => {
    const { token } = await creator('vissmuggle');
    const { home } = await homePage(token);
    const rejected = await auth(token, 'post', '/api/studio/blocks').send({
      pageId: home.id, type: 'rich_text', title: 'Notes', extra: { body: 'Hello', visible: false }
    }).expect(400);
    expect(rejected.body.error).toMatch(/reserved/i);
  });
});
