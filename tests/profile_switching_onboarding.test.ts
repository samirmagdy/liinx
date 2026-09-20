import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';

describe('profile switching and onboarding', () => {
  beforeAll(() => initDatabase());

  it('onboards to a public Home page and isolates switched profile data', async () => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const registration = await request(app).post('/api/auth/register').send({
      email: `onboarding-${unique}@raloa.test`, password: 'OnboardingPassword2026!', username: `onboard${unique}`.slice(0, 30)
    }).expect(201);
    const firstToken = registration.body.token as string;
    const firstId = registration.body.profileId as string;
    const username = registration.body.user.username as string;
    const firstStudio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${firstToken}`).expect(200);
    const firstHome = firstStudio.body.pages.find((page: any) => page.isHome);
    expect(firstHome?.id).toBeTruthy();
    await request(app).get(`/api/profiles/${username}`).expect(200);

    db.prepare("UPDATE users SET subscription_plan = 'pro' WHERE id = (SELECT user_id FROM profiles WHERE id = ?)").run(firstId);
    const created = await request(app).post('/api/studio/profiles').set('Authorization', `Bearer ${firstToken}`).send({ username: `second${unique}`.slice(0, 30), displayName: 'Second Profile' }).expect(201);
    const secondId = created.body.profile.id as string;
    const now = Date.now();
    db.prepare('INSERT INTO newsletter_subscribers (id, profile_id, email, created_at) VALUES (?, ?, ?, ?)').run(`subscriber_${unique}`, firstId, 'first@example.test', now);
    db.prepare('INSERT INTO form_submissions (id, profile_id, fields_json, created_at) VALUES (?, ?, ?, ?)').run(`submission_${unique}`, firstId, '{}', now);

    const switched = await request(app).post(`/api/studio/profiles/${secondId}/select`).set('Authorization', `Bearer ${firstToken}`).expect(200);
    const switchedProfile = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${switched.body.token}`).expect(200);
    expect(switchedProfile.body.id).toBe(secondId);
    expect(switchedProfile.body.blocks.every((block: any) => block.profileId !== firstId)).toBe(true);
    expect((await request(app).get('/api/studio/subscribers').set('Authorization', `Bearer ${switched.body.token}`).expect(200)).body.subscribers).toHaveLength(0);
    expect((await request(app).get('/api/studio/form-submissions').set('Authorization', `Bearer ${switched.body.token}`).expect(200)).body.submissions).toHaveLength(0);

    const failedSwitch = await request(app).post('/api/studio/profiles/not-owned').set('Authorization', `Bearer ${switched.body.token}`).expect(404);
    expect(failedSwitch.body.error).toMatch(/not found|belong/i);
    expect((await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${switched.body.token}`).expect(200)).body.id).toBe(secondId);

    await request(app).delete(`/api/studio/profiles/${firstId}`).set('Authorization', `Bearer ${switched.body.token}`).expect(200);
    await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${firstToken}`).expect(401);
    await request(app).delete(`/api/studio/profiles/${secondId}`).set('Authorization', `Bearer ${switched.body.token}`).expect(409);
    expect(db.prepare('SELECT id FROM profiles WHERE id = ?').get(firstId)).toBeUndefined();
  });
});
