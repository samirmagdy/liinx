import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';

describe('Task 53 analytics consent and external pixels', () => {
  const suffix = Date.now();
  let token = '';
  let username = '';
  let profileId = '';

  beforeAll(async () => {
    initDatabase();
    username = `consent_${suffix}`;
    const response = await request(app).post('/api/auth/register').send({
      email: `consent-${suffix}@liinx.test`, password: 'Password123!', username
    });
    token = response.body.token;
    profileId = response.body.profileId;
    db.prepare('UPDATE profiles SET plan = ? WHERE id = ?').run('pro', profileId);
  });

  it('rejects malformed provider ids and accepts only the documented shapes', async () => {
    const invalid = await request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send({
      gaMeasurementId: 'javascript:send-data', metaPixelId: 'pixel-id'
    });
    expect(invalid.status).toBe(400);

    const valid = await request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send({
      gaMeasurementId: 'G-12345ABCDE', metaPixelId: '987654321012345'
    });
    expect(valid.status).toBe(200);
  });

  it('applies entitlement gating and does not expose ids for a free public profile', async () => {
    db.prepare('UPDATE profiles SET plan = ? WHERE id = ?').run('free', profileId);
    const publicResponse = await request(app).get(`/api/profiles/${username}`);
    expect(publicResponse.status).toBe(200);
    expect(publicResponse.body.gaMeasurementId).toBeNull();
    expect(publicResponse.body.metaPixelId).toBeNull();

    const blocked = await request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send({
      gaMeasurementId: 'G-12345ABCDE'
    });
    expect(blocked.status).toBe(403);
  });

  it('allows only intended third-party script/connect sources in the application CSP', async () => {
    const response = await request(app).get('/api/health');
    const csp = response.headers['content-security-policy'];
    expect(csp).toContain('https://www.googletagmanager.com');
    expect(csp).toContain('https://connect.facebook.net');
    expect(csp).toContain('https://www.google-analytics.com');
    expect(csp).not.toContain("script-src *");
    expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+'/);
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  });
});
