import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';

describe('protected text content gates', () => {
  const suffix = Date.now();
  let profileId = '';
  let token = '';
  let username = '';
  let gateId = '';
  let homeId = '';

  beforeAll(async () => {
    initDatabase();
    const registration = await request(app).post('/api/auth/register').send({
      email: `gate_${suffix}@liinx.test`, password: 'GatePassword2026!', username: `gate_${suffix}`.slice(0, 30)
    }).expect(201);
    profileId = registration.body.profileId;
    token = registration.body.token;
    username = registration.body.user.username;
    homeId = (db.prepare('SELECT id FROM pages WHERE profile_id = ? AND is_home = 1').get(profileId) as { id: string }).id;
  });

  it('hashes codes, keeps protected text out of creator responses and public payloads', async () => {
    const response = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({
      type: 'content_gate', title: 'Private notes', pageId: homeId,
      extra: { password: 'old-code', body: 'Secret text', description: 'Enter code' }
    }).expect(201);
    gateId = response.body.id;
    expect(response.body.password).toBeUndefined();
    expect(response.body.passwordHash).toBeUndefined();
    const stored = db.prepare('SELECT extra_json FROM blocks WHERE id = ?').get(gateId) as { extra_json: string };
    expect(stored.extra_json).not.toContain('old-code');
    expect(stored.extra_json).toMatch(/passwordHash/);

    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    const studioGate = studio.body.blocks.find((block: { id: string }) => block.id === gateId);
    expect(studioGate.body).toBe('Secret text');
    expect(studioGate.password).toBeUndefined();
    expect(studioGate.passwordHash).toBeUndefined();

    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    const publicGate = publicProfile.body.blocks.find((block: { id: string }) => block.id === gateId);
    expect(publicGate.body).toBeUndefined();
    expect(publicGate.password).toBeUndefined();
    expect(publicGate.passwordHash).toBeUndefined();
    expect(publicGate.locked).toBe(true);
  });

  it('verifies asynchronously, rejects empty/wrong codes, and supports code replacement/removal', async () => {
    await request(app).post('/api/content-gates/verify').send({ profileId, blockId: gateId, password: '' }).expect(400);
    await request(app).post('/api/content-gates/verify').send({ profileId, blockId: gateId, password: 'wrong-code' }).expect(403);
    const unlocked = await request(app).post('/api/content-gates/verify').send({ profileId, blockId: gateId, password: 'old-code' }).expect(200);
    expect(unlocked.body).toEqual({ unlocked: true, body: 'Secret text' });

    await request(app).put(`/api/studio/blocks/${gateId}`).set('Authorization', `Bearer ${token}`).send({ extra: { password: 'new-code' } }).expect(200);
    await request(app).post('/api/content-gates/verify').send({ profileId, blockId: gateId, password: 'old-code' }).expect(403);
    await request(app).post('/api/content-gates/verify').send({ profileId, blockId: gateId, password: 'new-code' }).expect(200);

    await request(app).put(`/api/studio/blocks/${gateId}`).set('Authorization', `Bearer ${token}`).send({ extra: { password: '' } }).expect(200);
    const unconfigured = await request(app).get(`/api/profiles/${username}`).expect(200);
    const publicGate = unconfigured.body.blocks.find((block: { id: string }) => block.id === gateId);
    expect(publicGate.body).toBeUndefined();
    expect(publicGate.locked).toBe(false);
    await request(app).post('/api/content-gates/verify').send({ profileId, blockId: gateId, password: 'new-code' }).expect(500);
  });

  it('does not verify gates on hidden or deleted blocks and handles malformed storage safely', async () => {
    const hiddenPage = await request(app).post('/api/studio/pages').set('Authorization', `Bearer ${token}`).send({
      title: 'Hidden', slug: `hidden-${suffix}`, published: false
    }).expect(201);
    const hiddenGate = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({
      type: 'content_gate', title: 'Hidden gate', pageId: hiddenPage.body.page.id,
      extra: { password: 'hidden-code', body: 'Hidden secret' }
    }).expect(201);
    await request(app).post('/api/content-gates/verify').send({ profileId, blockId: hiddenGate.body.id, password: 'hidden-code' }).expect(404);

    db.prepare('UPDATE blocks SET extra_json = ? WHERE id = ?').run('{not-json', gateId);
    await request(app).post('/api/content-gates/verify').send({ profileId, blockId: gateId, password: 'anything' }).expect(500);
    db.prepare('UPDATE blocks SET extra_json = ? WHERE id = ?').run(JSON.stringify({ body: 'Secret text' }), gateId);
    await request(app).post('/api/content-gates/verify').send({ profileId, blockId: gateId, password: 'anything' }).expect(500);

    await request(app).delete(`/api/studio/blocks/${gateId}`).set('Authorization', `Bearer ${token}`).expect(200);
    await request(app).post('/api/content-gates/verify').send({ profileId, blockId: gateId, password: 'anything' }).expect(404);
  });
});
