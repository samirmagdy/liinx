import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { signJwt, verifyJwt } from '../server/auth.js';
import { db } from '../server/db.js';

describe('authentication and session boundaries', () => {
  it('rejects forged, malformed, and expired-signature tokens', async () => {
    const forged = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1In0.invalid-signature';
    const expired = signJwt({ userId: 'u', profileId: 'p', email: 'x@example.test', username: 'x' }, { expiresIn: -1 });
    expect(verifyJwt(forged)).toBeNull();
    expect(verifyJwt(expired)).toBeNull();
    expect((await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-jwt')).status).toBe(401);
  });

  it('invalidates every bearer and cookie session on logout', async () => {
    const agent = request.agent(app);
    const suffix = Date.now();
    const register = await agent.post('/api/auth/register').send({
      email: `session_${suffix}@liinx.test`, password: 'SessionPassword123!', username: `session_${suffix}`
    });
    expect(register.status).toBe(201);
    const token = register.body.token as string;
    expect((await agent.get('/api/auth/me')).status).toBe(200);
    expect((await agent.post('/api/auth/logout')).status).toBe(200);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)).status).toBe(401);
  });

  it('returns 403 for a hostile state-changing Origin and keeps the session valid', async () => {
    const agent = request.agent(app);
    const suffix = Date.now();
    const register = await agent.post('/api/auth/register').send({
      email: `origin_${suffix}@liinx.test`, password: 'OriginPassword123!', username: `origin_${suffix}`
    });
    expect(register.status).toBe(201);
    const hostile = await agent.put('/api/studio/profile').set('Origin', 'https://evil.example').send({ bio: 'blocked' });
    expect(hostile.status).toBe(403);
    expect((await agent.get('/api/auth/me')).status).toBe(200);
  });

  it.each([3, 5, 12])('keeps password-change sessions valid when the stored version starts at %i', async (sessionVersion) => {
    const agent = request.agent(app);
    const suffix = `${Date.now()}_${sessionVersion}`;
    const email = `password_version_${suffix}@liinx.test`;
    const password = 'SessionPassword123!';
    const registered = await agent.post('/api/auth/register').send({ email, password, username: `pv_${Date.now().toString(36)}_${sessionVersion}` });
    expect(registered.status).toBe(201);

    const userId = registered.body.user.id as string;
    db.prepare('UPDATE users SET session_version = ? WHERE id = ?').run(sessionVersion - 1, userId);
    expect((await agent.post('/api/auth/login').send({ email, password })).status).toBe(200);
    expect((await agent.post('/api/auth/logout')).status).toBe(200);
    expect((await agent.post('/api/auth/login').send({ email, password })).status).toBe(200);

    const changed = await agent.post('/api/auth/change-password').send({ currentPassword: password, newPassword: 'NewSessionPassword456!' });
    expect(changed.status).toBe(200);
    expect(verifyJwt(changed.body.token)?.sessionVersion).toBe(sessionVersion + 1);
    expect((await agent.get('/api/auth/me')).status).toBe(200);
  });

  it.each([3, 5, 12])('keeps email-change sessions valid when the stored version starts at %i', async (sessionVersion) => {
    const agent = request.agent(app);
    const suffix = `${Date.now()}_${sessionVersion}`;
    const email = `email_version_${suffix}@liinx.test`;
    const password = 'SessionPassword123!';
    const registered = await agent.post('/api/auth/register').send({ email, password, username: `email_version_${suffix}` });
    expect(registered.status).toBe(201);

    const userId = registered.body.user.id as string;
    db.prepare('UPDATE users SET session_version = ? WHERE id = ?').run(sessionVersion - 1, userId);
    expect((await agent.post('/api/auth/login').send({ email, password })).status).toBe(200);
    expect((await agent.post('/api/auth/logout')).status).toBe(200);
    const loggedIn = await agent.post('/api/auth/login').send({ email, password });
    expect(loggedIn.status).toBe(200);

    const updatedEmail = `email_updated_${suffix}@liinx.test`;
    const changed = await agent.post('/api/auth/update-email').send({ email: updatedEmail, password });
    expect(changed.status).toBe(200);
    expect(verifyJwt(changed.body.token)?.sessionVersion).toBe(sessionVersion + 1);
    expect(verifyJwt(changed.body.token)?.email).toBe(updatedEmail);
    expect((await agent.get('/api/auth/me')).status).toBe(200);
    expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${loggedIn.body.token}`)).status).toBe(401);
  });
});
