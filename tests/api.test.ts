import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';
import { confirmNewsletter } from './helpers/newsletterEmail.js';

vi.mock('../server/services/email.js', async () => {
  const { captureTransactionalEmail } = await import('./helpers/newsletterEmail.js');
  return { sendTransactionalEmail: vi.fn(captureTransactionalEmail) };
});


describe('backend API', () => {
  beforeAll(() => {
    initDatabase();
  });

  const testEmail = `test_${Date.now()}@liinx.test`;
  const testUsername = `user_${Date.now()}`;
  let authToken = '';
  let createdBlockId = '';

  it('GET /api/health should return ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('liinx-api');
  });

  it('GET /api/profiles/elenarostova should return seeded creator profile', async () => {
    const res = await request(app).get('/api/profiles/elenarostova');
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('elenarostova');
    expect(res.body.displayName).toBe('Elena Rostova');
    expect(Array.isArray(res.body.blocks)).toBe(true);
    expect(res.body.blocks.length).toBeGreaterThan(0);
  });

  it('GET /api/auth/check-username/:username should verify availability', async () => {
    const takenRes = await request(app).get('/api/auth/check-username/elenarostova');
    expect(takenRes.body.available).toBe(false);

    const availableRes = await request(app).get(`/api/auth/check-username/${testUsername}`);
    expect(availableRes.body.available).toBe(true);
  });

  it('POST /api/auth/register should create a real user and profile', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: 'Password123!',
        username: testUsername
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.username).toBe(testUsername);
    authToken = res.body.token;
  });

  it('POST /api/auth/register with duplicate username should fail with 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `another_${Date.now()}@liinx.test`,
        password: 'Password123!',
        username: testUsername
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already taken/i);
  });

  it('POST /api/auth/login should authenticate valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe(testUsername);
  });

  it('POST /api/auth/login with wrong password should fail with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword999!'
      });

    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me should return authenticated session and profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.profile.username).toBe(testUsername);
  });

  it('POST /api/studio/blocks should create a new block in the database', async () => {
    const res = await request(app)
      .post('/api/studio/blocks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'link',
        title: 'My GitHub Repository',
        url: 'https://github.com/example/repo',
        subtitle: 'Check out the open source code',
        badge: 'NEW',
        highlighted: true
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe('My GitHub Repository');
    createdBlockId = res.body.id;
  });

  it('POST /api/studio/blocks rejects reserved ownership fields', async () => {
    const before = db.prepare('SELECT COUNT(*) as count FROM blocks').get() as { count: number };
    const res = await request(app)
      .post('/api/studio/blocks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ type: 'link', title: 'Impersonation attempt', profileId: 'another-profile', extra: { page_id: 'another-page' } });

    expect(res.status).toBe(400);
    const after = db.prepare('SELECT COUNT(*) as count FROM blocks').get() as { count: number };
    expect(after.count).toBe(before.count);
  });

  it('PUT /api/studio/blocks/:id should update block in database', async () => {
    const res = await request(app)
      .put(`/api/studio/blocks/${createdBlockId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'My Updated GitHub Repo',
        subtitle: 'Updated subtitle'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = db.prepare('SELECT title FROM blocks WHERE id = ?').get(createdBlockId) as any;
    expect(check.title).toBe('My Updated GitHub Repo');
  });

  it('GET /r/:blockId should 302 redirect and increment click count', async () => {
    const res = await request(app).get(`/r/${createdBlockId}`);
    expect(res.status).toBe(302);
    expect(res.header.location).toBe('https://github.com/example/repo');

    // Verify click is logged in database
    const clicks = db.prepare('SELECT COUNT(*) as count FROM link_clicks WHERE block_id = ?').get(createdBlockId) as any;
    expect(clicks.count).toBeGreaterThan(0);
  });

  it('POST /api/analytics/view should record profile view', async () => {
    const profile = db.prepare('SELECT id FROM profiles WHERE username = ?').get(testUsername) as any;
    const res = await request(app)
      .post('/api/analytics/view')
      .send({
        profileId: profile.id,
        referrer: 'https://twitter.com'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const views = db.prepare('SELECT COUNT(*) as count FROM profile_views WHERE profile_id = ?').get(profile.id) as any;
    expect(views.count).toBeGreaterThan(0);
  });

  it('GET /api/analytics/stats should return real computed analytics', async () => {
    const res = await request(app)
      .get('/api/analytics/stats')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.totalViews).toBe('number');
    expect(typeof res.body.totalClicks).toBe('number');
    expect(res.body.totalClicks).toBeGreaterThan(0);
    expect(Array.isArray(res.body.dailyTimeline)).toBe(true);
  });

  it('POST /api/newsletter/subscribe should register email subscriber', async () => {
    const profile = db.prepare('SELECT id FROM profiles WHERE username = ?').get(testUsername) as any;
    const subscriberEmail = `fan_${Date.now()}@gmail.com`;

    const res = await request(app)
      .post('/api/newsletter/subscribe')
      .send({
        profileId: profile.id,
        email: subscriberEmail,
        consent: true
      });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    await confirmNewsletter(app, subscriberEmail);

    // Verify subscriber is in database
    const sub = db.prepare('SELECT * FROM newsletter_subscribers WHERE email = ?').get(subscriberEmail) as any;
    expect(sub).toBeDefined();
    expect(sub.profile_id).toBe(profile.id);
  });

  it('DELETE /api/studio/blocks/:id should delete block from database', async () => {
    const res = await request(app)
      .delete(`/api/studio/blocks/${createdBlockId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = db.prepare('SELECT * FROM blocks WHERE id = ?').get(createdBlockId);
    expect(check).toBeUndefined();
  });

  it('PUT /api/studio/plan should update subscription tier', async () => {
    const res = await request(app)
      .put('/api/studio/plan')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ plan: 'pro' });

    expect(res.status).toBe(200);
    expect(res.body.plan).toBe('pro');

    const profileCheck = db.prepare('SELECT plan FROM profiles WHERE username = ?').get(testUsername) as any;
    expect(profileCheck.plan).toBe('pro');
  });

  it('PUT /api/studio/profile should perform non-destructive partial updates', async () => {
    const res = await request(app)
      .put('/api/studio/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ displayName: 'Renamed Creator' });

    expect(res.status).toBe(200);
    const updated = db.prepare('SELECT display_name, category FROM profiles WHERE username = ?').get(testUsername) as any;
    expect(updated.display_name).toBe('Renamed Creator');
    expect(updated.category).toBe('Creator'); // Preserved
  });

  it('PUT /api/studio/profile should accept same-origin uploaded avatar paths', async () => {
    const res = await request(app)
      .put('/api/studio/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ avatarUrl: '/uploads/upload_test-avatar.png' });

    expect(res.status).toBe(200);
    const updated = db.prepare('SELECT avatar_url FROM profiles WHERE username = ?').get(testUsername) as any;
    expect(updated.avatar_url).toBe('/uploads/upload_test-avatar.png');
  });

  it('POST /api/analytics/view with non-existent profile should return 404', async () => {
    const res = await request(app)
      .post('/api/analytics/view')
      .send({ profileId: 'prf_non_existent' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Profile not found');
  });

  it('POST /api/upload without file should return 400 with clean JSON error', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/select an image file/i);
  });

  it('GET /api/auth/check-username for reserved name should return available: false', async () => {
    const res = await request(app).get('/api/auth/check-username/pricing');
    expect(res.body.available).toBe(false);
    expect(res.body.reason).toMatch(/reserved/i);
  });

  it('POST /api/auth/register with reserved username should fail with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `reserved_${Date.now()}@liinx.test`,
        password: 'Password123!',
        username: 'admin'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/reserved/i);
  });

  it('GET /robots.txt and /sitemap.xml should return valid SEO endpoints', async () => {
    const robotsRes = await request(app).get('/robots.txt');
    expect(robotsRes.status).toBe(200);
    expect(robotsRes.text).toContain('Sitemap:');
    expect(robotsRes.text).toContain('User-agent: *');
    expect(robotsRes.text).toContain('Allow: /features');
    expect(robotsRes.text).toContain('Disallow: /api/');
    expect(robotsRes.text).not.toContain('Disallow: /studio');

    const sitemapRes = await request(app).get('/sitemap.xml');
    expect(sitemapRes.status).toBe(200);
    expect(sitemapRes.header['content-type']).toContain('xml');
    expect(sitemapRes.text).toContain('<urlset');
    expect(sitemapRes.text).toContain('/@elenarostova');
  });

  it('DELETE /api/auth/account should permanently delete user and associated profile', async () => {
    const deletionEmail = `delete_${Date.now()}@liinx.test`;
    const deletionUsername = `delete_${Date.now().toString().slice(-8)}`;
    const registered = await request(app).post('/api/auth/register').send({
      email: deletionEmail,
      password: 'Password123!',
      username: deletionUsername
    });
    expect(registered.status).toBe(201);
    const res = await request(app)
      .delete('/api/auth/account')
      .set('Authorization', `Bearer ${registered.body.token}`)
      .send({ confirmation: 'DELETE', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify user and profile are deleted from SQLite
    const userCheck = db.prepare('SELECT * FROM users WHERE email = ?').get(deletionEmail);
    expect(userCheck).toBeUndefined();

    const profileCheck = db.prepare('SELECT * FROM profiles WHERE username = ?').get(deletionUsername);
    expect(profileCheck).toBeUndefined();
  });
});
