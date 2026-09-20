import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';
import { encryptSecret } from '../server/secretStore.js';

describe('Instagram integration security and failure boundaries', () => {
  let token = '';
  let profileId = '';

  beforeAll(async () => {
    initDatabase();
    const suffix = Date.now();
    const response = await request(app).post('/api/auth/register').send({
      email: `instagram-task-${suffix}@raloa.test`,
      password: 'Password123!',
      username: `instagramtask${suffix}`
    });
    token = response.body.token;
    profileId = response.body.profileId;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.INSTAGRAM_CLIENT_ID;
    delete process.env.INSTAGRAM_CLIENT_SECRET;
  });

  it('uses current Instagram Login scope and consumes OAuth state once', async () => {
    process.env.INSTAGRAM_CLIENT_ID = 'test-client-id';
    const auth = await request(app)
      .get('/api/integrations/instagram/auth-url')
      .set('Authorization', `Bearer ${token}`);

    expect(auth.status).toBe(200);
    const url = new URL(auth.body.authUrl);
    expect(url.origin).toBe('https://www.instagram.com');
    expect(url.searchParams.get('scope')).toBe('instagram_business_basic');
    const state = url.searchParams.get('state');
    expect(state).toBeTruthy();
    const storedState = db.prepare('SELECT profile_id, state_hash FROM instagram_oauth_states').get() as { profile_id: string; state_hash: string };
    expect(storedState.profile_id).toBe(profileId);
    expect(storedState.state_hash).not.toContain(state);

    const denied = await request(app).get('/api/integrations/instagram/callback').query({ state, error: 'access_denied' });
    expect(denied.status).toBe(302);
    const replay = await request(app).get('/api/integrations/instagram/callback').query({ state, code: 'replayed-code' });
    expect(replay.status).toBe(302);
    expect(replay.headers.location).toMatch(/Invalid_or_reused_security_state/);
  });

  it('reports expired access and does not call the provider', async () => {
    const now = Date.now();
    db.prepare(`INSERT INTO instagram_sync
      (id, profile_id, instagram_user_id, instagram_username, access_token, token_expires_at, token_issued_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(`expired_${profileId}`, profileId, 'ig-expired', 'expired_user', encryptSecret('token'), now - 1, now - 90 * 24 * 60 * 60 * 1000, now, now);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await request(app)
      .post('/api/integrations/instagram/sync')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/expired|reconnect/i);
    expect(fetchMock).not.toHaveBeenCalled();
    const status = await request(app).get('/api/integrations/instagram/status').set('Authorization', `Bearer ${token}`);
    expect(status.body.needsReconnect).toBe(true);
    expect(status.body.lastSyncError).toMatch(/expired/i);
  });

  it('preserves existing blocks and reports provider failure without false success', async () => {
    db.prepare('DELETE FROM instagram_sync WHERE profile_id = ?').run(profileId);
    const now = Date.now();
    db.prepare(`INSERT INTO instagram_sync
      (id, profile_id, instagram_user_id, instagram_username, access_token, token_expires_at, token_issued_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(`failure_${profileId}`, profileId, 'ig-failure', 'failure_user', encryptSecret('token'), now + 30 * 24 * 60 * 60 * 1000, now - 2 * 24 * 60 * 60 * 1000, now, now);
    const before = db.prepare('SELECT COUNT(*) as count FROM blocks WHERE profile_id = ?').get(profileId) as { count: number };
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, text: async () => 'temporarily unavailable' })));

    const response = await request(app)
      .post('/api/integrations/instagram/sync')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(502);
    expect(response.body.success).not.toBe(true);
    const after = db.prepare('SELECT COUNT(*) as count FROM blocks WHERE profile_id = ?').get(profileId) as { count: number };
    expect(after.count).toBe(before.count);
    const stored = db.prepare('SELECT last_sync_error FROM instagram_sync WHERE profile_id = ?').get(profileId) as { last_sync_error: string };
    expect(stored.last_sync_error).toMatch(/failed|preserved|retry/i);
  });
});
