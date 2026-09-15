import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server/server';
import { db } from '../server/db';
import { paidPlans } from '../src/config/plans';
describe('review remediation', () => {
  it('persists a contact message before acknowledging it', async () => {
    const payload = { name: 'QA contact', email: `qa-${Date.now()}@example.test`, message: 'Persistence test, not a support request.' };
    const response = await request(app).post('/api/contact').send(payload).expect(201);
    const saved = db.prepare('SELECT name, email, message FROM contact_messages WHERE id = ?').get(response.body.id);
    expect(saved).toEqual(payload);
  });
  it('rejects invalid contact messages', async () => {
    await request(app).post('/api/contact').send({ name: '', email: 'bad', message: '' }).expect(400);
  });
  it('never returns the SPA for an unknown API endpoint', async () => {
    const response = await request(app).get('/api/does-not-exist').expect(404);
    expect(response.headers['content-type']).toContain('application/json');
  });
  it('uses a shared explicit monthly and annual price catalogue', () => {
    expect(paidPlans.pro).toMatchObject({ month: 1200, year: 12000 });
    expect(paidPlans.studio).toMatchObject({ month: 2900, year: 28800 });
  });
});
