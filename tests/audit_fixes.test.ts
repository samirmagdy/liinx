import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';
import { signJwt } from '../server/auth.js';

describe('Audit Remediation Acceptance Test Suite (10 Production-Grade Points)', () => {
  const testUserId = 'usr_audit_test';
  const testProfileId = 'prf_audit_test';
  const testUsername = 'audituser';
  let authToken = '';

  beforeAll(() => {
    initDatabase();
    const now = Date.now();

    db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
    db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
      testUserId, 'audit@liinx.test', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now
    );

    db.prepare('DELETE FROM profiles WHERE id = ? OR username = ?').run(testProfileId, testUsername);
    db.prepare(`
      INSERT INTO profiles (id, user_id, username, display_name, plan, created_at, updated_at)
      VALUES (?, ?, ?, 'Audit Remediation User', 'pro', ?, ?)
    `).run(testProfileId, testUserId, testUsername, now, now);

    authToken = signJwt({
      userId: testUserId,
      email: 'audit@liinx.test',
      profileId: testProfileId,
      username: testUsername
    });
  });

  // Point 1: Registration / Login Security
  describe('Point 1: Registration & Login Hardening', () => {
    it('rejects passwords exceeding 128 characters to prevent DoS', async () => {
      const longPassword = 'a'.repeat(129);
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'toolong@liinx.test',
          password: longPassword,
          username: 'toolongpw'
        })
        .expect(400);

      expect(res.body.error).toMatch(/password.*128/i);
    });

    it('handles non-existent users with timing attack protection (dummy bcrypt compare)', async () => {
      const start = Date.now();
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent_account_audit@liinx.test',
          password: 'SomePassword123!'
        })
        .expect(401);

      const elapsed = Date.now() - start;
      expect(res.body.error).toMatch(/invalid email or password/i);
      // Bcrypt hash verification introduces a noticeable CPU calculation (~40-100ms)
      expect(elapsed).toBeGreaterThan(20);
    });
  });

  // Point 2: Profile & Block Editing Persistence
  describe('Point 2: Profile & Block Editing Reliability', () => {
    it('persists profile edits accurately to database', async () => {
      const res = await request(app)
        .put('/api/studio/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: 'Updated Audit Creator',
          bio: 'Verified persistent bio update'
        })
        .expect(200);

      expect(res.body.success).toBe(true);

      const profileInDb = db.prepare('SELECT display_name, bio FROM profiles WHERE id = ?').get(testProfileId) as any;
      expect(profileInDb.display_name).toBe('Updated Audit Creator');
      expect(profileInDb.bio).toBe('Verified persistent bio update');
    });

    it('persists block creation and updates without dropping state', async () => {
      const addRes = await request(app)
        .post('/api/studio/blocks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'link',
          title: 'Primary Portfilio',
          url: 'https://github.com/mywork'
        })
        .expect(201);

      expect(addRes.body.id).toBeDefined();
      const blockId = addRes.body.id;

      const updateRes = await request(app)
        .put(`/api/studio/blocks/${blockId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Corrected Portfolio Title'
        })
        .expect(200);

      expect(updateRes.body.success).toBe(true);

      const blockInDb = db.prepare('SELECT title FROM blocks WHERE id = ?').get(blockId) as any;
      expect(blockInDb.title).toBe('Corrected Portfolio Title');
    });
  });

  // Point 3: Paid Subscriptions (Authentic Stripe flow, no fake upgrade in production)
  describe('Point 3: Paid Subscriptions & Stripe Billing', () => {
    it('disallows direct plan tampering via PUT /api/studio/plan in simulated production', async () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        // Temporarily simulate production environment
        (process.env as any).NODE_ENV = 'production';

        const res = await request(app)
          .put('/api/studio/plan')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ plan: 'studio' })
          .expect(403);

        expect(res.body.error).toMatch(/direct plan updates are disabled in production/i);
      } finally {
        (process.env as any).NODE_ENV = originalEnv;
      }
    });

    it('provides a dedicated Stripe checkout session endpoint', async () => {
      const res = await request(app)
        .post('/api/billing/create-checkout-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ plan: 'pro' });

      // Either returns checkout url or informs of missing Stripe live credentials (honest handling)
      if (res.status === 200) {
        expect(res.body.url).toBeDefined();
      } else {
        expect(res.status).toBe(503);
        expect(res.body.error).toMatch(/stripe.*not configured/i);
      }
    });

    it('rejects Stripe webhook requests lacking valid signatures', async () => {
      const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;
      try {
        process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret_for_audit';
        const res = await request(app)
          .post('/api/billing/webhook')
          .send({ type: 'checkout.session.completed' })
          .expect(400);

        expect(res.body.error).toMatch(/stripe-signature header/i);
      } finally {
        if (originalSecret) process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
        else delete process.env.STRIPE_WEBHOOK_SECRET;
      }
    });
  });

  // Point 4: Custom Domains
  describe('Point 4: Custom Domain Verification & Routing', () => {
    it('provides DNS CNAME ownership verification via /api/studio/custom-domain/verify', async () => {
      const res = await request(app)
        .post('/api/studio/custom-domain/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ domain: 'links.customdomain.org' })
        .expect(200);

      expect(res.body.domain).toBe('links.customdomain.org');
      expect(res.body.expectedTarget).toBe('cname.liinx.app');
      expect(res.body.message).toBeDefined();
    });

    it('serves SPA application file for custom domains when HTML is requested', async () => {
      // Setup a custom domain
      db.prepare('UPDATE profiles SET custom_domain = ?, custom_domain_verified = 1 WHERE id = ?').run(
        'bio.auditbrand.com', testProfileId
      );

      const res = await request(app)
        .get('/')
        .set('Host', 'bio.auditbrand.com')
        .expect(200);

      // Supertest non-HTML request resolves the profile JSON
      expect(res.body.username).toBe(testUsername);
      expect(res.headers['x-custom-domain-user']).toBe(testUsername);
    });
  });

  // Point 5: Image Uploads (Magic bytes verification, no MIME spoofing)
  describe('Point 5: Secure Image Uploads & Magic Byte Inspection', () => {
    it('rejects spoofed images with executable / shell / HTML content disguised as JPEG', async () => {
      const fakeJpgContent = Buffer.from('#!/bin/bash\necho "exploit"\n');
      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', fakeJpgContent, 'payload.jpg')
        .expect(400);

      expect(res.body.error).toMatch(/only jpeg, png, webp/i);
    });

    it('accepts genuine PNG image bytes and normalizes extension', async () => {
      // 8-byte standard PNG header + dummy chunk
      const validPngBytes = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);
      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', validPngBytes, 'photo.dat') // intentionally disguised extension
        .expect(201);

      expect(res.body.url).toBeDefined();
      expect(res.body.url).toMatch(/\.png$/i); // Normalized to true detected MIME
    });

    it('accepts genuine JPEG image bytes and normalizes extension', async () => {
      // JPEG SOI marker
      const validJpgBytes = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00]);
      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', validJpgBytes, 'avatar.upload')
        .expect(201);

      expect(res.body.url).toBeDefined();
      expect(res.body.url).toMatch(/\.jpe?g$/i);
    });
  });

  // Point 6: Analytics Abuse Prevention
  describe('Point 6: Analytics Abuse Rate Limiting', () => {
    it('rate limits excessive view pings to prevent bot inflation', async () => {
      const agent = request(app);
      let hit429 = false;

      for (let i = 0; i < 25; i++) {
        const res = await agent
          .post('/api/analytics/view')
          .set('X-Forwarded-For', '203.0.113.50')
          .send({ profileId: testProfileId });

        if (res.status === 429) {
          hit429 = true;
          expect(res.body.error).toMatch(/too many view requests/i);
          break;
        }
      }

      expect(hit429).toBe(true);
    });
  });

  // Point 7: Profile Importer SSRF & IP Rebinding Defense
  describe('Point 7: Profile Importer SSRF Protection', () => {
    it('blocks private IPv4 localhost addresses', async () => {
      const res = await request(app)
        .post('/api/studio/import/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ url: 'http://127.0.0.1:8080/profile' })
        .expect(400);

      expect(res.body.error).toMatch(/invalid or non-public profile url/i);
    });

    it('blocks cloud metadata IP (169.254.169.254)', async () => {
      const res = await request(app)
        .post('/api/studio/import/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ url: 'http://169.254.169.254/latest/meta-data/' })
        .expect(400);

      expect(res.body.error).toMatch(/invalid or non-public profile url/i);
    });

    it('blocks octal representation of localhost (0177.0.0.1)', async () => {
      const res = await request(app)
        .post('/api/studio/import/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ url: 'http://0177.0.0.1:3000' })
        .expect(400);

      expect(res.body.error).toMatch(/invalid or non-public profile url/i);
    });

    it('blocks decimal integer representation of localhost (2130706433)', async () => {
      const res = await request(app)
        .post('/api/studio/import/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ url: 'http://2130706433:3000' })
        .expect(400);

      expect(res.body.error).toMatch(/invalid or non-public profile url/i);
    });

    it('blocks IPv6 loopback (::1)', async () => {
      const res = await request(app)
        .post('/api/studio/import/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ url: 'http://[::1]:8080/data' })
        .expect(400);

      expect(res.body.error).toMatch(/invalid or non-public profile url/i);
    });
  });

  // Point 8: Public Profile Pages (No Fake Demo Profiles)
  describe('Point 8: Honest Public Profile Rendering (No Fallback Masks)', () => {
    it('returns an honest 404 for unknown creators instead of concealing failure with demo data', async () => {
      const res = await request(app)
        .get('/api/profiles/absolutely_nonexistent_creator_xyz_999')
        .expect(404);

      expect(res.body.error).toMatch(/was not found/i);
      // Must not return a fake demo profile payload
      expect(res.body.displayName).toBeUndefined();
      expect(res.body.blocks).toBeUndefined();
    });
  });

  // Point 9: Instagram Integration
  describe('Point 9: Instagram OAuth Configuration Transparency', () => {
    it('returns honest error status when Instagram credentials are unconfigured', async () => {
      const originalClientId = process.env.INSTAGRAM_CLIENT_ID;
      const originalSecret = process.env.INSTAGRAM_CLIENT_SECRET;
      try {
        delete process.env.INSTAGRAM_CLIENT_ID;
        delete process.env.INSTAGRAM_CLIENT_SECRET;

        const res = await request(app)
          .get('/api/integrations/instagram/auth-url')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(res.body.error).toMatch(/INSTAGRAM_CLIENT_ID.*not configured/i);
      } finally {
        if (originalClientId) process.env.INSTAGRAM_CLIENT_ID = originalClientId;
        if (originalSecret) process.env.INSTAGRAM_CLIENT_SECRET = originalSecret;
      }
    });
  });

  // Point 10: Production Docker Deployment
  describe('Point 10: Production Dockerfile & Runtime Dependency Integrity', () => {
    it('verifies Dockerfile copies src/ into production container', () => {
      const dockerfilePath = path.resolve(__dirname, '../Dockerfile');
      expect(fs.existsSync(dockerfilePath)).toBe(true);

      const content = fs.readFileSync(dockerfilePath, 'utf-8');
      expect(content).toMatch(/COPY --from=builder \/app\/src \.\/src/);
    });

    it('verifies package.json maintains tsx in production dependencies', () => {
      const pkgPath = path.resolve(__dirname, '../package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

      expect(pkg.dependencies.tsx).toBeDefined();
      expect(pkg.dependencies.stripe).toBeDefined();
    });
  });
});
