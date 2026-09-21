import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomBytes } from 'node:crypto';
import { app } from '../server/server.js';
import { db } from '../server/db.js';

function handle(prefix: string) {
  return `${prefix}_${Date.now()}_${randomBytes(3).toString('hex')}`.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
}

async function creator(prefix: string) {
  const username = handle(prefix);
  const response = await request(app).post('/api/auth/register')
    .send({ email: `${username}@raloa.test`, password: 'MilestonePassword2026!', username }).expect(201);
  const profileId = response.body.profileId as string;
  return { username, token: response.body.token as string, profileId };
}

async function setup(token: string) {
  return ((await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200)).body as any).setup;
}

function view(profileId: string) {
  const id = `vw_${randomBytes(6).toString('hex')}`;
  db.prepare('INSERT INTO profile_views (id, profile_id, created_at) VALUES (?, ?, ?)').run(id, profileId, Date.now());
  return id;
}

function click(profileId: string) {
  const id = `ck_${randomBytes(6).toString('hex')}`;
  db.prepare('INSERT INTO link_clicks (id, block_id, profile_id, target_url, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, 'blk_none', profileId, 'https://raloa.app', Date.now());
  return id;
}

function subscriber(profileId: string) {
  const id = `ns_${randomBytes(6).toString('hex')}`;
  db.prepare('INSERT INTO newsletter_subscribers (id, profile_id, email, created_at) VALUES (?, ?, ?, ?)')
    .run(id, profileId, `${randomBytes(3).toString('hex')}@example.test`, Date.now());
  return id;
}

const ids = (milestones: { id: string }[]) => milestones.map(milestone => milestone.id);

describe('setup milestones from real analytics', () => {
  it('reports nothing at all for a page nobody has reached', async () => {
    const { token } = await creator('mileempty');
    expect(await setup(token)).toMatchObject({ milestones: [] });
  });

  it('names the first of each kind, from the row that happened', async () => {
    const { token, profileId } = await creator('milekinds');
    const firstView = view(profileId);
    view(profileId);
    const firstClick = click(profileId);
    const firstSubscriber = subscriber(profileId);

    const progress = await setup(token);
    expect(ids(progress.milestones).sort()).toEqual(['first_click', 'first_subscriber', 'first_view']);
    expect(progress.milestones.find((item: any) => item.id === 'first_view').eventId).toBe(firstView);
    expect(progress.milestones.find((item: any) => item.id === 'first_click').eventId).toBe(firstClick);
    expect(progress.milestones.find((item: any) => item.id === 'first_subscriber').eventId).toBe(firstSubscriber);
  });

  it('acknowledges once and never resurfaces it for a later visitor', async () => {
    const { token, profileId } = await creator('mileack');
    view(profileId);
    const acknowledged = await request(app).post('/api/studio/setup/milestone/first_view/ack')
      .set('Authorization', `Bearer ${token}`).expect(200);
    expect(acknowledged.body.profile.setup.milestones).toEqual([]);

    view(profileId);
    expect((await setup(token)).milestones).toEqual([]);
    const stored = db.prepare('SELECT event_id FROM setup_milestone_ack WHERE profile_id = ? AND milestone = ?')
      .get(profileId, 'first_view') as { event_id: string };
    expect(stored.event_id).toMatch(/^vw_/);
  });

  it('refuses to acknowledge something that has not happened, and unknown milestones', async () => {
    const { token } = await creator('milerefuse');
    await request(app).post('/api/studio/setup/milestone/first_click/ack').set('Authorization', `Bearer ${token}`).expect(400);
    await request(app).post('/api/studio/setup/milestone/first_million/ack').set('Authorization', `Bearer ${token}`).expect(400);
    await request(app).post('/api/studio/setup/milestone/first_view/ack').expect(401);
  });

  it('keeps the acknowledgement off the public page', async () => {
    const { username, profileId } = await creator('milepublic');
    view(profileId);
    const visitor = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(visitor.body.setup).toBeUndefined();
  });
});
