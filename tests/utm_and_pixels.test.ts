import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { db, initDatabase } from '../server/db';
import { signJwt } from '../server/auth';
import { profilesRouter } from '../server/routes/profiles';
import { analyticsRouter, flushAnalyticsBuffers } from '../server/routes/analytics';

describe('Milestone 4: UTM Tracking & Tracking Pixels (0% Fake Implementation)', () => {
  const app = express();
  app.use(express.json());
  app.use(analyticsRouter);
  app.use('/api', profilesRouter);
  app.use('/api', analyticsRouter);

  const testUserId = 'usr_pixel_test';
  const testProfileId = 'prf_pixel_test';
  const testUsername = 'pixelcreator';

  const authToken = signJwt({
    userId: testUserId,
    email: 'pixel@liinx.test',
    profileId: testProfileId,
    username: testUsername
  });

  beforeAll(() => {
    initDatabase();

    const now = Date.now();
    // Create test user and profile
    db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
    db.prepare(`
      INSERT INTO users (id, email, password_hash, created_at)
      VALUES (?, ?, ?, ?)
    `).run(testUserId, 'pixel@liinx.test', 'hashed_pw', now);
    db.prepare("UPDATE users SET subscription_plan = 'pro' WHERE id = ?").run(testUserId);

    db.prepare('DELETE FROM blocks WHERE profile_id = ?').run(testProfileId);
    db.prepare('DELETE FROM pages WHERE profile_id = ?').run(testProfileId);
    db.prepare('DELETE FROM profiles WHERE id = ?').run(testProfileId);
    db.prepare(`
      INSERT INTO profiles (
        id, user_id, username, display_name, plan, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(testProfileId, testUserId, testUsername, 'Pixel Creator', 'pro', now, now);
    db.prepare(`
      INSERT INTO blocks (id, profile_id, type, title, url, position, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('blk_pixel_link', testProfileId, 'link', 'Pixel Merch', 'https://shop.example.com/merch', 0, now, now);

    // Clear analytics tables for clean testing
    db.prepare('DELETE FROM link_clicks WHERE profile_id = ?').run(testProfileId);
    db.prepare('DELETE FROM profile_views WHERE profile_id = ?').run(testProfileId);
  });

  it('updates and persists Google Analytics and Meta Pixel IDs in profile', async () => {
    const updateRes = await request(app)
      .put('/api/studio/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        gaMeasurementId: 'G-12345ABCDE',
        metaPixelId: '987654321012345'
      })
      .expect(200);

    expect(updateRes.body.success).toBe(true);

    // Verify in studio profile endpoint
    const studioRes = await request(app)
      .get('/api/studio/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(studioRes.body.gaMeasurementId).toBe('G-12345ABCDE');
    expect(studioRes.body.metaPixelId).toBe('987654321012345');

    // Verify in public profile endpoint
    const publicRes = await request(app)
      .get(`/api/profiles/${testUsername}`)
      .expect(200);

    expect(publicRes.body.gaMeasurementId).toBe('G-12345ABCDE');
    expect(publicRes.body.metaPixelId).toBe('987654321012345');
  });

  it('logs view with deep UTM parameters and reflects in campaign stats', async () => {
    // Record multiple views with UTM parameters
    await request(app)
      .post('/api/analytics/view')
      .send({
        profileId: testProfileId,
        referrer: 'https://instagram.com',
        utmSource: 'instagram',
        utmMedium: 'bio_story',
        utmCampaign: 'black_friday_2026'
      })
      .expect(200);

    await request(app)
      .post('/api/analytics/view')
      .send({
        profileId: testProfileId,
        referrer: 'https://instagram.com',
        utmSource: 'instagram',
        utmMedium: 'bio_story',
        utmCampaign: 'black_friday_2026'
      })
      .expect(200);

    await request(app)
      .post('/api/analytics/view')
      .send({
        profileId: testProfileId,
        referrer: 'https://twitter.com',
        utmSource: 'twitter',
        utmMedium: 'social_post',
        utmCampaign: 'launch_drop'
      })
      .expect(200);

    flushAnalyticsBuffers();

    // Query analytics stats
    const statsRes = await request(app)
      .get('/api/analytics/stats')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(statsRes.body.topUtmCampaigns).toBeDefined();
    expect(statsRes.body.topUtmCampaigns.length).toBeGreaterThanOrEqual(2);

    const bfCampaign = statsRes.body.topUtmCampaigns.find(
      (c: any) => c.campaign === 'black_friday_2026'
    );
    expect(bfCampaign).toBeDefined();
    expect(bfCampaign.source).toBe('instagram');
    expect(bfCampaign.medium).toBe('bio_story');
    // Identical delivery retries are deduplicated within the same minute.
    expect(bfCampaign.count).toBe(1);

    const twitterCampaign = statsRes.body.topUtmCampaigns.find(
      (c: any) => c.campaign === 'launch_drop'
    );
    expect(twitterCampaign).toBeDefined();
    expect(twitterCampaign.source).toBe('twitter');
    expect(twitterCampaign.count).toBe(1);
  });

  it('records UTM parameters on outbound redirect links', async () => {
    await request(app)
      .get('/r/blk_pixel_link?utm_source=newsletter&utm_medium=email&utm_campaign=weekly_digest')
      .expect(302);

    flushAnalyticsBuffers();

    const loggedClick = db.prepare(`
      SELECT * FROM link_clicks WHERE block_id = 'blk_pixel_link' ORDER BY created_at DESC LIMIT 1
    `).get() as any;

    expect(loggedClick).toBeDefined();
    expect(loggedClick.utm_source).toBe('newsletter');
    expect(loggedClick.utm_medium).toBe('email');
    expect(loggedClick.utm_campaign).toBe('weekly_digest');
  });
});
