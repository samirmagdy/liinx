import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { db, initDatabase } from '../server/db';
import { signJwt } from '../server/auth';
import { profilesRouter } from '../server/routes/profiles';

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
});
