import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';
import { signJwt } from '../server/auth.js';

describe('Milestone 6: Custom Domain Support & Host-Header Routing Engine (0% Fake Implementation)', () => {
  const freeUserId = 'usr_cd_free';
  const freeProfileId = 'prf_cd_free';
  const freeUsername = 'freecustomdomain';
  let freeToken = '';

  const proUserId = 'usr_cd_pro';
  const proProfileId = 'prf_cd_pro';
  const proUsername = 'procustomdomain';
  let proToken = '';

  const victimProfileId = 'prf_cd_victim';
  const victimUsername = 'victimdomain';

  beforeAll(() => {
    initDatabase();
    const now = Date.now();

    // 1. Free user
    db.prepare('DELETE FROM users WHERE id = ?').run(freeUserId);
    db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
      freeUserId, 'cdfree@liinx.test', 'hashed', now
    );
    db.prepare('DELETE FROM profiles WHERE id = ? OR username = ?').run(freeProfileId, freeUsername);
    db.prepare(`
      INSERT INTO profiles (id, user_id, username, display_name, plan, created_at, updated_at)
      VALUES (?, ?, ?, 'Free User', 'free', ?, ?)
    `).run(freeProfileId, freeUserId, freeUsername, now, now);

    freeToken = signJwt({
      userId: freeUserId,
      email: 'cdfree@liinx.test',
      profileId: freeProfileId,
      username: freeUsername
    });

    // 2. Pro user
    db.prepare('DELETE FROM users WHERE id = ?').run(proUserId);
    db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
      proUserId, 'cdpro@liinx.test', 'hashed', now
    );
    db.prepare('DELETE FROM profiles WHERE id = ? OR username = ?').run(proProfileId, proUsername);
    db.prepare(`
      INSERT INTO profiles (id, user_id, username, display_name, plan, created_at, updated_at)
      VALUES (?, ?, ?, 'Pro User', 'pro', ?, ?)
    `).run(proProfileId, proUserId, proUsername, now, now);

    proToken = signJwt({
      userId: proUserId,
      email: 'cdpro@liinx.test',
      profileId: proProfileId,
      username: proUsername
    });

    // 3. Existing victim profile with already mapped custom domain
    db.prepare('DELETE FROM profiles WHERE id = ? OR username = ? OR custom_domain = ?').run(
      victimProfileId, victimUsername, 'alreadytaken.com'
    );
    db.prepare(`
      INSERT INTO profiles (id, username, display_name, plan, custom_domain, created_at, updated_at)
      VALUES (?, ?, 'Victim', 'pro', 'alreadytaken.com', ?, ?)
    `).run(victimProfileId, victimUsername, now, now);
  });

  it('rejects custom domain attachment for free tier users (403)', async () => {
    const res = await request(app)
      .put('/api/studio/profile')
      .set('Authorization', `Bearer ${freeToken}`)
      .send({
        customDomain: 'links.freelancer.me'
      })
      .expect(403);

    expect(res.body.error).toMatch(/require a pro or studio/i);
  });

  it('rejects invalid domain formats (400)', async () => {
    const res = await request(app)
      .put('/api/studio/profile')
      .set('Authorization', `Bearer ${proToken}`)
      .send({
        customDomain: 'invalid_domain_without_tld'
      })
      .expect(400);

    expect(res.body.error).toMatch(/invalid domain format/i);
  });

  it('prevents domain collisions if domain is already claimed by another user (409)', async () => {
    const res = await request(app)
      .put('/api/studio/profile')
      .set('Authorization', `Bearer ${proToken}`)
      .send({
        customDomain: 'alreadytaken.com'
      })
      .expect(409);

    expect(res.body.error).toMatch(/already mapped to another liinx profile/i);
  });

  it('successfully binds custom domain to Pro user profile', async () => {
    const res = await request(app)
      .put('/api/studio/profile')
      .set('Authorization', `Bearer ${proToken}`)
      .send({
        customDomain: 'bio.procreator.studio'
      })
      .expect(200);

    expect(res.body.success).toBe(true);

    const studioRes = await request(app)
      .get('/api/studio/profile')
      .set('Authorization', `Bearer ${proToken}`)
      .expect(200);

    expect(studioRes.body.customDomain).toBe('bio.procreator.studio');
  });

  it('provides live DNS verification details via /api/studio/custom-domain/verify', async () => {
    const res = await request(app)
      .post('/api/studio/custom-domain/verify')
      .set('Authorization', `Bearer ${proToken}`)
      .send({
        domain: 'bio.procreator.studio'
      })
      .expect(200);

    expect(res.body.domain).toBe('bio.procreator.studio');
    expect(res.body.expectedTarget).toBe('cname.liinx.app');
    expect(res.body.message).toBeDefined();
  });

  it('resolves profile by custom domain via /api/profiles/by-domain/:domain', async () => {
    db.prepare('UPDATE profiles SET custom_domain_verified = 0 WHERE id = ?').run(proProfileId);
    await request(app).get('/api/profiles/by-domain/bio.procreator.studio').expect(404);
    // DNS verification is a prerequisite. The network-independent fixture models its result.
    db.prepare('UPDATE profiles SET custom_domain_verified = 1 WHERE id = ?').run(proProfileId);
    const res = await request(app)
      .get('/api/profiles/by-domain/bio.procreator.studio')
      .expect(307);

    expect(res.headers.location).toBe(`/api/profiles/${proUsername}`);
  });

  it('routes root request via host header to creator profile', async () => {
    const res = await request(app)
      .get('/')
      .set('Host', 'bio.procreator.studio')
      .expect(200);

    expect(res.body.username).toBe(proUsername);
    expect(res.body.displayName).toBe('Pro User');
    expect(res.body.customDomain).toBe('bio.procreator.studio');
  });
});
