import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomBytes } from 'node:crypto';
import { app } from '../server/server.js';
import { SETUP_STEPS, SEED_BIO, SEED_BLOCK_TITLE, SEED_BLOCK_URL, findSiteTemplate } from '../shared/index.js';

function handle(prefix: string) {
  return `${prefix}_${Date.now()}_${randomBytes(3).toString('hex')}`.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
}

async function creator(prefix: string, body: Record<string, unknown> = {}) {
  const username = handle(prefix);
  const response = await request(app).post('/api/auth/register')
    .send({ email: `${username}@raloa.test`, password: 'SetupProgressPassword2026!', username, ...body })
    .expect(201);
  return { username, token: response.body.token as string };
}

async function setup(token: string) {
  const profile = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
  return profile.body as any;
}

const allFalse = Object.fromEntries(SETUP_STEPS.map(step => [step, false]));

describe('setup progress derived from stored rows', () => {
  it('starts a fresh account with only the page it genuinely has', async () => {
    const { token } = await creator('setupfresh');
    const { setup: progress, socials, blocks } = await setup(token);

    expect(progress.steps).toEqual({ ...allFalse, published: true });
    expect(progress.total).toBe(SETUP_STEPS.length);
    expect(progress.done).toBe(1);
    expect(progress.complete).toBe(false);
    expect(progress.dismissedAt).toBeNull();
    // The seeded rows are what they are: a contact address written at signup and one placeholder link.
    expect(blocks.map((block: any) => block.title)).toEqual([SEED_BLOCK_TITLE]);
    expect(socials.length).toBeGreaterThan(0);
  });

  it('ticks each step only when the write behind it exists', async () => {
    const { token } = await creator('setupticks');
    const seen: Record<string, unknown>[] = [];

    const put = async (patch: Record<string, unknown>) => {
      await request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send(patch).expect(200);
      const { setup: progress } = await setup(token);
      seen.push(progress.steps);
      return progress.steps as Record<string, boolean>;
    };

    const photo = await put({ avatarUrl: 'https://raloa.app/uploads/mine.png' });
    expect(photo.photo).toBe(true);
    expect([photo.block, photo.bio, photo.social, photo.preview]).toEqual([false, false, false, false]);

    const bio = await put({ bio: 'I design type systems and teach them on Tuesdays.' });
    expect(bio.bio).toBe(true);
    expect(bio.photo).toBe(true);

    const social = await put({ socials: [{ platform: 'instagram', url: 'https://instagram.com/typesystems' }] });
    expect(social.social).toBe(true);

    await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`)
      .send({ type: 'link', title: 'Read the newsletter', url: 'https://raloa.app/newsletter' }).expect(201);
    const afterBlock = await setup(token);
    expect(afterBlock.setup.steps.block).toBe(true);
    expect(afterBlock.setup.steps.preview).toBe(false);

    const preview = await request(app).post('/api/studio/previewed').set('Authorization', `Bearer ${token}`).expect(200);
    expect(preview.body.profile.setup.steps.preview).toBe(true);
    expect(preview.body.profile.setup.complete).toBe(true);
    expect(preview.body.profile.setup.done).toBe(SETUP_STEPS.length);

    // Every earlier write stays ticked: the derivation never moves backwards on its own.
    expect(seen.length).toBe(3);
  });

  it('refuses to tick the bio step for copy the product wrote', async () => {
    const template = findSiteTemplate('tmpl-editorial')!;
    const { token } = await creator('setupstarter', { templateId: 'tmpl-editorial' });
    const { setup: progress, bio } = await setup(token);

    expect(bio).toBe(template.profile?.bio);
    expect(progress.steps.bio, 'a placeholder line is not the creator writing their bio').toBe(false);
    expect(progress.steps.block, 'the chosen composition is real content on the page').toBe(true);
    expect(progress.steps.photo).toBe(false);
  });

  it('leaves the seed bio placeholder out of the count too', async () => {
    const { token } = await creator('setupseedbio');
    await request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`)
      .send({ bio: SEED_BIO }).expect(200);
    expect((await setup(token)).setup.steps.bio).toBe(false);
  });

  it('does not count a block nobody can see', async () => {
    const { token, username } = await creator('setuphidden');
    const created = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`)
      .send({ type: 'link', title: 'Draft offer', url: `https://${username}.raloa.test` }).expect(201);
    expect((await setup(token)).setup.steps.block).toBe(true);

    await request(app).put(`/api/studio/blocks/${created.body.id}`).set('Authorization', `Bearer ${token}`)
      .send({ visible: false }).expect(200);
    const hidden = await setup(token);
    expect(hidden.setup.steps.block, 'the seeded placeholder is the only visible block left').toBe(false);
  });

  it('remembers a dismissal on the account and keeps it off the public page', async () => {
    const { token, username } = await creator('setupdismiss');
    const dismissed = await request(app).post('/api/studio/setup/dismiss').set('Authorization', `Bearer ${token}`).expect(200);
    expect(typeof dismissed.body.profile.setup.dismissedAt).toBe('number');

    const again = await setup(token);
    expect(again.setup.dismissedAt).toBe(dismissed.body.profile.setup.dismissedAt);
    expect(again.setup.dismissedAt).not.toBeNull();

    const visitor = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(visitor.body.setup, 'setup progress is the creator private view of their own account').toBeUndefined();

    await request(app).post('/api/studio/previewed').expect(401);
    await request(app).post('/api/studio/setup/dismiss').expect(401);
  });

  it('does not bump the save revision with bookkeeping writes', async () => {
    const { token } = await creator('setuprevision');
    const before = await setup(token);
    await request(app).post('/api/studio/previewed').set('Authorization', `Bearer ${token}`).expect(200);
    const after = await setup(token);
    expect(after.revision).toBe(before.revision);
    expect(after.setup.steps.preview).toBe(true);

    // An edit that was already in flight still saves instead of hitting a revision conflict.
    await request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`)
      .send({ bio: 'Still the same revision.', revision: before.revision }).expect(200);
  });

  it('sends no stranger photograph for a starter site account to be credited with', async () => {
    const { token } = await creator('setupavatar', { templateId: 'tmpl-dark-sound' });
    const profile = await setup(token);
    expect(profile.avatarUrl).toBe('');
    expect(JSON.stringify(profile)).not.toContain('unsplash');
    expect(SEED_BLOCK_URL).toContain('raloa.app');
  });

  it('stores the discipline so suggestions come from the account rather than the device', async () => {
    expect((await setup((await creator('setupintent', { intent: 'photographer' })).token)).signupIntent).toBe('photographer');
    // A starter site was written for one discipline, and that is what the account is doing.
    expect((await setup((await creator('setupintentsite', { templateId: 'tmpl-dark-sound' })).token)).signupIntent).toBe('musician');
    const anonymous = await setup((await creator('setupintentnone')).token);
    expect(anonymous.signupIntent).toBeNull();

    const { username, token } = await creator('setupintentpublic', { intent: 'coach' });
    expect((await setup(token)).signupIntent).toBe('coach');
    const visitor = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(visitor.body.signupIntent, 'the discipline is not a public fact').toBeUndefined();
    expect(visitor.body.setup, 'setup progress is the creator private view').toBeUndefined();
  });
});
