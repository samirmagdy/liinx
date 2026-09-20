import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';
import { extractLinksFromCaption, syncMediaToBlocks } from '../server/services/instagramSync.js';

describe('Instagram caption auto-sync', () => {
  beforeAll(() => {
    initDatabase();
  });

  const testEmail = `insta_tester_${Date.now()}@raloa.test`;
  const testUsername = `instadev_${Date.now()}`;
  let authToken = '';
  let profileId = '';

  it('Setup: Register test creator profile', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: 'Password123!',
        username: testUsername
      });

    expect(res.status).toBe(201);
    authToken = res.body.token;
    profileId = res.body.profileId;
    expect(profileId).toBeDefined();
  });

  describe('1. Caption Link Extraction & Normalization Unit Tests', () => {
    it('should extract a single URL with call-to-action title', () => {
      const caption = 'Excited to announce our upcoming world tour! Tickets on sale now: https://eventbrite.com/e/world-tour-2025';
      const results = extractLinksFromCaption(caption);

      expect(results.length).toBe(1);
      expect(results[0].url).toBe('https://eventbrite.com/e/world-tour-2025');
      expect(results[0].title).toBe('Tickets on sale now');
    });

    it('should extract multiple distinct URLs and clean trailing punctuation', () => {
      const caption = `New summer presets are live on Gumroad (https://gumroad.com/l/presets)!
Check out our latest music video on YouTube: https://youtube.com/watch?v=sample123.
Also stream our single on Spotify: https://open.spotify.com/track/track999?si=xyz`;

      const results = extractLinksFromCaption(caption);
      expect(results.length).toBe(3);

      expect(results[0].url).toBe('https://gumroad.com/l/presets');
      expect(results[1].url).toBe('https://youtube.com/watch?v=sample123');
      expect(results[2].url).toBe('https://open.spotify.com/track/track999?si=xyz');
    });

    it('should normalize www. URLs and reject dangerous protocols', () => {
      const safeCaption = 'Visit www.myportfolio.design for prints.';
      const safeResults = extractLinksFromCaption(safeCaption);
      expect(safeResults.length).toBe(1);
      expect(safeResults[0].url).toBe('https://www.myportfolio.design');

      const attackCaption = 'Free gift: javascript:alert(1) or data:text/html,<script>alert(1)</script>';
      const attackResults = extractLinksFromCaption(attackCaption);
      expect(attackResults.length).toBe(0);
    });

    it('should ignore localhost and private IP targets', () => {
      const internalCaption = 'Admin panel: http://localhost:3000/admin or http://127.0.0.1:8080';
      const results = extractLinksFromCaption(internalCaption);
      expect(results.length).toBe(0);
    });
  });

  describe('2. Real Database Media Sync & Deduplication', () => {
    it('should sync caption links into real SQLite block rows', () => {
      const media = [
        {
          id: 'media_101',
          caption: 'Pre-order the vinyl: https://shop.artist.com/vinyl-lp',
          timestamp: new Date().toISOString()
        },
        {
          id: 'media_102',
          caption: 'No link in this caption, just vibes.',
          timestamp: new Date().toISOString()
        }
      ];

      const syncResult = syncMediaToBlocks(profileId, media);
      expect(syncResult.mediaProcessed).toBe(2);
      expect(syncResult.totalCreated).toBe(1);
      expect(syncResult.linksCreated[0].url).toBe('https://shop.artist.com/vinyl-lp');

      // Verify in database
      const row = db.prepare(
        'SELECT * FROM blocks WHERE profile_id = ? AND url = ?'
      ).get(profileId, 'https://shop.artist.com/vinyl-lp') as any;

      expect(row).toBeDefined();
      expect(row.badge).toBe('INSTAGRAM');
      expect(row.title).toContain('Pre-order the vinyl');
    });

    it('should be idempotent and deduplicate identical links on repeated syncs', () => {
      const media = [
        {
          id: 'media_101',
          caption: 'Pre-order the vinyl: https://shop.artist.com/vinyl-lp',
          timestamp: new Date().toISOString()
        }
      ];

      // Second sync with identical content
      const secondSync = syncMediaToBlocks(profileId, media);
      expect(secondSync.totalCreated).toBe(0);

      // Verify still only 1 block exists in database
      const countRow = db.prepare(
        'SELECT COUNT(*) as count FROM blocks WHERE profile_id = ? AND url = ?'
      ).get(profileId, 'https://shop.artist.com/vinyl-lp') as { count: number };

      expect(countRow.count).toBe(1);
    });
  });

  describe('3. Meta Webhooks Verification & Signature Validation', () => {
    it('GET /api/webhooks/instagram should verify webhook challenge', async () => {
      process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN = 'test_verify_token_123';

      const res = await request(app)
        .get('/api/webhooks/instagram')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'test_verify_token_123',
          'hub.challenge': '1158201244'
        });

      expect(res.status).toBe(200);
      expect(res.text).toBe('1158201244');
    });

    it('GET /api/webhooks/instagram should reject invalid verify token with 403', async () => {
      const res = await request(app)
        .get('/api/webhooks/instagram')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong_token',
          'hub.challenge': '1158201244'
        });

      expect(res.status).toBe(403);
    });

    it('POST /api/webhooks/instagram should validate signature and acknowledge event', async () => {
      process.env.INSTAGRAM_CLIENT_SECRET = 'meta_app_secret_abc';
      const payload = {
        object: 'instagram',
        entry: [{ id: 'ig_user_123', time: Date.now() }]
      };

      const hmac = crypto.createHmac('sha256', 'meta_app_secret_abc');
      const signature = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');

      const res = await request(app)
        .post('/api/webhooks/instagram')
        .set('x-hub-signature-256', signature)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.text).toBe('EVENT_RECEIVED');
    });

    it('POST /api/webhooks/instagram should reject forged signature with 401', async () => {
      process.env.INSTAGRAM_CLIENT_SECRET = 'meta_app_secret_abc';
      const payload = { object: 'instagram', entry: [] };

      const res = await request(app)
        .post('/api/webhooks/instagram')
        .set('x-hub-signature-256', 'sha256=invalid_forged_hash')
        .send(payload);

      expect(res.status).toBe(401);
    });
  });

  describe('4. Status, Direct Caption Testing & Integration Management', () => {
    it('GET /api/integrations/instagram/status should report initial disconnected state', async () => {
      const res = await request(app)
        .get('/api/integrations/instagram/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.connected).toBe(false);
    });

    it('POST /api/integrations/instagram/test-caption should parse and optionally save link', async () => {
      const caption = 'Catch my latest DJ mix on SoundCloud: https://soundcloud.com/user/summer-mix-2025';

      const res = await request(app)
        .post('/api/integrations/instagram/test-caption')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          caption,
          saveToProfile: true
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.savedCount).toBe(1);
      expect(res.body.extracted[0].url).toBe('https://soundcloud.com/user/summer-mix-2025');

      // Verify the block is in the profile
      const block = db.prepare(
        'SELECT * FROM blocks WHERE profile_id = ? AND url = ?'
      ).get(profileId, 'https://soundcloud.com/user/summer-mix-2025') as any;

      expect(block).toBeDefined();
      expect(block.badge).toBe('INSTAGRAM');
    });

    it('POST /api/integrations/instagram/disconnect should clean up integration row', async () => {
      // Simulate active connection row
      db.prepare(`
        INSERT INTO instagram_sync (
          id, profile_id, instagram_user_id, instagram_username, access_token, created_at, updated_at
        ) VALUES ('ins_test_1', ?, '123456', 'test_creator', 'mock_token', ?, ?)
      `).run(profileId, Date.now(), Date.now());

      const statusRes = await request(app)
        .get('/api/integrations/instagram/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(statusRes.body.connected).toBe(true);
      expect(statusRes.body.username).toBe('test_creator');

      // Now disconnect
      const disconnectRes = await request(app)
        .post('/api/integrations/instagram/disconnect')
        .set('Authorization', `Bearer ${authToken}`);

      expect(disconnectRes.status).toBe(200);
      expect(disconnectRes.body.success).toBe(true);

      // Verify disconnected
      const verifyRes = await request(app)
        .get('/api/integrations/instagram/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(verifyRes.body.connected).toBe(false);
    });

    it('IDOR: User B cannot access or modify User A integration', async () => {
      // Register User B
      const userBRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: `user_b_${Date.now()}@raloa.test`,
          password: 'Password123!',
          username: `userb_${Date.now()}`
        });

      expect(userBRes.status).toBe(201);
      const userBToken = userBRes.body.token;
      expect(userBToken).toBeDefined();

      // User B disconnects -> should only affect User B's profile
      const res = await request(app)
        .post('/api/integrations/instagram/disconnect')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
    });
  });
});
