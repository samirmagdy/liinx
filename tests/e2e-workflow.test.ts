import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';
import { confirmNewsletter } from './helpers/newsletterEmail.js';

vi.mock('../server/services/email.js', async () => {
  const { captureTransactionalEmail } = await import('./helpers/newsletterEmail.js');
  return { sendTransactionalEmail: vi.fn(captureTransactionalEmail) };
});


describe('End-to-End Creator Journey & Full Lifecycle Test', () => {
  beforeAll(() => {
    initDatabase();
  });

  const uniqueId = Date.now();
  const username = `studio_${uniqueId}`;
  const email = `studio_${uniqueId}@liinx.design`;
  const password = 'CreatorPassword2026!';

  let authToken = '';
  let profileId = '';
  let linkBlockId = '';
  let newsletterBlockId = '';

  it('Step 1: Check handle availability from landing page', async () => {
    const res = await request(app).get(`/api/auth/check-username/${username}`);
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
    expect(res.body.username).toBe(username);
  });

  it('Step 2: Complete creator registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password, username });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.profileId).toBeDefined();
    expect(res.body.user.username).toBe(username);

    authToken = res.body.token;
    profileId = res.body.profileId;
  });

  it('Step 3: Verify authenticated session on entering Studio', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
    expect(res.body.profile.username).toBe(username);
  });

  it('Step 4: Update creator profile identity & social links in Studio', async () => {
    const res = await request(app)
      .put('/api/studio/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        displayName: 'Aesthetic Studio',
        bio: 'Architecture & Editorial Sound Design based in Tokyo.',
        category: 'Architecture',
        themeId: 'obsidian-noir',
        socials: [
          { platform: 'instagram', url: 'https://instagram.com/aesthetic_studio' },
          { platform: 'spotify', url: 'https://open.spotify.com/artist/1234' }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('Step 5: Add polymorphic content blocks (Link, Header, Audio, Newsletter)', async () => {
    // 1. Featured Link Block
    const linkRes = await request(app)
      .post('/api/studio/blocks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'link',
        title: '2026 Tokyo Monograph Book',
        url: 'https://monograph.example.com',
        subtitle: 'Limited hardcover exhibition book',
        badge: 'NEW',
        highlighted: true
      });
    expect(linkRes.status).toBe(201);
    linkBlockId = linkRes.body.id;

    // 2. Section Header Block
    const headerRes = await request(app)
      .post('/api/studio/blocks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'header',
        title: 'Selected Discography'
      });
    expect(headerRes.status).toBe(201);

    // 3. Audio Track Block
    const audioRes = await request(app)
      .post('/api/studio/blocks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'audio',
        title: 'Concrete Reflections EP',
        url: 'https://spotify.com/album/concrete',
        extra: {
          artist: 'Aesthetic Studio',
          coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
          audioUrl: 'https://spotify.com/album/concrete'
        }
      });
    expect(audioRes.status).toBe(201);

    // 4. Newsletter Block
    const newsRes = await request(app)
      .post('/api/studio/blocks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'newsletter',
        title: 'Monthly Architectural Dispatch',
        extra: {
          description: 'Curated photo essays and lighting breakdowns.',
          buttonText: 'Subscribe Free'
        }
      });
    expect(newsRes.status).toBe(201);
    newsletterBlockId = newsRes.body.id;
  });

  it('Step 6: Reorder blocks sequence', async () => {
    // Reorder so Link is first, Newsletter second
    const existingBlocks = db.prepare('SELECT id FROM blocks WHERE profile_id = ? ORDER BY position ASC').all(profileId) as { id: string }[];
    const orderedBlockIds = [linkBlockId, newsletterBlockId, ...existingBlocks.map(block => block.id).filter(id => id !== linkBlockId && id !== newsletterBlockId)];
    const res = await request(app)
      .put('/api/studio/blocks/reorder')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        blockIds: orderedBlockIds
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('Step 7: Public visitor loads creator page and views profile', async () => {
    // Public profile GET
    const res = await request(app).get(`/api/profiles/${username}`);
    expect(res.status).toBe(200);
    expect(res.body.displayName).toBe('Aesthetic Studio');
    expect(res.body.themeId).toBe('obsidian-noir');
    expect(res.body.socials).toHaveLength(2);
    expect(res.body.blocks.length).toBeGreaterThanOrEqual(4);

    // Verify Cache-Control header is present
    expect(res.header['cache-control']).toMatch(/public, max-age=15/i);

    // Record visitor view
    const viewRes = await request(app)
      .post('/api/analytics/view')
      .send({
        profileId,
        referrer: 'https://twitter.com'
      });
    expect(viewRes.status).toBe(200);
  });

  it('Step 8: Public visitor clicks featured link via 302 redirector', async () => {
    const res = await request(app)
      .get(`/r/${linkBlockId}`)
      .set('User-Agent', 'Mozilla/5.0 (iPhone)')
      .set('Referer', 'https://instagram.com');

    expect(res.status).toBe(302);
    expect(res.header.location).toBe('https://monograph.example.com');
  });

  it('Step 9: Public visitor subscribes to creator newsletter', async () => {
    const subscriberEmail = `fan_${uniqueId}@tokyo.jp`;
    const res = await request(app)
      .post('/api/newsletter/subscribe')
      .send({
        profileId,
        blockId: newsletterBlockId,
        email: subscriberEmail,
        consent: true
      });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/confirmation/i);
    await confirmNewsletter(app, subscriberEmail);
  });

  it('Step 10: Creator checks Studio analytics and views logged stats', async () => {
    const res = await request(app)
      .get('/api/analytics/stats')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalClicks).toBeGreaterThanOrEqual(1);
    expect(res.body.totalViews).toBeGreaterThanOrEqual(1);
    expect(res.body.topLinks).toBeDefined();
    expect(res.body.topLinks[0].id).toBe(linkBlockId);
  });

  it('Step 11: Creator views subscriber list in Studio', async () => {
    const res = await request(app)
      .get('/api/studio/subscribers')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.subscribers[0].email).toBe(`fan_${uniqueId}@tokyo.jp`);
  });

  it('Step 12: Creator upgrades to VIP Studio tier', async () => {
    const res = await request(app)
      .put('/api/studio/plan')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ plan: 'studio' });

    expect(res.status).toBe(200);
    expect(res.body.plan).toBe('studio');

    // Verify public profile now reflects studio plan
    const pubRes = await request(app).get(`/api/profiles/${username}`);
    expect(pubRes.body.plan).toBe('studio');
  });
});
