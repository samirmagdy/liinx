import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';

describe('Task 63 operations diagnostics', () => {
  it('reports liveness and writable-storage readiness without secrets', async () => {
    const health = await request(app).get('/api/health');
    expect(health.status).toBe(200);
    expect(health.body.status).toBe('ok');
    expect(health.body).not.toHaveProperty('env');
    expect(health.body).not.toHaveProperty('secrets');

    const ready = await request(app).get('/api/ready');
    expect(ready.status).toBe(200);
    expect(ready.body).toEqual({
      status: 'ready',
      service: 'liinx-api',
      database: 'connected',
      uploads: 'writable'
    });
  });
});
