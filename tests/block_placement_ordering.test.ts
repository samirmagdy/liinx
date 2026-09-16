import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomBytes } from 'node:crypto';
import { app } from '../server/server.js';

function unique(prefix: string): string {
  return `${prefix}_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

async function creator(prefix: string) {
  const username = unique(prefix).slice(0, 30);
  const response = await request(app).post('/api/auth/register').send({ email: `${username}@liinx.test`, password: 'BlockPlacementPassword2026!', username }).expect(201);
  return { token: response.body.token as string, username };
}

function auth(token: string, method: 'get' | 'post' | 'put' | 'delete', path: string) {
  return request(app)[method](path).set('Authorization', `Bearer ${token}`);
}

describe('page-aware block placement and ordering', () => {
  it('keeps three page collections isolated while reordering, moving, duplicating, and reloading', async () => {
    const { token } = await creator('blocks');
    const initial = await auth(token, 'get', '/api/studio/profile').expect(200);
    const home = initial.body.pages.find((page: any) => page.isHome);
    const pageTwo = (await auth(token, 'post', '/api/studio/pages').send({ title: 'Two', slug: `two-${Date.now()}` }).expect(201)).body.page;
    const pageThree = (await auth(token, 'post', '/api/studio/pages').send({ title: 'Three', slug: `three-${Date.now()}` }).expect(201)).body.page;
    const makeBlock = (pageId: string, title: string) => auth(token, 'post', '/api/studio/blocks').send({ pageId, type: 'link', title, url: `https://example.com/${title.toLowerCase()}` }).expect(201);
    const homeBlock = await makeBlock(home.id, 'Home block');
    const first = await makeBlock(pageTwo.id, 'First');
    const second = await makeBlock(pageTwo.id, 'Second');
    const otherPageBlock = await makeBlock(pageThree.id, 'Other page');

    await auth(token, 'put', '/api/studio/blocks/reorder').send({ pageId: pageTwo.id, blockIds: [second.body.id, first.body.id] }).expect(200);
    await auth(token, 'put', `/api/studio/blocks/${first.body.id}/move`).send({ pageId: pageThree.id }).expect(200);
    const duplicate = await auth(token, 'post', `/api/studio/blocks/${second.body.id}/duplicate`).send({ pageId: pageThree.id }).expect(201);
    expect(duplicate.body.block.id).not.toBe(second.body.id);
    expect(duplicate.body.block.pageId).toBe(pageThree.id);

    await auth(token, 'put', '/api/studio/blocks/reorder').send({ pageId: pageThree.id, blockIds: [otherPageBlock.body.id, first.body.id, duplicate.body.block.id] }).expect(200);
    const reloaded = await auth(token, 'get', '/api/studio/profile').expect(200);
    const byPage = (pageId: string) => reloaded.body.blocks.filter((block: any) => block.pageId === pageId);
    expect(byPage(home.id).map((block: any) => block.id)).toContain(homeBlock.body.id);
    expect(byPage(pageTwo.id).map((block: any) => block.id)).toEqual([second.body.id]);
    expect(byPage(pageThree.id).map((block: any) => block.id)).toEqual([otherPageBlock.body.id, first.body.id, duplicate.body.block.id]);
  });

  it('rejects incomplete, duplicate, and foreign-page reorder requests', async () => {
    const { token } = await creator('reorder');
    const foreignAccount = await creator('foreign');
    const home = (await auth(token, 'get', '/api/studio/profile').expect(200)).body.pages.find((page: any) => page.isHome);
    const page = (await auth(token, 'post', '/api/studio/pages').send({ title: 'Target', slug: `target-${Date.now()}` }).expect(201)).body.page;
    const other = (await auth(token, 'post', '/api/studio/pages').send({ title: 'Other', slug: `other-${Date.now()}` }).expect(201)).body.page;
    const first = await auth(token, 'post', '/api/studio/blocks').send({ pageId: page.id, type: 'link', title: 'First', url: 'https://example.com/first' }).expect(201);
    const second = await auth(token, 'post', '/api/studio/blocks').send({ pageId: page.id, type: 'link', title: 'Second', url: 'https://example.com/second' }).expect(201);
    const foreign = await auth(token, 'post', '/api/studio/blocks').send({ pageId: other.id, type: 'link', title: 'Foreign page', url: 'https://example.com/foreign' }).expect(201);
    const foreignAccountPage = (await auth(foreignAccount.token, 'post', '/api/studio/pages').send({ title: 'Foreign owner page', slug: `foreign-${Date.now()}` }).expect(201)).body.page;
    const foreignAccountBlock = await auth(foreignAccount.token, 'post', '/api/studio/blocks').send({ pageId: foreignAccountPage.id, type: 'link', title: 'Foreign owner block', url: 'https://example.com/foreign-owner' }).expect(201);
    await auth(token, 'put', '/api/studio/blocks/reorder').send({ pageId: page.id, blockIds: [first.body.id] }).expect(400);
    await auth(token, 'put', '/api/studio/blocks/reorder').send({ pageId: page.id, blockIds: [first.body.id, first.body.id] }).expect(400);
    await auth(token, 'put', '/api/studio/blocks/reorder').send({ pageId: page.id, blockIds: [first.body.id, foreign.body.id] }).expect(400);
    await auth(token, 'put', '/api/studio/blocks/reorder').send({ pageId: page.id, blockIds: [first.body.id, second.body.id, foreignAccountBlock.body.id] }).expect(400);
    await auth(token, 'put', '/api/studio/blocks/reorder').send({ pageId: 'foreign-page', blockIds: [first.body.id, second.body.id] }).expect(400);
    await auth(token, 'put', '/api/studio/blocks/reorder').send({ blockIds: [first.body.id, foreign.body.id] }).expect(400);
    expect(home.id).toBeTruthy();
  });

  it('assigns imported and REST-created blocks to Home and never resurrects a deleted block', async () => {
    const { token } = await creator('sources');
    const studio = await auth(token, 'get', '/api/studio/profile').expect(200);
    const home = studio.body.pages.find((page: any) => page.isHome);
    await auth(token, 'post', '/api/studio/import/commit').send({ links: [{ title: 'Imported', url: 'https://example.com/imported' }] }).expect(200);
    await auth(token, 'put', '/api/studio/plan').send({ plan: 'studio' }).expect(200);
    const key = await auth(token, 'post', '/api/studio/api-keys').send({ name: 'placement-test' }).expect(201);
    const restBlock = await request(app).post('/api/v1/blocks').set('Authorization', `Bearer ${key.body.apiKey}`).send({ title: 'REST block', url: 'https://example.com/rest' }).expect(201);
    expect(restBlock.body.block.pageId).toBe(home.id);
    const imported = (await auth(token, 'get', '/api/studio/profile').expect(200)).body.blocks.find((block: any) => block.title === 'Imported');
    expect(imported.pageId).toBe(home.id);

    const page = (await auth(token, 'post', '/api/studio/pages').send({ title: 'Delete me', slug: `delete-${Date.now()}` }).expect(201)).body.page;
    const block = await auth(token, 'post', '/api/studio/blocks').send({ pageId: page.id, type: 'link', title: 'Race block', url: 'https://example.com/race' }).expect(201);
    const update = auth(token, 'put', `/api/studio/blocks/${block.body.id}`).send({ title: 'Late update', revision: block.body.revision });
    const deletion = auth(token, 'delete', `/api/studio/blocks/${block.body.id}`);
    const results = await Promise.all([update, deletion]);
    expect(results.every(result => result.status === 200 || result.status === 404)).toBe(true);
    expect(results.some(result => result.status === 200)).toBe(true);
    const after = await auth(token, 'get', '/api/studio/profile').expect(200);
    expect(after.body.blocks.some((candidate: any) => candidate.id === block.body.id)).toBe(false);
  });
});
