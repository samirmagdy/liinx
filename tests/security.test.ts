import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';
import { normalizeRequestId } from '../server/utils/ids.js';

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

  // 7. Content Security Policy (CSP) & Browser Security Hardening
  describe('Content Security Policy & Browser Security Hardening', () => {
    it('should include cryptographic per-request nonce in script-src and disallow unsafe-inline for scripts', async () => {
      const res1 = await request(app).get('/api/health');
      const res2 = await request(app).get('/api/health');

      const csp1 = res1.headers['content-security-policy'];
      const csp2 = res2.headers['content-security-policy'];

      expect(csp1).toBeDefined();
      expect(csp2).toBeDefined();

      // Extract nonces
      const match1 = csp1.match(/script-src 'self' 'nonce-([A-Za-z0-9+/=]+)'/);
      const match2 = csp2.match(/script-src 'self' 'nonce-([A-Za-z0-9+/=]+)'/);

      expect(match1).not.toBeNull();
      expect(match2).not.toBeNull();
      expect(match1![1]).toBeTypeOf('string');
      expect(match1![1].length).toBeGreaterThan(16);

      // Verify each request gets a fresh, unique cryptographic nonce
      expect(match1![1]).not.toBe(match2![1]);

      // Ensure script-src NEVER allows unsafe-inline
      const scriptSrcDirective = csp1.split(';').find((d: string) => d.trim().startsWith('script-src'));
      expect(scriptSrcDirective).toBeDefined();
      expect(scriptSrcDirective).not.toContain("'unsafe-inline'");

      // Verify required third-party services in script-src
      expect(scriptSrcDirective).toContain('https://www.googletagmanager.com');
      expect(scriptSrcDirective).toContain('https://connect.facebook.net');
    });

    it('should maintain frame-src and connect-src for legitimate integrations without wildcards', async () => {
      const res = await request(app).get('/api/health');
      const csp = res.headers['content-security-policy'];

      // frame-src
      const frameSrcDirective = csp.split(';').find((d: string) => d.trim().startsWith('frame-src'));
      expect(frameSrcDirective).toBeDefined();
      expect(frameSrcDirective).toContain('https://www.youtube.com');
      expect(frameSrcDirective).toContain('https://www.youtube-nocookie.com');
      expect(frameSrcDirective).toContain('https://open.spotify.com');
      expect(frameSrcDirective).toContain('https://player.vimeo.com');
      expect(frameSrcDirective).toContain('https://w.soundcloud.com');
      expect(frameSrcDirective).toContain('https://calendly.com');
      expect(frameSrcDirective).toContain('https://embed.music.apple.com');
      expect(frameSrcDirective).not.toContain('*');

      // connect-src
      const connectSrcDirective = csp.split(';').find((d: string) => d.trim().startsWith('connect-src'));
      expect(connectSrcDirective).toBeDefined();
      expect(connectSrcDirective).toContain('https://api.qrserver.com');
      expect(connectSrcDirective).toContain('https://www.google-analytics.com');
      expect(connectSrcDirective).toContain('https://graph.instagram.com');
      expect(connectSrcDirective).toContain('https://api.instagram.com');
      expect(connectSrcDirective).not.toContain('*');

      // report-uri
      expect(csp).toContain('report-uri /api/csp-report');
    });

    it('should verify standard browser security headers are present', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(res.headers['x-dns-prefetch-control']).toBe('off');
      expect(res.headers['cross-origin-opener-policy']).toBe('same-origin-allow-popups');
      expect(res.headers['cross-origin-resource-policy']).toBe('same-site');
    });

    it('should accept and log CSP violation reports at /api/csp-report', async () => {
      const violationPayload = {
        'csp-report': {
          'document-uri': 'https://liinx.app/@creator',
          'referrer': '',
          'violated-directive': 'script-src',
          'effective-directive': 'script-src',
          'original-policy': "default-src 'self'",
          'disposition': 'enforce',
          'blocked-uri': 'inline',
          'line-number': 1,
          'source-file': 'https://liinx.app/@creator',
          'status-code': 200,
          'script-sample': ''
        }
      };

      const res = await request(app)
        .post('/api/csp-report')
        .send(violationPayload);

      expect(res.status).toBe(204);
    });
  });

  // 8. Request Correlation ID Normalization & Header Hardening
  describe('Request Correlation ID Normalization & Header Hardening', () => {
    it('normalizes valid request IDs correctly', () => {
      expect(normalizeRequestId('valid-id-123')).toBe('valid-id-123');
      expect(normalizeRequestId('req_a1b2.c3-d4_99')).toBe('req_a1b2.c3-d4_99');
      expect(normalizeRequestId('A'.repeat(64))).toBe('A'.repeat(64));
    });

    it('generates a fresh ID when input is empty or whitespace', () => {
      const empty = normalizeRequestId('');
      expect(empty).toMatch(/^req_[a-f0-9-]+$/i);

      const whitespace = normalizeRequestId('   ');
      expect(whitespace).toMatch(/^req_[a-f0-9-]+$/i);

      const nullish = normalizeRequestId(null);
      expect(nullish).toMatch(/^req_[a-f0-9-]+$/i);

      const undefinedVal = normalizeRequestId(undefined);
      expect(undefinedVal).toMatch(/^req_[a-f0-9-]+$/i);
    });

    it('rejects oversized 10KB request IDs and replaces with a secure ID', () => {
      const hugeId = 'x'.repeat(10 * 1024);
      const result = normalizeRequestId(hugeId);
      expect(result).not.toBe(hugeId);
      expect(result).toMatch(/^req_[a-f0-9-]+$/i);
    });

    it('rejects request IDs containing newlines or control characters', () => {
      const crlfId = 'req-123\r\nInjected-Header: evil';
      const resultCrlf = normalizeRequestId(crlfId);
      expect(resultCrlf).not.toContain('\r');
      expect(resultCrlf).not.toContain('\n');
      expect(resultCrlf).toMatch(/^req_[a-f0-9-]+$/i);

      const tabId = 'req\t123';
      const resultTab = normalizeRequestId(tabId);
      expect(resultTab).toMatch(/^req_[a-f0-9-]+$/i);
    });

    it('rejects unicode edge cases and malformed characters', () => {
      const unicodeId = 'req_🔥_test';
      const resultUnicode = normalizeRequestId(unicodeId);
      expect(resultUnicode).toMatch(/^req_[a-f0-9-]+$/i);

      const xssId = '<script>alert(1)</script>';
      const resultXss = normalizeRequestId(xssId);
      expect(resultXss).toMatch(/^req_[a-f0-9-]+$/i);

      const quoteId = 'req" OR 1=1 --';
      const resultQuote = normalizeRequestId(quoteId);
      expect(resultQuote).toMatch(/^req_[a-f0-9-]+$/i);
    });

    it('handles header array values safely', () => {
      const validArray = ['safe-array-id-123'];
      expect(normalizeRequestId(validArray)).toBe('safe-array-id-123');

      const invalidArray = ['<script>evil</script>'];
      expect(normalizeRequestId(invalidArray)).toMatch(/^req_[a-f0-9-]+$/i);

      const emptyArray: string[] = [];
      expect(normalizeRequestId(emptyArray)).toMatch(/^req_[a-f0-9-]+$/i);
    });

    it('middleware rejects malicious X-Request-Id and outputs a sanitized req ID', async () => {
      const maliciousId = '<script>alert(1)</script>';
      const res = await request(app)
        .get('/api/health')
        .set('X-Request-Id', maliciousId);

      const headerVal = res.headers['x-request-id'];
      expect(headerVal).toBeDefined();
      expect(headerVal).not.toContain('<script>');
      expect(headerVal).toMatch(/^req_[a-f0-9-]+$/i);
    });

    it('middleware echoes valid X-Request-Id for distributed tracing', async () => {
      const validTraceId = 'trace.12345-abcde_v1';
      const res = await request(app)
        .get('/api/health')
        .set('X-Request-Id', validTraceId);

      expect(res.headers['x-request-id']).toBe(validTraceId);
    });

    it('middleware generates safe ID when X-Request-Id is 10KB long', async () => {
      const hugeId = 'A'.repeat(10240);
      const res = await request(app)
        .get('/api/health')
        .set('X-Request-Id', hugeId);

      const headerVal = res.headers['x-request-id'];
      expect(headerVal).toBeDefined();
      expect(headerVal.length).toBeLessThan(100);
      expect(headerVal).toMatch(/^req_[a-f0-9-]+$/i);
    });
  });
});
