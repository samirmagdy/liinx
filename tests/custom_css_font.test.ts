import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { db, initDatabase } from '../server/db';
import { signJwt } from '../server/auth';
import { profilesRouter } from '../server/routes/profiles';
import { app as serverApp } from '../server/server';

describe('Milestone 7: Custom CSS & Custom Font Engine (0% Fake Implementation)', () => {
  const app = express();
  app.use(express.json());
  app.use('/api', profilesRouter);

  const testUserId = 'usr_css_tester';
  const testProfileId = 'prf_css_tester';
  const testUsername = 'customcsstester';
  let token = '';

  beforeAll(() => {
    initDatabase();
    const now = Date.now();

    db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
    db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
      testUserId, 'css@liinx.test', 'hashed', now
    );

    db.prepare('DELETE FROM profiles WHERE id = ? OR username = ?').run(testProfileId, testUsername);
    db.prepare(`
      INSERT INTO profiles (id, user_id, username, display_name, plan, created_at, updated_at)
      VALUES (?, ?, ?, 'CSS Designer', 'studio', ?, ?)
    `).run(testProfileId, testUserId, testUsername, now, now);

    token = signJwt({
      userId: testUserId,
      email: 'css@liinx.test',
      profileId: testProfileId,
      username: testUsername
    });
  });

  it('allows creator to save custom CSS and custom font URL', async () => {
    const customCssCode = '#public-bio-view .custom-badge { font-weight: 900; letter-spacing: 0.1em; }';
    const customFont = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap';

    const updateRes = await request(app)
      .put('/api/studio/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customCss: customCssCode,
        customFontUrl: customFont
      })
      .expect(200);

    expect(updateRes.body.success).toBe(true);

    // Verify in studio profile endpoint
    const studioRes = await request(app)
      .get('/api/studio/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(studioRes.body.customCss).toBe(customCssCode);
    expect(studioRes.body.customFontUrl).toBe(customFont);

    // Verify in public profile endpoint
    const publicRes = await request(app)
      .get(`/api/profiles/${testUsername}`)
      .expect(200);

    expect(publicRes.body.customCss).toBe(customCssCode);
    expect(publicRes.body.customFontUrl).toBe(customFont);
  });

  it('rejects unsafe CSS, unscoped selectors, and font sources outside the CSP policy', async () => {
    await request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send({ customCss: '@import url(https://evil.example/style.css);' }).expect(400);
    await request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send({ customCss: '.public-header { display: none; }' }).expect(400);
    await request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send({ customCss: '#public-bio-view .x { position: fixed; z-index: 9999; }' }).expect(400);
    await request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send({ customFontUrl: 'https://fonts.example.test/font.css' }).expect(400);
  });

  it('keeps the CSP aligned with the supported Google Fonts source', async () => {
    const response = await request(serverApp).get('/api/health').expect(200);
    expect(response.headers['content-security-policy']).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
    expect(response.headers['content-security-policy']).toContain("font-src 'self' https://fonts.gstatic.com data:");
  });
});
