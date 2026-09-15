import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';

describe('HttpOnly browser sessions', () => {
  it('authenticates through the session cookie and clears it on logout', async () => {
    const agent = request.agent(app);
    const suffix = Date.now();
    const register = await agent.post('/api/auth/register').send({
      email: `cookie_${suffix}@liinx.test`,
      password: 'CookiePassword123!',
      username: `cookie_${suffix}`
    });

    expect(register.status).toBe(201);
    const cookies = Array.isArray(register.headers['set-cookie']) ? register.headers['set-cookie'] : [register.headers['set-cookie']];
    expect(cookies.some((cookie: string | undefined) => Boolean(cookie?.startsWith('liinx_session=') && cookie.includes('HttpOnly')))).toBe(true);
    expect((await agent.get('/api/auth/me')).status).toBe(200);
    expect((await agent.post('/api/auth/logout')).status).toBe(200);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
});
