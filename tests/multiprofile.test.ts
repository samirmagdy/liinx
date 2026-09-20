import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { db, initDatabase } from '../server/db';
import { signJwt } from '../server/auth';
import { profilesRouter } from '../server/routes/profiles';

describe('Milestone 5: Multi-Profile Management (One Login) (0% Fake Implementation)', () => {
  const app = express();
  app.use(express.json());
  app.use('/api', profilesRouter);

  const testUserId = 'usr_multi_owner';
  const testEmail = 'multicreator@liinx.test';

  const freeProfileId = 'prf_free_multi';
  const freeUsername = 'freecreator';

  const proUserId = 'usr_pro_multi_owner';
  const proEmail = 'promulti@liinx.test';
  const proProfileId = 'prf_pro_multi';
  const proUsername = 'promulticreator';

  let freeToken = '';
  let proToken = '';

  beforeAll(() => {
    initDatabase();
    const now = Date.now();

    // 1. Setup Free User
    db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
    db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
      testUserId, testEmail, 'hashed_pw', now
    );

    db.prepare('DELETE FROM blocks WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = ? OR id = ? OR username = ?)').run(testUserId, freeProfileId, freeUsername);
    db.prepare('DELETE FROM pages WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = ? OR id = ? OR username = ?)').run(testUserId, freeProfileId, freeUsername);
    db.prepare('DELETE FROM profiles WHERE user_id = ? OR id = ? OR username = ?').run(testUserId, freeProfileId, freeUsername);
    db.prepare(`
      INSERT INTO profiles (id, user_id, username, display_name, plan, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'free', ?, ?)
    `).run(freeProfileId, testUserId, freeUsername, 'Free Creator', now, now);

    freeToken = signJwt({
      userId: testUserId,
      email: testEmail,
      profileId: freeProfileId,
      username: freeUsername
    });

    // 2. Setup Pro User
    db.prepare('DELETE FROM users WHERE id = ?').run(proUserId);
    db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
      proUserId, proEmail, 'hashed_pw', now
    );
    db.prepare("UPDATE users SET subscription_plan = 'pro' WHERE id = ?").run(proUserId);

    db.prepare('DELETE FROM blocks WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = ? OR id = ? OR username = ? OR username = ?)').run(proUserId, proProfileId, proUsername, 'brand2pro');
    db.prepare('DELETE FROM pages WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = ? OR id = ? OR username = ? OR username = ?)').run(proUserId, proProfileId, proUsername, 'brand2pro');
    db.prepare('DELETE FROM profiles WHERE user_id = ? OR id = ? OR username = ? OR username = ?').run(proUserId, proProfileId, proUsername, 'brand2pro');
    db.prepare(`
      INSERT INTO profiles (id, user_id, username, display_name, plan, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'pro', ?, ?)
    `).run(proProfileId, proUserId, proUsername, 'Pro Creator', now, now);

    proToken = signJwt({
      userId: proUserId,
      email: proEmail,
      profileId: proProfileId,
      username: proUsername
    });
  });

  it('lists all profiles associated with the logged in user', async () => {
    const res = await request(app)
      .get('/api/studio/profiles')
      .set('Authorization', `Bearer ${freeToken}`)
      .expect(200);

    expect(res.body.profiles).toBeDefined();
    expect(res.body.profiles.length).toBe(1);
    expect(res.body.profiles[0].username).toBe(freeUsername);
    expect(res.body.activeProfileId).toBe(freeProfileId);
  });

  it('enforces plan limits: free tier user cannot create additional profiles (403)', async () => {
    const res = await request(app)
      .post('/api/studio/profiles')
      .set('Authorization', `Bearer ${freeToken}`)
      .send({
        username: 'secondaryhandle',
        displayName: 'Secondary Brand'
      })
      .expect(403);

    expect(res.body.error).toMatch(/allows up to 1/i);
  });

  it('allows Pro user to create multiple profiles under one account', async () => {
    const res = await request(app)
      .post('/api/studio/profiles')
      .set('Authorization', `Bearer ${proToken}`)
      .send({
        username: 'brand2pro',
        displayName: 'Second Brand'
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.profile.username).toBe('brand2pro');
    expect(res.body.token).toBeDefined();

    // Verify user now has 2 profiles
    const listRes = await request(app)
      .get('/api/studio/profiles')
      .set('Authorization', `Bearer ${proToken}`)
      .expect(200);

    expect(listRes.body.profiles.length).toBe(2);
    const usernames = listRes.body.profiles.map((p: any) => p.username);
    expect(usernames).toContain(proUsername);
    expect(usernames).toContain('brand2pro');
  });

  it('switches active profile and returns an updated valid JWT', async () => {
    // Get list of pro profiles
    const listRes = await request(app)
      .get('/api/studio/profiles')
      .set('Authorization', `Bearer ${proToken}`)
      .expect(200);

    const secondProfile = listRes.body.profiles.find((p: any) => p.username === 'brand2pro');
    expect(secondProfile).toBeDefined();

    // Switch to second profile
    const selectRes = await request(app)
      .post(`/api/studio/profiles/${secondProfile.id}/select`)
      .set('Authorization', `Bearer ${proToken}`)
      .expect(200);

    expect(selectRes.body.success).toBe(true);
    expect(selectRes.body.token).toBeDefined();
    expect(selectRes.body.profile.username).toBe('brand2pro');

    // Use newly returned token to query studio profile and verify context switched
    const studioRes = await request(app)
      .get('/api/studio/profile')
      .set('Authorization', `Bearer ${selectRes.body.token}`)
      .expect(200);

    expect(studioRes.body.id).toBe(secondProfile.id);
    expect(studioRes.body.username).toBe('brand2pro');
  });

  it('prevents IDOR: user cannot switch to another user\'s profile (404)', async () => {
    // Free user attempts to switch to Pro user's profile
    const res = await request(app)
      .post(`/api/studio/profiles/${proProfileId}/select`)
      .set('Authorization', `Bearer ${freeToken}`)
      .expect(404);

    expect(res.body.error).toMatch(/not found or does not belong/i);
  });
});
