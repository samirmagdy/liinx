import { describe, expect, it, afterEach, vi } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { app } from '../server/server.js';
import { db } from '../server/db.js';
import { pageTitles } from '../src/config/pages.js';

const originalNotificationConfig = {
  key: process.env.RESEND_API_KEY,
  recipient: process.env.CONTACT_NOTIFICATION_EMAIL,
  sender: process.env.CONTACT_FROM_EMAIL,
  admin: process.env.SUPPORT_INBOX_ADMIN_USER_ID
};

afterEach(() => {
  for (const [name, value] of Object.entries({
    RESEND_API_KEY: originalNotificationConfig.key,
    CONTACT_NOTIFICATION_EMAIL: originalNotificationConfig.recipient,
    CONTACT_FROM_EMAIL: originalNotificationConfig.sender,
    SUPPORT_INBOX_ADMIN_USER_ID: originalNotificationConfig.admin
  })) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

describe('platform support contact', () => {
  it('persists without mail configuration and reports notification state honestly', async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.CONTACT_NOTIFICATION_EMAIL;
    delete process.env.CONTACT_FROM_EMAIL;
    const payload = { name: 'Support tester', email: `${randomUUID()}@example.test`, message: 'Local support fixture.' };

    const response = await request(app).post('/api/contact').send(payload).expect(201);

    expect(response.body).toMatchObject({ success: true, notification: 'not_configured' });
    expect(db.prepare('SELECT name, email, message FROM contact_messages WHERE id = ?').get(response.body.id)).toEqual(payload);
  });

  it('reports sent only when the configured provider accepts the notification', async () => {
    process.env.RESEND_API_KEY = 'local-test-key';
    process.env.CONTACT_NOTIFICATION_EMAIL = 'operator@example.test';
    process.env.CONTACT_FROM_EMAIL = 'no-reply@example.test';
    const fetchMock = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    try {
      const response = await request(app).post('/api/contact').send({ name: 'Configured tester', email: `${randomUUID()}@example.test`, message: 'Provider fixture.' }).expect(201);
      expect(response.body.notification).toBe('sent');
      expect(fetchMock).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('keeps the saved request while reporting provider rejection honestly', async () => {
    process.env.RESEND_API_KEY = 'local-test-key';
    process.env.CONTACT_NOTIFICATION_EMAIL = 'operator@example.test';
    process.env.CONTACT_FROM_EMAIL = 'no-reply@example.test';
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503 })));
    try {
      const response = await request(app).post('/api/contact').send({ name: 'Provider failure tester', email: `${randomUUID()}@example.test`, message: 'Still saved locally.' }).expect(201);
      expect(response.body.notification).toBe('failed');
      expect(db.prepare('SELECT id FROM contact_messages WHERE id = ?').get(response.body.id)).toBeDefined();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('rejects malformed, control-character, and honeypot submissions', async () => {
    await request(app).post('/api/contact').send({ name: '', email: 'bad', message: '' }).expect(400);
    await request(app).post('/api/contact').send({ name: 'Bad\nSubject', email: 'valid@example.test', message: 'x' }).expect(400);
    await request(app).post('/api/contact').send({ name: 'Bot', email: 'bot@example.test', message: 'x', website: 'https://spam.example' }).expect(400);
  });

  it('limits support inbox access to the configured operator account', async () => {
    const email = `${randomUUID()}@example.test`;
    const username = `support_${randomUUID().replace(/-/g, '').slice(0, 20)}`;
    const registered = await request(app).post('/api/auth/register').send({ email, password: 'SupportPassword123!', username }).expect(201);
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string };

    delete process.env.SUPPORT_INBOX_ADMIN_USER_ID;
    await request(app).get('/api/support/inbox').expect(401);
    await request(app).get('/api/support/inbox').set('Authorization', `Bearer ${registered.body.token}`).expect(403);

    process.env.SUPPORT_INBOX_ADMIN_USER_ID = user.id;
    await request(app).get('/api/support/inbox').set('Authorization', `Bearer ${registered.body.token}`).expect(200);
  });

  it('keeps the footer legal and support routes reachable', async () => {
    for (const path of ['/about', '/contact', '/privacy', '/terms']) {
      expect(pageTitles[path]).toBeDefined();
    }
  });
});
