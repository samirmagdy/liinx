import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';
import { signJwt } from '../server/auth.js';

describe('Custom domain tenant and lifecycle boundaries', () => {
  const suffix = Date.now();
  const userId = `usr_domain_51_${suffix}`;
  const profileId = `prf_domain_51_${suffix}`;
  const username = `domain51${suffix}`;
  const domain = `links-${suffix}.example.com`;
  let token = '';

  beforeAll(() => {
    initDatabase();
    const now = Date.now();
    db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(userId, `${username}@liinx.test`, 'hashed', now);
    db.prepare(`INSERT INTO profiles (id, user_id, username, display_name, plan, custom_domain, custom_domain_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'pro', ?, 1, ?, ?)`)
      .run(profileId, userId, username, 'Domain Fixture', domain, now, now);
    db.prepare(`INSERT INTO pages (id, profile_id, slug, title, description, sort_order, is_home, published, created_at, updated_at)
      VALUES (?, ?, 'home', 'Home', 'Public home', 0, 1, 1, ?, ?)`)
      .run(`page_domain_51_home_${suffix}`, profileId, now, now);
    const pageId = `page_domain_51_${suffix}`;
    db.prepare(`INSERT INTO pages (id, profile_id, slug, title, description, sort_order, is_home, published, created_at, updated_at)
      VALUES (?, ?, 'about', 'About', 'Public subpage', 1, 0, 1, ?, ?)`)
      .run(pageId, profileId, now, now);
    token = signJwt({ userId, email: `${username}@liinx.test`, profileId, username });
  });

  it('rejects malformed domains before persistence', async () => {
    for (const invalid of ['a..example.com', '-bad.example.com', '127.0.0.1', 'https://example.com/path']) {
      const response = await request(app).put('/api/studio/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ customDomain: invalid });
      expect(response.status).toBe(400);
    }
    const saved = db.prepare('SELECT custom_domain FROM profiles WHERE id = ?').get(profileId) as { custom_domain: string };
    expect(saved.custom_domain).toBe(domain);
  });

  it('routes verified root and published subpages only to the mapped tenant', async () => {
    const root = await request(app).get('/').set('Host', domain);
    expect(root.status).toBe(200);
    expect(root.body.username).toBe(username);
    expect(root.body.customDomain).toBe(domain);

    const subpage = await request(app).get('/about').set('Host', domain);
    expect(subpage.status).toBe(200);
    expect(subpage.body.username).toBe(username);
    expect(subpage.body.page.slug).toBe('about');

    const missing = await request(app).get('/missing').set('Host', domain);
    expect(missing.status).toBe(404);

    db.prepare('UPDATE profiles SET custom_domain_verified = 0 WHERE id = ?').run(profileId);
    const unverified = await request(app).get('/').set('Host', domain);
    expect(unverified.headers['x-custom-domain-user']).toBeUndefined();
    db.prepare('UPDATE profiles SET custom_domain_verified = 1 WHERE id = ?').run(profileId);
  });

  it('does not route a verified domain after a plan downgrade', async () => {
    db.prepare("UPDATE profiles SET plan = 'free' WHERE id = ?").run(profileId);
    const response = await request(app).get('/').set('Host', domain);
    expect(response.status).toBe(404);
    db.prepare("UPDATE profiles SET plan = 'pro' WHERE id = ?").run(profileId);
  });

  it('clears stale verification when DNS no longer matches', async () => {
    const response = await request(app).post('/api/studio/custom-domain/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ domain });
    expect(response.status).toBe(200);
    expect(response.body.tlsStatus).toBe('external_provider_required');
    expect(response.body.verified).toBe(false);
    const saved = db.prepare('SELECT custom_domain_verified FROM profiles WHERE id = ?').get(profileId) as { custom_domain_verified: number };
    expect(saved.custom_domain_verified).toBe(0);
  });
});
