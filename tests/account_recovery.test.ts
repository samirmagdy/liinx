import { createHash, randomBytes } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db } from '../server/db.js';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { consumePasswordResetToken } from '../server/services/passwordReset.js';

function unique(prefix: string): string {
  return `${prefix}_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

async function registerAccount() {
  const email = `${unique('recovery')}@raloa.test`;
  const username = unique('recovery_user').slice(0, 30);
  const response = await request(app).post('/api/auth/register').send({ email, password: 'Password123!', username });
  expect(response.status).toBe(201);
  return { email, username, token: response.body.token };
}

describe('account recovery and deletion', () => {
  it('allows only one reset-token consume across independent SQLite connections', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'raloa-reset-race-'));
    const databasePath = path.join(directory, 'reset.sqlite');
    const first = new Database(databasePath);
    const second = new Database(databasePath);
    try {
      first.exec(`
        CREATE TABLE users (id TEXT PRIMARY KEY, password_hash TEXT NOT NULL, session_version INTEGER NOT NULL);
        CREATE TABLE account_tokens (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, purpose TEXT NOT NULL, used_at INTEGER, expires_at INTEGER NOT NULL);
      `);
      first.prepare('INSERT INTO users VALUES (?, ?, ?)').run('user-1', 'original-hash', 4);
      first.prepare('INSERT INTO account_tokens VALUES (?, ?, ?, NULL, ?)').run('hashed-reset-token', 'user-1', 'password_reset', Date.now() + 60_000);

      // Both independent connections observe eligibility before either tries to consume.
      expect(first.prepare("SELECT 1 FROM account_tokens WHERE token_hash = ? AND used_at IS NULL").get('hashed-reset-token')).toBeDefined();
      expect(second.prepare("SELECT 1 FROM account_tokens WHERE token_hash = ? AND used_at IS NULL").get('hashed-reset-token')).toBeDefined();
      let readyCount = 0;
      let release!: () => void;
      const ready = new Promise<void>(resolve => { release = resolve; });
      const consume = async (connection: Database.Database, chosenHash: string) => {
        readyCount += 1;
        if (readyCount === 2) release();
        await ready;
        return consumePasswordResetToken(connection, 'hashed-reset-token', Date.now(), chosenHash);
      };
      const results = await Promise.all([consume(first, 'winner-hash'), consume(second, 'loser-hash')]);

      expect(results.filter(Boolean)).toHaveLength(1);
      expect(results.filter(result => !result)).toHaveLength(1);
      const user = first.prepare('SELECT password_hash, session_version FROM users WHERE id = ?').get('user-1') as { password_hash: string; session_version: number };
      const token = first.prepare('SELECT used_at FROM account_tokens WHERE token_hash = ?').get('hashed-reset-token') as { used_at: number | null };
      expect(user.password_hash).toBe(results[0] ? 'winner-hash' : 'loser-hash');
      expect(user.session_version).toBe(5);
      expect(token.used_at).not.toBeNull();
    } finally {
      first.close();
      second.close();
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  it('does not enumerate accounts when mail delivery is unavailable', async () => {
    const originalKey = process.env.RESEND_API_KEY;
    const originalFrom = process.env.CONTACT_FROM_EMAIL;
    delete process.env.RESEND_API_KEY;
    delete process.env.CONTACT_FROM_EMAIL;
    try {
      const response = await request(app).post('/api/auth/password-reset/request').send({ email: `${unique('unknown')}@raloa.test` });
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
    const userId = (db.prepare('SELECT id FROM users WHERE email = ?').get(account.email) as { id: string }).id;
    db.prepare('INSERT INTO account_tokens (token_hash, user_id, purpose, subject_value_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      createHash('sha256').update(token).digest('hex'),
      userId,
      'password_reset',
      createHash('sha256').update(account.email).digest('hex'),
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

  it('email verification token is rejected after the account email changes (credential-swap bypass)', async () => {
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

      // Request a verification token for the original email
      const verifyReq = await request(app)
        .post('/api/auth/email-verification/request')
        .set('Authorization', `Bearer ${account.token}`);
      expect(verifyReq.status).toBe(202);

      const emailBody = JSON.parse(String(fetchMock.mock.calls.at(-1)?.[1]?.body)).text as string;
      const oldToken = new URL(emailBody.match(/https?:\/\/[^\s]+/)![0]).searchParams.get('token')!;

      // Change the email address — old token is now stale
      const newEmail = `${unique('changed')}@raloa.test`;
      const updateRes = await request(app)
        .post('/api/auth/update-email')
        .set('Authorization', `Bearer ${account.token}`)
        .send({ email: newEmail, password: 'Password123!' });
      expect(updateRes.status).toBe(200);

      // Attempting to confirm using the old token must be rejected
      const confirmRes = await request(app)
        .post('/api/auth/email-verification/confirm')
        .send({ token: oldToken });
      expect(confirmRes.status).toBe(400);
      expect(confirmRes.body.error).toMatch(/invalid or expired/i);

      // email_verified_at must remain NULL — the bypass did NOT succeed
      const userId = (db.prepare('SELECT id FROM users WHERE email = ?').get(newEmail) as { id: string }).id;
      const user = db.prepare('SELECT email_verified_at FROM users WHERE id = ?').get(userId) as { email_verified_at: number | null };
      expect(user.email_verified_at).toBeNull();
    } finally {
      vi.unstubAllGlobals();
      if (originalKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = originalKey;
      if (originalFrom === undefined) delete process.env.CONTACT_FROM_EMAIL; else process.env.CONTACT_FROM_EMAIL = originalFrom;
    }
  });

  it('update-email atomically invalidates all pending verification and reset tokens', async () => {
    const originalKey = process.env.RESEND_API_KEY;
    const originalFrom = process.env.CONTACT_FROM_EMAIL;
    process.env.RESEND_API_KEY = 'test-key';
    process.env.CONTACT_FROM_EMAIL = 'no-reply@example.test';
    vi.stubGlobal('fetch', vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      return { ok: true, json: async () => body };
    }));
    try {
      const account = await registerAccount();
      const userId = (db.prepare('SELECT id FROM users WHERE email = ?').get(account.email) as { id: string }).id;

      // Seed a pending email_verification token directly
      const pendingToken = randomBytes(32).toString('base64url');
      const pendingHash = createHash('sha256').update(pendingToken).digest('hex');
      const subjectHash = createHash('sha256').update(account.email).digest('hex');
      db.prepare(
        'INSERT INTO account_tokens (token_hash, user_id, purpose, subject_value_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(pendingHash, userId, 'email_verification', subjectHash, Date.now() + 24 * 60 * 60 * 1000, Date.now());

      // Change email — must atomically mark the seeded token as used
      const newEmail = `${unique('atomic')}@raloa.test`;
      const updateRes = await request(app)
        .post('/api/auth/update-email')
        .set('Authorization', `Bearer ${account.token}`)
        .send({ email: newEmail, password: 'Password123!' });
      expect(updateRes.status).toBe(200);

      // Seeded token must now have used_at set
      const row = db.prepare('SELECT used_at FROM account_tokens WHERE token_hash = ?').get(pendingHash) as { used_at: number | null };
      expect(row.used_at).not.toBeNull();
    } finally {
      vi.unstubAllGlobals();
      if (originalKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = originalKey;
      if (originalFrom === undefined) delete process.env.CONTACT_FROM_EMAIL; else process.env.CONTACT_FROM_EMAIL = originalFrom;
    }
  });
});
