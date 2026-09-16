import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { signJwt, verifyJwt } from '../server/auth.js';

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
});
