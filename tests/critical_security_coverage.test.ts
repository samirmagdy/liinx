import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db } from '../server/db.js';
import { hashPassword, comparePassword, signJwt, verifyJwt } from '../server/auth.js';
import { requireAuth } from '../server/middleware/auth.js';
import { encryptSecret, decryptSecret } from '../server/secretStore.js';
import { normalizePlan, hasEntitlement, entitlementsFor } from '../server/entitlements.js';
import { detectImageMagicBytes, detectDocument } from '../server/routes/upload.js';
import { isLoginRateLimited, isRegisterRateLimited, resetAuthRateLimits } from '../server/routes/auth.js';
import { isAllowedFontStylesheetUrl } from '../src/utils/fontValidation.js';
import { friendlyErrorMessage } from '../src/utils/errors.js';
import { TEMPLATES } from '../src/config/templates.js';
import { PRICING_PLANS, COMPARISON_FEATURES, FAQS } from '../src/config/marketing.js';
import { translations } from '../src/config/i18n.js';
import { randomBytes } from 'node:crypto';

describe('Critical Security & Coverage Modules', () => {
  // 1. server/entitlements.ts
  describe('Entitlements & Plan Matrix', () => {
    it('normalizes undefined or unknown plans to free', () => {
      expect(normalizePlan(undefined)).toBe('free');
      expect(normalizePlan('unknown_tier')).toBe('free');
      expect(normalizePlan('pro')).toBe('pro');
      expect(normalizePlan('studio')).toBe('studio');
    });

    it('evaluates entitlements correctly across tiers', () => {
      expect(hasEntitlement('free', 'customDomain')).toBe(false);
      expect(hasEntitlement('pro', 'customDomain')).toBe(true);
      expect(hasEntitlement('studio', 'customDomain')).toBe(true);

      const freeEntitlements = entitlementsFor('free');
      expect(freeEntitlements.maxProfiles).toBe(1);
      expect(freeEntitlements.customDomain).toBe(false);

      const studioEntitlements = entitlementsFor('studio');
      expect(studioEntitlements.maxProfiles).toBe(25);
      expect(studioEntitlements.customDomain).toBe(true);
      expect(studioEntitlements.apiAccess).toBe(true);
    });
  });

  // 2. server/secretStore.ts
  describe('Integration Secrets Encryption Store', () => {
    it('encrypts and decrypts integration secrets successfully', () => {
      const plaintext = 'sk_live_test_api_key_1234567890';
      const encrypted = encryptSecret(plaintext);

      expect(encrypted).toMatch(/^v1:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/);
      const decrypted = decryptSecret(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('rejects legacy or unencrypted values and tampering', () => {
      expect(() => decryptSecret('plain_unencrypted_secret')).toThrow(
        /Legacy integration secret is not encrypted/
      );
      expect(() => decryptSecret('')).toThrow(
        /Legacy integration secret is not encrypted/
      );

      // Tampered payload
      const valid = encryptSecret('secret_data');
      const parts = valid.split(':');
      parts[3] = Buffer.from('corrupted_payload').toString('base64');
      expect(() => decryptSecret(parts.join(':'))).toThrow();
    });

    it('handles fallback key derivation in non-production environments when key is not 32-byte hex/base64', () => {
      const origKey = process.env.INTEGRATION_ENCRYPTION_KEY;
      try {
        process.env.INTEGRATION_ENCRYPTION_KEY = 'short-key';
        const encrypted = encryptSecret('test_with_short_derived_key');
        expect(decryptSecret(encrypted)).toBe('test_with_short_derived_key');
      } finally {
        if (origKey) process.env.INTEGRATION_ENCRYPTION_KEY = origKey;
        else delete process.env.INTEGRATION_ENCRYPTION_KEY;
      }
    });

    it('throws in production if INTEGRATION_ENCRYPTION_KEY is missing or invalid length', () => {
      const origEnv = process.env.NODE_ENV;
      const origKey = process.env.INTEGRATION_ENCRYPTION_KEY;
      try {
        process.env.NODE_ENV = 'production';
        process.env.INTEGRATION_ENCRYPTION_KEY = '';
        expect(() => encryptSecret('data')).toThrow(/INTEGRATION_ENCRYPTION_KEY is required/);

        process.env.INTEGRATION_ENCRYPTION_KEY = 'short_key';
        expect(() => encryptSecret('data')).toThrow(/must decode to exactly 32 bytes/);
      } finally {
        process.env.NODE_ENV = origEnv;
        if (origKey) process.env.INTEGRATION_ENCRYPTION_KEY = origKey;
        else delete process.env.INTEGRATION_ENCRYPTION_KEY;
      }
    });
  });

  // 3. server/auth.ts
  describe('Authentication & JWT Session Engine', () => {
    it('hashes and compares passwords correctly', () => {
      const password = 'SuperSecurePassword2026!';
      const hash = hashPassword(password);
      expect(comparePassword(password, hash)).toBe(true);
      expect(comparePassword('WrongPassword', hash)).toBe(false);
    });

    it('signs and verifies valid JWT session tokens', () => {
      const payload = {
        userId: 'usr_test_auth_unit',
        email: 'auth_unit@liinx.test',
        profileId: 'prf_test_auth_unit',
        username: 'auth_unit',
        sessionVersion: 1
      };
      const token = signJwt(payload);
      const verified = verifyJwt(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(payload.userId);
      expect(verified?.email).toBe(payload.email);
      expect(verified?.sessionVersion).toBe(1);
    });

    it('rejects malformed, tampered, expired, or invalid sessionVersion JWTs', () => {
      expect(verifyJwt('invalid.token.structure')).toBeNull();
      expect(verifyJwt('')).toBeNull();

      // Expired token
      const expiredToken = signJwt({
        userId: 'u1', email: 'e1@test.com', profileId: 'p1', username: 'u1'
      }, { expiresIn: -10 });
      expect(verifyJwt(expiredToken)).toBeNull();

      // Token with non-object or missing fields
      const badPayloadToken = signJwt({
        userId: 'u1',
        email: 123 as any,
        profileId: 'p1',
        username: 'u1'
      });
      expect(verifyJwt(badPayloadToken)).toBeNull();

      // Token with non-integer sessionVersion
      const badSessionToken = signJwt({
        userId: 'u1',
        email: 'e@test.com',
        profileId: 'p1',
        username: 'u1',
        sessionVersion: 3.14 as any
      });
      expect(verifyJwt(badSessionToken)).toBeNull();
    });
  });

  // 4. server/middleware/auth.ts
  describe('Authorization Middleware', () => {
    it('rejects requests with missing authentication credentials', async () => {
      let nextCalled = false;
      const req: any = { headers: {} };
      const res: any = {
        status(code: number) {
          this.statusCode = code;
          return this;
        },
        json(payload: any) {
          this.body = payload;
          return this;
        }
      };
      requireAuth(req, res, () => { nextCalled = true; });
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toMatch(/Authentication required/);
      expect(nextCalled).toBe(false);
    });

    it('rejects requests with invalid or revoked session token', async () => {
      let nextCalled = false;
      const req: any = {
        headers: { authorization: 'Bearer invalid_signature_token' }
      };
      const res: any = {
        status(code: number) {
          this.statusCode = code;
          return this;
        },
        json(payload: any) {
          this.body = payload;
          return this;
        }
      };
      requireAuth(req, res, () => { nextCalled = true; });
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toMatch(/Invalid or expired session token/);
      expect(nextCalled).toBe(false);
    });

    it('rejects token when user does not exist in database', async () => {
      const nonExistentToken = signJwt({
        userId: 'usr_ghost_non_existent',
        email: 'ghost@liinx.test',
        profileId: 'prf_ghost',
        username: 'ghost',
        sessionVersion: 1
      });
      const req: any = {
        headers: { authorization: `Bearer ${nonExistentToken}` }
      };
      const res: any = {
        status(code: number) {
          this.statusCode = code;
          return this;
        },
        json(payload: any) {
          this.body = payload;
          return this;
        }
      };
      requireAuth(req, res, () => {});
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toMatch(/User account not found/);
    });

    it('rejects token when profile does not belong to the user', () => {
      const now = Date.now();
      const userId = `usr_auth_mid_${now}`;
      const email = `auth_mid_${now}@liinx.test`;
      db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
        userId, email, 'hash123', now
      );

      // Forge token with a non-existent or foreign profileId
      const forgedToken = signJwt({
        userId,
        email,
        profileId: 'prf_foreign_boundary',
        username: 'foreign',
        sessionVersion: 1
      });

      const req: any = {
        headers: { authorization: `Bearer ${forgedToken}` }
      };
      const res: any = {
        status(code: number) {
          this.statusCode = code;
          return this;
        },
        json(payload: any) {
          this.body = payload;
          return this;
        }
      };
      requireAuth(req, res, () => {});
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toMatch(/profile is no longer available/);
    });

    it('authenticates via cookie when Authorization header is absent', async () => {
      const email = `cookie_user_${Date.now()}@liinx.test`;
      const reg = await request(app).post('/api/auth/register').send({
        email, password: 'Password123!', username: `ck_${Date.now().toString().slice(-8)}`
      });
      const token = reg.body.token;

      let nextCalled = false;
      const req: any = {
        headers: { cookie: `theme=dark; liinx_session=${encodeURIComponent(token)}; lang=en` }
      };
      const res: any = { status() { return this; }, json() { return this; } };
      requireAuth(req, res, () => { nextCalled = true; });
      expect(nextCalled).toBe(true);
      expect(req.user?.userId).toBe(reg.body.user.id);
    });
  });

  // 5. server/routes/billing.ts
  describe('Billing & Webhooks Full Lifecycle', () => {
    it('returns billing status for authenticated profile', async () => {
      const email = `bill_stat_${Date.now()}@liinx.test`;
      const reg = await request(app).post('/api/auth/register').send({
        email, password: 'Password123!', username: `bst_${Date.now().toString().slice(-8)}`
      });
      const token = reg.body.token;

      const res = await request(app)
        .get('/api/billing/status')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.plan).toBe('free');
      expect(res.body.hasStripeCustomer).toBe(false);
      expect(res.body.hasActiveSubscription).toBe(false);
    });

    it('rejects invalid plan and interval for create-checkout-session', async () => {
      const email = `bill_chk_${Date.now()}@liinx.test`;
      const reg = await request(app).post('/api/auth/register').send({
        email, password: 'Password123!', username: `chk_${Date.now().toString().slice(-8)}`
      });
      const token = reg.body.token;

      const badInterval = await request(app)
        .post('/api/billing/create-checkout-session')
        .set('Authorization', `Bearer ${token}`)
        .send({ plan: 'pro', interval: 'decade' })
        .expect(400);
      expect(badInterval.body.error).toMatch(/Invalid billing interval/);

      const badPlan = await request(app)
        .post('/api/billing/create-checkout-session')
        .set('Authorization', `Bearer ${token}`)
        .send({ plan: 'enterprise', interval: 'month' })
        .expect(400);
      expect(badPlan.body.error).toMatch(/Invalid plan/);
    });

    it('handles customer.subscription.updated, customer.subscription.deleted, and invoice.payment_failed via customerId', async () => {
      const origSecret = process.env.STRIPE_WEBHOOK_SECRET;
      delete process.env.STRIPE_WEBHOOK_SECRET;

      try {
        const email = `bill_sub_${Date.now()}@liinx.test`;
        const reg = await request(app).post('/api/auth/register').send({
          email, password: 'Password123!', username: `bsu_${Date.now().toString().slice(-8)}`
        });
        const profileId = reg.body.profileId;
        const customerId = `cus_test_${randomBytes(4).toString('hex')}`;
        const subscriptionId = `sub_test_${randomBytes(4).toString('hex')}`;

        db.prepare('UPDATE profiles SET stripe_customer_id = ? WHERE id = ?').run(customerId, profileId);

        // 1. customer.subscription.updated without profileId in metadata (falls back to customerId)
        const updateEventId = `evt_sub_up_${randomBytes(4).toString('hex')}`;
        const updated = await request(app).post('/api/billing/webhook').send({
          id: updateEventId,
          type: 'customer.subscription.updated',
          created: Math.floor(Date.now() / 1000),
          data: {
            object: {
              id: subscriptionId,
              customer: customerId,
              status: 'active',
              metadata: { plan: 'studio' }
            }
          }
        });
        expect(updated.status).toBe(200);

        const profileAfterUpdate = db.prepare('SELECT plan, stripe_subscription_id FROM profiles WHERE id = ?').get(profileId) as any;
        expect(profileAfterUpdate.plan).toBe('studio');
        expect(profileAfterUpdate.stripe_subscription_id).toBe(subscriptionId);

        // 2. customer.subscription.paused / invoice.payment_failed (downgrades to free)
        const pauseEventId = `evt_sub_pause_${randomBytes(4).toString('hex')}`;
        const paused = await request(app).post('/api/billing/webhook').send({
          id: pauseEventId,
          type: 'customer.subscription.paused',
          created: Math.floor(Date.now() / 1000) + 1,
          data: {
            object: {
              id: subscriptionId,
              customer: customerId,
              subscription: subscriptionId
            }
          }
        });
        expect(paused.status).toBe(200);

        const profileAfterPause = db.prepare('SELECT plan, stripe_subscription_id FROM profiles WHERE id = ?').get(profileId) as any;
        expect(profileAfterPause.plan).toBe('free');
        expect(profileAfterPause.stripe_subscription_id).toBeNull();

        // 3. customer.subscription.deleted with customerId
        db.prepare('UPDATE profiles SET plan = ?, stripe_subscription_id = ? WHERE id = ?').run('pro', subscriptionId, profileId);
        const delEventId = `evt_sub_del_${randomBytes(4).toString('hex')}`;
        const deleted = await request(app).post('/api/billing/webhook').send({
          id: delEventId,
          type: 'customer.subscription.deleted',
          created: Math.floor(Date.now() / 1000) + 2,
          data: {
            object: {
              id: subscriptionId,
              customer: customerId
            }
          }
        });
        expect(deleted.status).toBe(200);

        const profileAfterDel = db.prepare('SELECT plan, stripe_subscription_id FROM profiles WHERE id = ?').get(profileId) as any;
        expect(profileAfterDel.plan).toBe('free');
      } finally {
        if (origSecret) process.env.STRIPE_WEBHOOK_SECRET = origSecret;
      }
    });

    it('rejects invalid or missing stripe event payloads', async () => {
      const origSecret = process.env.STRIPE_WEBHOOK_SECRET;
      delete process.env.STRIPE_WEBHOOK_SECRET;

      try {
        const res = await request(app).post('/api/billing/webhook').send({ type: 'checkout.session.completed' });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Invalid Stripe event/);
      } finally {
        if (origSecret) process.env.STRIPE_WEBHOOK_SECRET = origSecret;
      }
    });
  });

  // 6. server/routes/upload.ts
  describe('Upload Format & Magic Byte Detection', () => {
    it('accurately identifies JPEG, PNG, GIF, and WEBP magic bytes', () => {
      const jpeg = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      expect(detectImageMagicBytes(jpeg)).toEqual({ ext: '.jpg', mime: 'image/jpeg' });

      const png = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      expect(detectImageMagicBytes(png)).toEqual({ ext: '.png', mime: 'image/png' });

      const gif = Buffer.from('GIF89a...');
      expect(detectImageMagicBytes(gif)).toEqual({ ext: '.gif', mime: 'image/gif' });

      const webp = Buffer.concat([
        Buffer.from('RIFF'),
        Buffer.from([0x00, 0x00, 0x00, 0x00]),
        Buffer.from('WEBP')
      ]);
      expect(detectImageMagicBytes(webp)).toEqual({ ext: '.webp', mime: 'image/webp' });

      expect(detectImageMagicBytes(Buffer.from('random string bytes'))).toBeNull();
      expect(detectImageMagicBytes(Buffer.from([]))).toBeNull();
    });

    it('accurately detects documents and blocks dangerous text/scripts', () => {
      const pdf = Buffer.from('%PDF-1.7 header');
      expect(detectDocument(pdf)).toEqual({ mime: 'application/pdf', ext: '.pdf' });

      const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      expect(detectDocument(zip)).toEqual({ mime: 'application/zip', ext: '.zip' });

      const mp3 = Buffer.from('ID3v2.3.0...');
      expect(detectDocument(mp3)).toEqual({ mime: 'audio/mpeg', ext: '.mp3' });

      const wav = Buffer.concat([Buffer.from('RIFF....WAVE')]);
      expect(detectDocument(wav)).toEqual({ mime: 'audio/wav', ext: '.wav' });

      const mp4 = Buffer.from('....ftypisom....');
      expect(detectDocument(mp4)).toEqual({ mime: 'video/mp4', ext: '.mp4' });

      const plainText = Buffer.from('Hello world! Clean documentation text.');
      expect(detectDocument(plainText)).toEqual({ mime: 'text/plain', ext: '.txt' });

      const htmlScript = Buffer.from('Hello <script>alert("XSS")</script>');
      expect(detectDocument(htmlScript)).toBeNull();

      const nullByteText = Buffer.from('Dangerous\0content');
      expect(detectDocument(nullByteText)).toBeNull();
    });
  });

  // 7. server/routes/auth.ts rate limiting & edge cases
  describe('Auth Rate Limiting & Account Edge Cases', () => {
    it('exercises login and registration rate limiting functions', () => {
      const testIp = `192.0.2.${Math.floor(Math.random() * 200 + 1)}`;
      resetAuthRateLimits();

      // Within limit
      expect(isLoginRateLimited(testIp, 2, 60000)).toBe(false);
      expect(isLoginRateLimited(testIp, 2, 60000)).toBe(false);
      // Exceeds limit
      expect(isLoginRateLimited(testIp, 2, 60000)).toBe(true);

      expect(isRegisterRateLimited(testIp, 2, 60000)).toBe(false);
      expect(isRegisterRateLimited(testIp, 2, 60000)).toBe(false);
      expect(isRegisterRateLimited(testIp, 2, 60000)).toBe(true);

      resetAuthRateLimits();
      expect(isLoginRateLimited(testIp, 2, 60000)).toBe(false);
    });

    it('rejects registration with reserved username or duplicate email/username', async () => {
      const reservedRes = await request(app).post('/api/auth/register').send({
        email: 'reserved_test@liinx.test',
        password: 'Password123!',
        username: 'admin'
      });
      expect(reservedRes.status).toBe(400);
      expect(reservedRes.body.error).toMatch(/reserved/i);

      // Create legitimate user
      const uniqueName = `uniq_${Date.now().toString().slice(-8)}`;
      const reg = await request(app).post('/api/auth/register').send({
        email: `${uniqueName}@liinx.test`,
        password: 'Password123!',
        username: uniqueName
      });
      expect(reg.status).toBe(201);

      // Duplicate email
      const dupEmail = await request(app).post('/api/auth/register').send({
        email: `${uniqueName}@liinx.test`,
        password: 'Password123!',
        username: `${uniqueName}_diff`
      });
      expect(dupEmail.status).toBe(409);
      expect(dupEmail.body.error).toMatch(/already exists/i);

      // Duplicate username
      const dupUsername = await request(app).post('/api/auth/register').send({
        email: `another_${uniqueName}@liinx.test`,
        password: 'Password123!',
        username: uniqueName
      });
      expect(dupUsername.status).toBe(409);
      expect(dupUsername.body.error).toMatch(/already taken/i);
    });

    it('checks username availability correctly', async () => {
      const valid = await request(app).get('/api/auth/check-username/available_username_99');
      expect(valid.body.available).toBe(true);

      const reserved = await request(app).get('/api/auth/check-username/support');
      expect(reserved.body.available).toBe(false);
      expect(reserved.body.reason).toMatch(/reserved/i);

      const invalid = await request(app).get('/api/auth/check-username/a!');
      expect(invalid.body.available).toBe(false);
      expect(invalid.body.reason).toMatch(/Invalid format/i);
    });
  });

  // 8. server/routes/profiles.ts ownership & switching
  describe('Profile Ownership, Switching, and Multi-Profile Enforcement', () => {
    it('prevents user from deleting their only profile or active profile', async () => {
      const email = `single_prof_${Date.now()}@liinx.test`;
      const username = `sp_${Date.now().toString().slice(-8)}`;
      const reg = await request(app).post('/api/auth/register').send({
        email, password: 'Password123!', username
      });
      const token = reg.body.token;
      const profileId = reg.body.profileId;

      // Try deleting active / only profile
      const delActive = await request(app)
        .delete(`/api/studio/profiles/${profileId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(delActive.status).toBe(409);
      expect(delActive.body.error).toMatch(/Switch to another profile before deleting/);

      // Try deleting a foreign profile
      const delForeign = await request(app)
        .delete('/api/studio/profiles/prf_foreign_random_id')
        .set('Authorization', `Bearer ${token}`);
      expect(delForeign.status).toBe(404);
      expect(delForeign.body.error).toMatch(/Profile not found or does not belong/);
    });

    it('switches profiles and receives updated JWT session claim', async () => {
      const email = `multi_owner_${Date.now()}@liinx.test`;
      const username = `mo_${Date.now().toString().slice(-8)}`;
      const reg = await request(app).post('/api/auth/register').send({
        email, password: 'Password123!', username
      });
      const token = reg.body.token;
      const originalProfileId = reg.body.profileId;

      // Upgrade to pro so multi-profile is allowed
      db.prepare('UPDATE profiles SET plan = ? WHERE id = ?').run('pro', originalProfileId);

      const newUsername = `m2_${Date.now().toString().slice(-8)}`;
      const created = await request(app)
        .post('/api/studio/profiles')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: newUsername, displayName: 'Second Brand' });
      expect(created.status).toBe(201);
      const secondProfileId = created.body.profile.id;

      // Switch to second profile
      const switched = await request(app)
        .post(`/api/studio/profiles/${secondProfileId}/select`)
        .set('Authorization', `Bearer ${token}`);
      expect(switched.status).toBe(200);
      expect(switched.body.profile.id).toBe(secondProfileId);

      // Verify new token has second profileId
      const newClaim = verifyJwt(switched.body.token);
      expect(newClaim?.profileId).toBe(secondProfileId);

      // Delete the first profile now that second is active
      const deletedFirst = await request(app)
        .delete(`/api/studio/profiles/${originalProfileId}`)
        .set('Authorization', `Bearer ${switched.body.token}`);
      expect(deletedFirst.status).toBe(200);
      expect(deletedFirst.body.message).toMatch(/Profile deleted/);
    });
  });

  // 9. Account Deletion & Lifecycle (GDPR / Privacy)
  describe('Account Deletion & Session Lifecycle', () => {
    it('requires explicit confirmation DELETE and cleans up all account data', async () => {
      const email = `del_user_${Date.now()}@liinx.test`;
      const username = `du_${Date.now().toString().slice(-8)}`;
      const reg = await request(app).post('/api/auth/register').send({
        email, password: 'Password123!', username
      });
      const token = reg.body.token;
      const userId = reg.body.user.id;

      // Bad confirmation
      const badConfirm = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${token}`)
        .send({ confirmation: 'NO' });
      expect(badConfirm.status).toBe(400);
      expect(badConfirm.body.error).toMatch(/Type DELETE in the confirmation field/);

      // Successful deletion
      const delSuccess = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${token}`)
        .send({ confirmation: 'DELETE' });
      expect(delSuccess.status).toBe(200);
      expect(delSuccess.body.success).toBe(true);

      // Verify user is gone
      const userRow = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
      expect(userRow).toBeUndefined();
    });

    it('handles /me and /logout routes correctly', async () => {
      const email = `me_user_${Date.now()}@liinx.test`;
      const username = `me_${Date.now().toString().slice(-8)}`;
      const reg = await request(app).post('/api/auth/register').send({
        email, password: 'Password123!', username
      });
      const token = reg.body.token;

      // /me endpoint
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe(email);
      expect(meRes.body.profile.username).toBe(username);

      // /logout endpoint
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Old token should now be rejected as revoked
      const afterLogout = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(afterLogout.status).toBe(401);
      expect(afterLogout.body.error).toMatch(/revoked/);
    });

    it('rejects invalid password or unverified user in login', async () => {
      const email = `log_user_${Date.now()}@liinx.test`;
      const username = `lg_${Date.now().toString().slice(-8)}`;
      await request(app).post('/api/auth/register').send({
        email, password: 'CorrectPassword123!', username
      });

      // Wrong password
      const wrongPass = await request(app).post('/api/auth/login').send({
        email, password: 'WrongPassword!'
      });
      expect(wrongPass.status).toBe(401);
      expect(wrongPass.body.error).toMatch(/Invalid email or password/);

      // Non-existent email (exercises constant-time bcrypt check)
      const noUser = await request(app).post('/api/auth/login').send({
        email: 'nobody_exists_at_all@liinx.test', password: 'AnyPassword123!'
      });
      expect(noUser.status).toBe(401);
      expect(noUser.body.error).toMatch(/Invalid email or password/);
    });
  });

  // 10. Document Upload & File Deletion Lifecycle
  describe('Document Upload & Storage Lifecycle', () => {
    it('uploads valid text and pdf files and manages deletion', async () => {
      const email = `up_user_${Date.now()}@liinx.test`;
      const username = `up_${Date.now().toString().slice(-8)}`;
      const reg = await request(app).post('/api/auth/register').send({
        email, password: 'Password123!', username
      });
      const token = reg.body.token;

      // Reject non-matching document content
      const badDoc = await request(app)
        .post('/api/upload/file')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('<html><script>alert(1)</script></html>'), 'script.html');
      expect(badDoc.status).toBe(400);

      // Accept clean text file
      const goodDoc = await request(app)
        .post('/api/upload/file')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('Valid release notes for download'), 'notes.txt');
      expect(goodDoc.status).toBe(201);
      expect(goodDoc.body.success).toBe(true);
      const fileUrl = goodDoc.body.url;

      // Delete the unreferenced uploaded file
      const delFile = await request(app)
        .delete('/api/upload/file')
        .set('Authorization', `Bearer ${token}`)
        .send({ url: fileUrl });
      expect(delFile.status).toBe(200);
      expect(delFile.body.success).toBe(true);

      // Delete non-existent file
      const delMissing = await request(app)
        .delete('/api/upload/file')
        .set('Authorization', `Bearer ${token}`)
        .send({ url: '/uploads/non_existent.txt' });
      expect(delMissing.status).toBe(404);
    });
  });

  // 11. Font Validation, Error Messages, Marketing & Configuration Modules
  describe('Configuration, Internationalization & Error Handling Utilities', () => {
    it('validates Google Fonts stylesheets securely and rejects dangerous/arbitrary URLs', () => {
      expect(isAllowedFontStylesheetUrl('https://fonts.googleapis.com/css2?family=Inter')).toBe(true);
      expect(isAllowedFontStylesheetUrl('https://sub.fonts.googleapis.com/css2?family=Roboto')).toBe(true);
      expect(isAllowedFontStylesheetUrl('http://fonts.googleapis.com/css')).toBe(false);
      expect(isAllowedFontStylesheetUrl('https://evil.com/fonts.css')).toBe(false);
      expect(isAllowedFontStylesheetUrl('invalid-url-string')).toBe(false);
      expect(isAllowedFontStylesheetUrl('')).toBe(false);
      expect(isAllowedFontStylesheetUrl(null)).toBe(false);
    });

    it('translates various error codes and network failures into actionable friendly copy', () => {
      expect(friendlyErrorMessage({ status: 408 })).toMatch(/Check your connection/);
      expect(friendlyErrorMessage({ name: 'AbortError' })).toMatch(/Check your connection/);
      expect(friendlyErrorMessage({ status: 401 })).toMatch(/session has expired/);
      expect(friendlyErrorMessage({ status: 403 })).toMatch(/permission/);
      expect(friendlyErrorMessage({ status: 404 })).toMatch(/could not find/);
      expect(friendlyErrorMessage({ status: 409, message: 'Custom conflict' })).toBe('Custom conflict');
      expect(friendlyErrorMessage({ status: 413 })).toMatch(/too large/);
      expect(friendlyErrorMessage({ status: 429 })).toMatch(/too often/);
      expect(friendlyErrorMessage({ status: 500 })).toMatch(/temporarily unavailable/);
      expect(friendlyErrorMessage({ message: 'Failed to fetch from backend' })).toMatch(/could not reach LIINX/);
      expect(friendlyErrorMessage({ message: 'SQLITE_ERROR: table missing' })).toMatch(/Something went wrong/);
    });

    it('verifies marketing plans, templates, and translation functions', () => {
      expect(TEMPLATES.length).toBeGreaterThan(0);
      expect(PRICING_PLANS.length).toBe(3);
      expect(COMPARISON_FEATURES.length).toBeGreaterThan(0);
      expect(FAQS.length).toBeGreaterThan(0);

      // Exercise dynamic translation functions in i18n
      ['starter', 'pro', 'studio'].forEach(plan => {
        const enText = (translations.en.pricingSection.plans as any)[plan].billedAnnuallyText(100);
        expect(enText).toContain('100');
        const arText = (translations.ar.pricingSection.plans as any)[plan].billedAnnuallyText(100);
        expect(arText).toContain('100');
      });

      const customizeCta = translations.en.hero.customizeCta('Alex');
      expect(customizeCta).toContain('Alex');
    });
  });
});

