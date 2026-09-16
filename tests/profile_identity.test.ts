import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';

describe('profile identity editor', () => {
  it('validates identity fields, handles Arabic text, and updates the public handle', async () => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const first = await request(app).post('/api/auth/register').send({ email: `identity-${unique}@liinx.test`, password: 'IdentityPassword2026!', username: `identity${unique}`.slice(0, 30) }).expect(201);
    const token = first.body.token as string;
    const oldUsername = first.body.user.username as string;
    const second = await request(app).post('/api/auth/register').send({ email: `taken-${unique}@liinx.test`, password: 'IdentityPassword2026!', username: `taken${unique}`.slice(0, 30) }).expect(201);
    const takenUsername = second.body.user.username as string;
    const auth = (body: Record<string, unknown>) => request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send(body);

    await auth({ displayName: '' }).expect(400);
    await auth({ displayName: 'x'.repeat(101) }).expect(400);
    await auth({ bio: 'سيرة ذاتية عربية مع نص mixed direction English 123', category: 'مبدع' }).expect(200);
    await auth({ username: takenUsername }).expect(409);

    const nextUsername = `newidentity${unique}`.slice(0, 30);
    const renamed = await auth({ username: nextUsername }).expect(200);
    expect(renamed.body.token).toBeTruthy();
    await request(app).get(`/api/profiles/${oldUsername}`).expect(404);
    const publicProfile = await request(app).get(`/api/profiles/${nextUsername}`).expect(200);
    expect(publicProfile.body.username).toBe(nextUsername);
    expect(publicProfile.body.bio).toContain('عربية');
  });

  it('rejects stale identity saves and keeps a missing avatar renderable by fallback UI', async () => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const registration = await request(app).post('/api/auth/register').send({ email: `identity-stale-${unique}@liinx.test`, password: 'IdentityPassword2026!', username: `stalidentity${unique}`.slice(0, 30) }).expect(201);
    const token = registration.body.token as string;
    const auth = (body: Record<string, unknown>) => request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send(body);
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    await auth({ displayName: 'First save', revision: studio.body.revision }).expect(200);
    await auth({ displayName: 'Stale save', revision: studio.body.revision }).expect(409);
    await auth({ avatarUrl: 'https://invalid.example.test/missing-avatar.png' }).expect(200);
    const publicProfile = await request(app).get(`/api/profiles/${registration.body.user.username}`).expect(200);
    expect(publicProfile.body.avatarUrl).toContain('invalid.example.test');
  });
});
