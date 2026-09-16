/**
 * LIINX End-to-End Acceptance Tests
 *
 * Verifies every advertised feature that was not yet explicitly covered:
 *   - Newsletter CSV export (real Content-Type, Content-Disposition, CSV body)
 *   - Video block full lifecycle (create → public visibility → SQLite verify → delete)
 *   - Folder block full lifecycle (create → nested items on public API → SQLite verify)
 *   - Security response headers (OWASP hardening)
 *   - Observability headers (X-Request-Id, X-Response-Time)
 *   - Duplicate newsletter subscription idempotency
 *   - Invalid plan tier rejection
 *   - GET /api/studio/profile private authenticated endpoint
 *   - /api/health full diagnostics schema
 *
 * All assertions use real SQLite persistence and live HTTP routes via supertest.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';

describe('Acceptance Tests — All Advertised Features (0% Fake Implementation)', () => {
  beforeAll(() => {
    initDatabase();
  });

  const uniqueId = Date.now();
  const username = `accept_${uniqueId}`;
  const email = `accept_${uniqueId}@liinx.test`;
  const password = 'AcceptancePass2026!';

  let authToken = '';
  let profileId = '';

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password, username });

    expect(res.status).toBe(201);
    authToken = res.body.token;
    profileId = res.body.profileId;
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Newsletter CSV Export
  //    README advertises: "1-click CSV export"
  // ──────────────────────────────────────────────────────────────────────────
  describe('Newsletter CSV Export (Advertised: "1-click CSV export")', () => {
    const subscriberEmail = `csvfan_${uniqueId}@example.com`;

    it('subscribes a real email to the creator newsletter', async () => {
      const res = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ profileId, email: subscriberEmail, consent: true });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const row = db
        .prepare('SELECT email FROM newsletter_subscribers WHERE email = ?')
        .get(subscriberEmail) as any;
      expect(row).toBeDefined();
      expect(row.email).toBe(subscriberEmail);
    });

    it('exports subscriber list as a valid CSV file with correct headers', async () => {
      const res = await request(app)
        .get('/api/studio/subscribers/export')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toMatch(/text\/csv/i);
      expect(res.header['content-disposition']).toMatch(/attachment/i);
      expect(res.header['content-disposition']).toMatch(/subscribers\.csv/i);

      const lines = res.text.split('\n').filter(Boolean);
      expect(lines[0]).toContain('Email');
      expect(lines[0]).toContain('Subscribed');
      expect(lines.length).toBeGreaterThanOrEqual(2);
      expect(res.text).toContain(subscriberEmail);
    });

    it('CSV export requires authentication — returns 401 without Bearer token', async () => {
      const res = await request(app).get('/api/studio/subscribers/export');
      expect(res.status).toBe(401);
    });

    it('duplicate newsletter subscription is idempotent (200, not 500)', async () => {
      const res = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ profileId, email: subscriberEmail, consent: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/already subscribed/i);

      const count = db
        .prepare('SELECT COUNT(*) as n FROM newsletter_subscribers WHERE email = ? AND profile_id = ?')
        .get(subscriberEmail, profileId) as { n: number };
      expect(count.n).toBe(1);
    });

    it('newsletter subscribe with invalid email format returns 400', async () => {
      const res = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ profileId, email: 'not-an-email', consent: true });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/valid email/i);
    });

    it('newsletter subscribe with non-existent profileId returns 404', async () => {
      const res = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ profileId: 'prf_does_not_exist', email: `orphan_${uniqueId}@test.com`, consent: true });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Video Block — full CRUD lifecycle
  //    README advertises: "Video Players (embed URL, thumbnail)"
  // ──────────────────────────────────────────────────────────────────────────
  describe('Video Block — Full Persistence Lifecycle (Advertised Block Type)', () => {
    let videoBlockId = '';

    it('creates a video block with embed URL and thumbnail extra data', async () => {
      const res = await request(app)
        .post('/api/studio/blocks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'video',
          title: "Director's Cut Reel",
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          extra: {
            thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
            embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe('video');
      videoBlockId = res.body.id;
    });

    it('video block appears on public creator profile with extra fields flattened', async () => {
      const res = await request(app).get(`/api/profiles/${username}`);
      expect(res.status).toBe(200);

      const vBlock = res.body.blocks.find((b: any) => b.id === videoBlockId);
      expect(vBlock).toBeDefined();
      expect(vBlock.type).toBe('video');
      expect(vBlock.thumbnailUrl).toContain('youtube');
      expect(vBlock.embedUrl).toContain('youtube-nocookie');
    });

    it('video block extra_json is persisted correctly in SQLite', () => {
      const row = db.prepare('SELECT * FROM blocks WHERE id = ?').get(videoBlockId) as any;
      expect(row).toBeDefined();
      const extra = JSON.parse(row.extra_json);
      expect(extra.thumbnailUrl).toContain('youtube');
      expect(extra.embedUrl).toContain('youtube-nocookie');
    });

    it('video block can be updated with new title and embed URL', async () => {
      const res = await request(app)
        .put(`/api/studio/blocks/${videoBlockId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Director Cut v2',
          extra: { embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=0' }
        });

      expect(res.status).toBe(200);

      const updated = db.prepare('SELECT * FROM blocks WHERE id = ?').get(videoBlockId) as any;
      expect(updated.title).toBe('Director Cut v2');
      const extra = JSON.parse(updated.extra_json);
      expect(extra.embedUrl).toContain('autoplay=0');
    });

    it('deletes video block and confirms SQLite row is removed', async () => {
      const del = await request(app)
        .delete(`/api/studio/blocks/${videoBlockId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(del.status).toBe(200);

      const check = db.prepare('SELECT id FROM blocks WHERE id = ?').get(videoBlockId);
      expect(check).toBeUndefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Folder Block — full CRUD lifecycle
  //    README advertises: "Collapsible Link Folders (nested items)"
  // ──────────────────────────────────────────────────────────────────────────
  describe('Folder Block — Full Persistence Lifecycle (Advertised: "Collapsible Link Folders")', () => {
    let folderBlockId = '';

    const folderItems = [
      { title: 'Press Photos', url: 'https://example.com/press/photos.zip' },
      { title: 'Brand Guidelines', url: 'https://example.com/press/brand.pdf' },
      { title: 'Official Bio', url: 'https://example.com/press/bio.pdf' }
    ];

    it('creates a folder block with three nested link items', async () => {
      const res = await request(app)
        .post('/api/studio/blocks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'folder',
          title: 'Press & Media Kit',
          extra: { items: folderItems }
        });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe('folder');
      folderBlockId = res.body.id;
    });

    it('folder and nested items appear on public profile', async () => {
      const res = await request(app).get(`/api/profiles/${username}`);
      const folder = res.body.blocks.find((b: any) => b.id === folderBlockId);

      expect(folder).toBeDefined();
      expect(folder.type).toBe('folder');
      expect(Array.isArray(folder.items)).toBe(true);
      expect(folder.items).toHaveLength(3);
      expect(folder.items[0].title).toBe('Press Photos');
      expect(folder.items[1].url).toContain('brand');
    });

    it('folder extra_json is stored with all nested items in SQLite', () => {
      const row = db.prepare('SELECT * FROM blocks WHERE id = ?').get(folderBlockId) as any;
      expect(row).toBeDefined();
      const extra = JSON.parse(row.extra_json);
      expect(extra.items).toHaveLength(3);
      expect(extra.items[2].title).toBe('Official Bio');
    });

    it('folder nested items can be updated by appending a new item', async () => {
      const updatedItems = [
        ...folderItems,
        { title: 'Video Reel', url: 'https://vimeo.com/76979871' }
      ];

      const res = await request(app)
        .put(`/api/studio/blocks/${folderBlockId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ extra: { items: updatedItems } });

      expect(res.status).toBe(200);

      const updated = db.prepare('SELECT * FROM blocks WHERE id = ?').get(folderBlockId) as any;
      const extra = JSON.parse(updated.extra_json);
      expect(extra.items).toHaveLength(4);
      expect(extra.items[3].title).toBe('Video Reel');
    });

    it('deletes folder block and verifies removal from SQLite', async () => {
      const del = await request(app)
        .delete(`/api/studio/blocks/${folderBlockId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(del.status).toBe(200);

      const check = db.prepare('SELECT id FROM blocks WHERE id = ?').get(folderBlockId);
      expect(check).toBeUndefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. OWASP Security Response Headers
  //    README advertises: "OWASP / Production Hardening"
  // ──────────────────────────────────────────────────────────────────────────
  describe('Security Response Headers (Advertised: OWASP / Production Hardening)', () => {
    it('GET /api/health carries all mandatory OWASP security headers', async () => {
      const res = await request(app).get('/api/health');
      expect(res.header['x-content-type-options']).toBe('nosniff');
      expect(res.header['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.header['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(res.header['permissions-policy']).toBe('camera=(), microphone=(), geolocation=()');
    });

    it('authenticated studio API carries OWASP security headers', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.header['x-content-type-options']).toBe('nosniff');
      expect(res.header['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.header['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    it('public profile endpoint carries OWASP security headers', async () => {
      const res = await request(app).get(`/api/profiles/${username}`);
      expect(res.header['x-content-type-options']).toBe('nosniff');
      expect(res.header['x-frame-options']).toBe('SAMEORIGIN');
    });

    it('404 error responses still carry security headers', async () => {
      const res = await request(app).get('/api/profiles/user_does_not_exist_zzzxxx');
      expect(res.status).toBe(404);
      expect(res.header['x-content-type-options']).toBe('nosniff');
      expect(res.header['x-frame-options']).toBe('SAMEORIGIN');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Request Observability Headers
  //    README advertises: "X-Request-Id", "X-Response-Time"
  // ──────────────────────────────────────────────────────────────────────────
  describe('Request Observability Headers (Advertised: X-Request-Id, X-Response-Time)', () => {
    it('server generates a unique X-Request-Id for each concurrent request', async () => {
      const [res1, res2] = await Promise.all([
        request(app).get('/api/health'),
        request(app).get('/api/health')
      ]);

      expect(res1.header['x-request-id']).toBeDefined();
      expect(res2.header['x-request-id']).toBeDefined();
      expect(res1.header['x-request-id']).not.toBe(res2.header['x-request-id']);
    });

    it('client-supplied X-Request-Id is echoed back verbatim', async () => {
      const clientId = 'acceptance-test-req-id-abc123';
      const res = await request(app)
        .get('/api/health')
        .set('X-Request-Id', clientId);

      expect(res.header['x-request-id']).toBe(clientId);
    });

    it('every response includes X-Response-Time in milliseconds format', async () => {
      const res = await request(app).get('/api/health');
      const rt = res.header['x-response-time'];

      expect(rt).toBeDefined();
      expect(rt).toMatch(/^\d+(\.\d+)?ms$/);

      const ms = parseFloat(rt.replace('ms', ''));
      expect(ms).toBeLessThan(5000);
    });

    it('X-Response-Time is present on authenticated analytics endpoint', async () => {
      const res = await request(app)
        .get('/api/analytics/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.header['x-response-time']).toBeDefined();
      expect(res.header['x-response-time']).toMatch(/^\d+(\.\d+)?ms$/);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Plan Tier Validation (failure handling)
  //    API: PUT /api/studio/plan
  // ──────────────────────────────────────────────────────────────────────────
  describe('Plan Tier Validation — Failure Handling', () => {
    it('rejects invalid plan names with 400 and a descriptive error', async () => {
      const res = await request(app)
        .put('/api/studio/plan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ plan: 'enterprise' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid plan/i);
    });

    it('accepts all three valid tiers and persists each in SQLite', async () => {
      for (const plan of ['pro', 'studio', 'free']) {
        const res = await request(app)
          .put('/api/studio/plan')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ plan });

        expect(res.status).toBe(200);
        expect(res.body.plan).toBe(plan);

        const row = db
          .prepare('SELECT plan FROM profiles WHERE username = ?')
          .get(username) as any;
        expect(row.plan).toBe(plan);
      }
    });

    it('plan update without authentication returns 401', async () => {
      const res = await request(app).put('/api/studio/plan').send({ plan: 'pro' });
      expect(res.status).toBe(401);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. GET /api/studio/profile — Private authenticated endpoint
  //    Advertised in README API reference table
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /api/studio/profile — Private Authenticated Profile Endpoint', () => {
    it('returns full private profile with correct cache headers', async () => {
      const res = await request(app)
        .get('/api/studio/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.username).toBe(username);
      expect(Array.isArray(res.body.blocks)).toBe(true);
      expect(res.body.plan).toBeDefined();
      expect(res.header['cache-control']).toMatch(/no-store/i);
    });

    it('response contains all schema fields from the feature matrix', async () => {
      const res = await request(app)
        .get('/api/studio/profile')
        .set('Authorization', `Bearer ${authToken}`);

      const body = res.body;
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('username');
      expect(body).toHaveProperty('displayName');
      expect(body).toHaveProperty('bio');
      expect(body).toHaveProperty('avatarUrl');
      expect(body).toHaveProperty('category');
      expect(body).toHaveProperty('verified');
      expect(body).toHaveProperty('themeId');
      expect(body).toHaveProperty('plan');
      expect(body).toHaveProperty('hideBranding');
      expect(body).toHaveProperty('gaMeasurementId');
      expect(body).toHaveProperty('metaPixelId');
      expect(body).toHaveProperty('customDomain');
      expect(body).toHaveProperty('customCss');
      expect(body).toHaveProperty('customFontUrl');
      expect(body).toHaveProperty('customTheme');
      expect(body).toHaveProperty('socials');
      expect(body).toHaveProperty('blocks');
    });

    it('returns 401 when accessed without a Bearer token', async () => {
      const res = await request(app).get('/api/studio/profile');
      expect(res.status).toBe(401);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 8. /api/health Full Diagnostics Schema
  //    README advertises: "Service liveness, uptime, memory, and database status"
  // ──────────────────────────────────────────────────────────────────────────
  describe('/api/health — Full Diagnostics Schema (Advertised: Observability)', () => {
    it('returns complete production-grade health diagnostics', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('liinx-api');
      expect(typeof res.body.uptimeSeconds).toBe('number');
      expect(res.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
      expect(new Date(res.body.timestamp).getTime()).not.toBeNaN();

      expect(res.body.database.status).toBe('connected');
      expect(res.body.database.driver).toBe('better-sqlite3');
      expect(res.body.database.journalMode).toBe('wal');

      expect(typeof res.body.memory.rssMb).toBe('number');
      expect(typeof res.body.memory.heapUsedMb).toBe('number');
      expect(typeof res.body.memory.heapTotalMb).toBe('number');
      expect(res.body.memory.rssMb).toBeGreaterThan(0);
    });
  });
});
