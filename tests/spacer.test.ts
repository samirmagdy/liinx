import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { initDatabase } from '../server/db.js';

describe('spacer block boundaries and persistence', () => {
  beforeAll(() => initDatabase());

  it('persists bounded heights, preserves order, renders publicly, and deletes cleanly', async () => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const username = `spacer_${unique}`.slice(0, 30);
    const registration = await request(app).post('/api/auth/register').send({
      email: `spacer_${unique}@liinx.test`,
      password: 'SpacerPassword2026!',
      username
    }).expect(201);
    const authToken = registration.body.token as string;
    const profileId = registration.body.profileId as string;
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${authToken}`);
    const studio = await auth(request(app).get('/api/studio/profile')).expect(200);
    const home = studio.body.pages.find((page: any) => page.isHome);
    expect(home?.id).toBeTruthy();

    const before = await auth(request(app).post('/api/studio/blocks')).send({ pageId: home.id, type: 'link', title: 'Before', url: 'https://example.com/before' }).expect(201);
    const first = await auth(request(app).post('/api/studio/blocks')).send({ pageId: home.id, type: 'spacer', title: 'Small gap', extra: { height: 16 } }).expect(201);
    const second = await auth(request(app).post('/api/studio/blocks')).send({ pageId: home.id, type: 'spacer', title: 'Large gap', extra: { height: 240 } }).expect(201);
    const after = await auth(request(app).post('/api/studio/blocks')).send({ pageId: home.id, type: 'link', title: 'After', url: 'https://example.com/after' }).expect(201);

    for (const extra of [{ height: 15 }, { height: 241 }, { height: Number.NaN }, { height: '48' }]) {
      await auth(request(app).post('/api/studio/blocks')).send({ pageId: home.id, type: 'spacer', title: 'Invalid gap', extra }).expect(400);
    }

    const persisted = await auth(request(app).get('/api/studio/profile')).expect(200);
    const homeBlocks = persisted.body.blocks.filter((block: any) => block.pageId === home.id);
    const createdIds = new Set([before.body.id, first.body.id, second.body.id, after.body.id]);
    expect(homeBlocks.filter((block: any) => createdIds.has(block.id)).map((block: any) => block.id)).toEqual([before.body.id, first.body.id, second.body.id, after.body.id]);
    expect(homeBlocks.find((block: any) => block.id === first.body.id).height).toBe(16);
    expect(homeBlocks.find((block: any) => block.id === second.body.id).height).toBe(240);

    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(publicProfile.body.blocks.filter((block: any) => block.type === 'spacer').map((block: any) => block.height)).toEqual([16, 240]);
    expect(publicProfile.body.blocks.filter((block: any) => createdIds.has(block.id)).map((block: any) => block.id)).toEqual([before.body.id, first.body.id, second.body.id, after.body.id]);

    await auth(request(app).delete(`/api/studio/blocks/${first.body.id}`)).expect(200);
    const reloaded = await auth(request(app).get('/api/studio/profile')).expect(200);
    expect(reloaded.body.blocks.some((block: any) => block.id === first.body.id)).toBe(false);
    expect(reloaded.body.blocks.find((block: any) => block.id === second.body.id).height).toBe(240);
    expect(profileId).toBe(registration.body.profileId);
  });
});
