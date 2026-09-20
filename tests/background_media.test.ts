import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';

describe('background media', () => {
  it('enforces the paid entitlement and persists safe image/video settings', async () => {
    const id = `${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
    const registration = await request(app).post('/api/auth/register').send({ email: `background-${id}@raloa.test`, password: 'BackgroundPassword2026!', username: `background${id}`.slice(0, 30) }).expect(201);
    const token = registration.body.token as string;
    const auth = (body: Record<string, unknown>) => request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send(body);

    await auth({ backgroundMediaUrl: 'https://example.com/portrait.jpg', backgroundMediaType: 'image' }).expect(403);
    await request(app).put('/api/studio/plan').set('Authorization', `Bearer ${token}`).send({ plan: 'pro' }).expect(200);
    await auth({ backgroundMediaUrl: 'https://example.com/portrait.jpg', backgroundMediaType: 'image' }).expect(200);
    await auth({ backgroundMediaUrl: 'https://example.com/landscape.mp4', backgroundMediaType: 'video' }).expect(200);
    const saved = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    expect(saved.body.backgroundMediaUrl).toBe('https://example.com/landscape.mp4');
    expect(saved.body.backgroundMediaType).toBe('video');
    await request(app).put('/api/studio/plan').set('Authorization', `Bearer ${token}`).send({ plan: 'free' }).expect(200);
    const publicProfile = await request(app).get(`/api/profiles/${registration.body.user.username}`).expect(200);
    expect(publicProfile.body.backgroundMediaUrl).toBeNull();
    expect(publicProfile.body.backgroundMediaType).toBeNull();
    await auth({ backgroundMediaUrl: null, backgroundMediaType: null }).expect(200);
  });

  it('rejects unsafe media URLs and unsupported media types', async () => {
    const id = `${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
    const registration = await request(app).post('/api/auth/register').send({ email: `invalid-background-${id}@raloa.test`, password: 'BackgroundPassword2026!', username: `invalidbackground${id}`.slice(0, 30) }).expect(201);
    const token = registration.body.token as string;
    const auth = (body: Record<string, unknown>) => request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send(body);
    await auth({ backgroundMediaUrl: 'javascript:alert(1)', backgroundMediaType: 'image' }).expect(400);
    await auth({ backgroundMediaUrl: 'https://example.com/file.pdf', backgroundMediaType: 'audio' }).expect(400);
  });
});
