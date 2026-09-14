import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';

describe('Security & Penetration Testing (OWASP Top 10)', () => {
  beforeAll(() => {
    initDatabase();
  });

  const victimEmail = `victim_${Date.now()}@liinx.test`;
  const victimUsername = `victim_${Date.now()}`;
  let victimToken = '';
  let victimBlockId = '';
  let victimProfileId = '';

  const attackerEmail = `attacker_${Date.now()}@liinx.test`;
  const attackerUsername = `attacker_${Date.now()}`;
  let attackerToken = '';

  // Setup victim and attacker accounts
  beforeAll(async () => {
    // Register victim
    const resVictim = await request(app)
      .post('/api/auth/register')
      .send({
        email: victimEmail,
        password: 'VictimPassword123!',
        username: victimUsername
      });
    victimToken = resVictim.body.token;
    victimProfileId = resVictim.body.profileId;

    // Create a victim block
    const resBlock = await request(app)
      .post('/api/studio/blocks')
      .set('Authorization', `Bearer ${victimToken}`)
      .send({
        type: 'link',
        title: "Victim's Secret Link",
        url: 'https://example.com/secret',
        subtitle: 'Confidential destination'
      });
    victimBlockId = resBlock.body.id;

    // Register attacker
    const resAttacker = await request(app)
      .post('/api/auth/register')
      .send({
        email: attackerEmail,
        password: 'AttackerPassword123!',
        username: attackerUsername
      });
    attackerToken = resAttacker.body.token;
  });

  // 1. Broken Object Level Authorization (IDOR / BOLA)
  describe('Broken Object Level Authorization (BOLA / IDOR)', () => {
    it('Attacker CANNOT update victim block', async () => {
      const res = await request(app)
        .put(`/api/studio/blocks/${victimBlockId}`)
        .set('Authorization', `Bearer ${attackerToken}`)
        .send({ title: 'Hacked Title By Attacker' });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found or unauthorized/i);

      // Verify in DB that title was NOT modified
      const block = db.prepare('SELECT title FROM blocks WHERE id = ?').get(victimBlockId) as any;
      expect(block.title).toBe("Victim's Secret Link");
    });

    it('Attacker CANNOT delete victim block', async () => {
      const res = await request(app)
        .delete(`/api/studio/blocks/${victimBlockId}`)
        .set('Authorization', `Bearer ${attackerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found or unauthorized/i);

      // Verify in DB that block still exists
      const block = db.prepare('SELECT id FROM blocks WHERE id = ?').get(victimBlockId);
      expect(block).toBeDefined();
    });

    it('Unauthenticated user CANNOT access or update studio profile', async () => {
      const res = await request(app)
        .put('/api/studio/profile')
        .send({ displayName: 'Unauthenticated Hijack' });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/authentication required/i);
    });

    it('Attacker CANNOT view victim subscribers list', async () => {
      const res = await request(app)
        .get('/api/studio/subscribers')
        .set('Authorization', `Bearer ${attackerToken}`);

      expect(res.status).toBe(200);
      // Attacker should only see their own 0 subscribers, not victim's
      expect(res.body.count).toBe(0);
      expect(res.body.subscribers).toHaveLength(0);
    });
  });

  // 2. SQL Injection (SQLi) Protection
  describe('SQL Injection (SQLi) Defense', () => {
    const sqlPayloads = [
      "' OR 1=1 --",
      "admin' --",
      "' UNION SELECT null, email, password_hash, 1 FROM users --",
      "'; DROP TABLE blocks; --",
      "1' OR '1'='1"
    ];

    it.each(sqlPayloads)('should defend against SQLi in username lookup: %s', async (payload) => {
      const res = await request(app).get(`/api/profiles/${encodeURIComponent(payload)}`);
      // Should cleanly return 404 Not Found without executing the injected SQL syntax
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    it('should defend against SQLi in login credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: "' OR 1=1 --",
          password: "' OR '1'='1"
        });

      // Zod validation should reject invalid email format
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/valid email/i);
    });

    it('should defend against SQLi in link redirector parameter', async () => {
      const res = await request(app).get("/r/' OR 1=1 --");
      expect(res.status).toBe(404);
    });
  });

  // 3. Open Redirection & Protocol Hijacking (XSS through URLs)
  describe('Open Redirection & Protocol Hijacking', () => {
    it('should block javascript: pseudo-protocol URLs in redirector', async () => {
      // Create block with javascript: payload
      const xssBlockId = 'blk_xss_' + Date.now();
      db.prepare(`
        INSERT INTO blocks (id, profile_id, type, title, url, position, created_at, updated_at)
        VALUES (?, ?, 'link', 'Evil XSS', 'javascript:alert(document.domain)', 99, 1, 1)
      `).run(xssBlockId, victimProfileId);

      const res = await request(app).get(`/r/${xssBlockId}`);
      expect(res.status).toBe(400);
      expect(res.text).toMatch(/invalid destination/i);
    });

    it('should block data: URI scheme in redirector', async () => {
      const dataBlockId = 'blk_data_' + Date.now();
      db.prepare(`
        INSERT INTO blocks (id, profile_id, type, title, url, position, created_at, updated_at)
        VALUES (?, ?, 'link', 'Data URI', 'data:text/html,<script>alert(1)</script>', 100, 1, 1)
      `).run(dataBlockId, victimProfileId);

      const res = await request(app).get(`/r/${dataBlockId}`);
      expect(res.status).toBe(400);
      expect(res.text).toMatch(/invalid destination/i);
    });

    it('should safely normalize and allow legitimate web URLs', async () => {
      const safeBlockId = 'blk_safe_' + Date.now();
      db.prepare(`
        INSERT INTO blocks (id, profile_id, type, title, url, position, created_at, updated_at)
        VALUES (?, ?, 'link', 'Safe Link', 'github.com/myproject', 101, 1, 1)
      `).run(safeBlockId, victimProfileId);

      const res = await request(app).get(`/r/${safeBlockId}`);
      expect(res.status).toBe(302);
      expect(res.header.location).toBe('https://github.com/myproject');
    });
  });

  // 4. JWT Integrity & Forgery Defense
  describe('JWT Signature & Token Hardening', () => {
    it('should reject tampered JWT signatures', async () => {
      const [header, payload] = victimToken.split('.');
      const forgedToken = `${header}.${payload}.invalidsignature12345`;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid or expired/i);
    });

    it('should reject algorithm "none" unsigned token attacks', async () => {
      // Header with alg: "none"
      const noneHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const tokenPayload = victimToken.split('.')[1];
      const unsignedToken = `${noneHeader}.${tokenPayload}.`;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${unsignedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid or expired/i);
    });

    it('should reject expired JWT tokens', async () => {
      // Sign a token with negative expiration time
      const secret = process.env.JWT_SECRET || 'liinx_production_jwt_secret_key_8492048';
      const expiredToken = jwt.sign(
        { userId: 'usr_test', email: 'test@liinx.test', profileId: 'prf_test', username: 'test' },
        secret,
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid or expired/i);
    });
  });

  // 5. File Upload & MIME Spoofing Defense
  describe('File Upload Security & Path Traversal', () => {
    it('should reject non-image executable file uploads (.sh / script)', async () => {
      const scriptContent = Buffer.from('#!/bin/bash\necho "exploit"');
      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${victimToken}`)
        .attach('image', scriptContent, 'malicious.sh');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/only jpeg, png, webp/i);
    });

    it('should reject SVG files with embedded script tags', async () => {
      const svgContent = Buffer.from('<svg><script>alert("xss")</script></svg>');
      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${victimToken}`)
        .attach('image', svgContent, 'vector.svg');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/only jpeg, png, webp/i);
    });

    it('should accept genuine image uploads and generate safe random filename', async () => {
      // 1x1 valid PNG buffer
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64'
      );

      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${victimToken}`)
        .attach('image', pngBuffer, 'avatar.png');

      expect(res.status).toBe(201);
      expect(res.body.url).toMatch(/^\/uploads\/upload_[0-9]+-[a-z0-9]+\.png$/);
    });
  });

  // 6. DoS & Payload Bombing Defense
  describe('Payload Bombing Defense', () => {
    it('should reject payloads exceeding 2MB limit with 413', async () => {
      // Create a 3MB string
      const hugeString = 'A'.repeat(3 * 1024 * 1024);

      const res = await request(app)
        .post('/api/studio/profile')
        .set('Authorization', `Bearer ${victimToken}`)
        .send({ bio: hugeString });

      // Express body parser limit: 2mb -> status 413 Payload Too Large
      expect(res.status).toBe(413);
    });
  });
});
