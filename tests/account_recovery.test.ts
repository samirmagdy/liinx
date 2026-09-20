import { createHash, randomBytes } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db } from '../server/db.js';

function unique(prefix: string): string {
  return `${prefix}_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

async function registerAccount() {
  const email = `${unique('recovery')}@liinx.test`;
  const username = unique('recovery_user').slice(0, 30);
  const response = await request(app).post('/api/auth/register').send({ email, password: 'Password123!', username });
  expect(response.status).toBe(201);
  return { email, username, token: response.body.token };
}

describe('account recovery and deletion', () => {
  it('does not enumerate accounts when mail delivery is unavailable', async () => {
    const originalKey = process.env.RESEND_API_KEY;
    const originalFrom = process.env.CONTACT_FROM_EMAIL;
    delete process.env.RESEND_API_KEY;
    delete process.env.CONTACT_FROM_EMAIL;
    try {
      const response = await request(app).post('/api/auth/password-reset/request').send({ email: `${unique('unknown')}@liinx.test` });
      expect(response.status).toBe(503);
      expect(response.body.message).toBeUndefined();
      expect(response.body.error).toMatch(/temporarily unavailable/i);
    } finally {
      if (originalKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = originalKey;
      if (originalFrom === undefined) delete process.env.CONTACT_FROM_EMAIL; else process.env.CONTACT_FROM_EMAIL = originalFrom;
    }
  });

  it('uses a single-use reset token and invalidates the old session', async () => {
    const originalKey = process.env.RESEND_API_KEY;
    const originalFrom = process.env.CONTACT_FROM_EMAIL;
    process.env.RESEND_API_KEY = 'test-key';
    process.env.CONTACT_FROM_EMAIL = 'no-reply@example.test';
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      return { ok: true, json: async () => body };
    });
    vi.stubGlobal('fetch', fetchMock);
    try {
      const account = await registerAccount();
      const response = await request(app).post('/api/auth/password-reset/request').send({ email: account.email });
      expect(response.status).toBe(202);
      expect(response.body.token).toBeUndefined();
      const emailBody = JSON.parse(String(fetchMock.mock.calls.at(-1)?.[1]?.body)).text as string;
      const token = new URL(emailBody.match(/https?:\/\/[^\s]+/)![0]).searchParams.get('token')!;

      const reset = await request(app).post('/api/auth/password-reset/confirm').send({ token, password: 'NewPassword123!' });
      expect(reset.status).toBe(200);
      expect(reset.body.token).toBeUndefined();
      expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${account.token}`)).status).toBe(401);
      expect((await request(app).post('/api/auth/password-reset/confirm').send({ token, password: 'AnotherPassword123!' })).status).toBe(400);
    } finally {
      vi.unstubAllGlobals();
      if (originalKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = originalKey;
      if (originalFrom === undefined) delete process.env.CONTACT_FROM_EMAIL; else process.env.CONTACT_FROM_EMAIL = originalFrom;
    }
  });

  it('rejects expired reset tokens', async () => {
    const account = await registerAccount();
    const token = randomBytes(32).toString('base64url');
    db.prepare('INSERT INTO account_tokens (token_hash, user_id, purpose, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').run(
      createHash('sha256').update(token).digest('hex'),
      (db.prepare('SELECT id FROM users WHERE email = ?').get(account.email) as { id: string }).id,
      'password_reset',
      Date.now() - 1,
      Date.now() - 1000
    );
    const response = await request(app).post('/api/auth/password-reset/confirm').send({ token, password: 'NewPassword123!' });
    expect(response.status).toBe(400);
  });

  it('requires explicit deletion confirmation and permits retry after billing failure', async () => {
    const account = await registerAccount();
    const profile = db.prepare('SELECT id FROM profiles WHERE username = ?').get(account.username) as { id: string };
    const now = Date.now();
    db.prepare('UPDATE profiles SET stripe_subscription_id = ? WHERE id = ?').run('sub_missing_provider', profile.id);
    db.prepare('INSERT INTO newsletter_subscribers (id, profile_id, email, created_at) VALUES (?, ?, ?, ?)').run(unique('subscriber'), profile.id, 'subscriber@example.test', now);
    db.prepare('INSERT INTO form_submissions (id, profile_id, fields_json, created_at) VALUES (?, ?, ?, ?)').run(unique('submission'), profile.id, '{}', now);

    const missingReauth = await request(app).delete('/api/auth/account').set('Authorization', `Bearer ${account.token}`).send({ confirmation: 'DELETE' });
    expect(missingReauth.status).toBe(400);
    const wrongPassword = await request(app).delete('/api/auth/account').set('Authorization', `Bearer ${account.token}`).send({ confirmation: 'DELETE', password: 'WrongPassword123!' });
    expect(wrongPassword.status).toBe(401);
    expect(db.prepare('SELECT id FROM users WHERE email = ?').get(account.email)).toBeDefined();
    const failed = await request(app).delete('/api/auth/account').set('Authorization', `Bearer ${account.token}`).send({ confirmation: 'DELETE', password: 'Password123!' });
    expect(failed.status).toBe(500);
    expect(failed.body.success).toBeUndefined();
    expect(db.prepare('SELECT id FROM users WHERE email = ?').get(account.email)).toBeDefined();

    db.prepare('UPDATE profiles SET stripe_subscription_id = NULL WHERE id = ?').run(profile.id);
    const retried = await request(app).delete('/api/auth/account').set('Authorization', `Bearer ${account.token}`).send({ confirmation: 'DELETE', password: 'Password123!' });
    expect(retried.status).toBe(200);
    expect(db.prepare('SELECT id FROM users WHERE email = ?').get(account.email)).toBeUndefined();
    expect(db.prepare('SELECT id FROM profiles WHERE id = ?').get(profile.id)).toBeUndefined();
    expect(db.prepare('SELECT id FROM newsletter_subscribers WHERE profile_id = ?').get(profile.id)).toBeUndefined();
    expect(db.prepare('SELECT id FROM form_submissions WHERE profile_id = ?').get(profile.id)).toBeUndefined();
  });
});
