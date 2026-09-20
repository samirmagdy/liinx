import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { 
  extractLinksFromCaption, 
  syncMediaToBlocks, 
  fetchInstagramMedia,
  refreshInstagramToken,
  InstagramProviderError
} from '../services/instagramSync.js';
import { encryptSecret, decryptSecret } from '../secretStore.js';
import { logError } from '../logger.js';
import { createId } from '../utils/ids.js';

export const instagramRouter = Router();

// 1. Get Instagram Connection Status
instagramRouter.get('/integrations/instagram/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const profileId = req.user!.profileId;
    const row = db.prepare(`
      SELECT id, instagram_user_id, instagram_username, auto_sync_enabled, last_synced_at, last_media_id, last_sync_error, token_expires_at
      FROM instagram_sync
      WHERE profile_id = ?
    `).get(profileId) as any;

    const isConfigured = Boolean(
      process.env.INSTAGRAM_CLIENT_ID && 
      process.env.INSTAGRAM_CLIENT_SECRET
    );

    if (!row) {
      return res.json({
        connected: false,
        configured: isConfigured,
        autoSyncEnabled: false,
        provider: 'instagram_login',
        accountRequirement: 'Instagram professional account (Business or Creator)'
      });
    }

    // Count synced Instagram links in profile
    const linkCountRow = db.prepare(`
      SELECT COUNT(*) as count 
      FROM blocks 
      WHERE profile_id = ? AND badge = 'INSTAGRAM'
    `).get(profileId) as { count: number };

    return res.json({
      connected: true,
      configured: isConfigured,
      username: row.instagram_username,
      userId: row.instagram_user_id,
      autoSyncEnabled: Boolean(row.auto_sync_enabled),
      lastSyncedAt: row.last_synced_at,
      syncedLinksCount: linkCountRow.count,
      tokenExpiresAt: row.token_expires_at,
      needsReconnect: Boolean(row.token_expires_at && row.token_expires_at <= Date.now()),
      lastSyncError: row.last_sync_error || undefined,
      provider: 'instagram_login',
      accountRequirement: 'Instagram professional account (Business or Creator)'
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve Instagram status: ' + err.message });
  }
});

// 2. Generate Meta Instagram OAuth Authorization URL
instagramRouter.get('/integrations/instagram/auth-url', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/integrations/instagram/callback`;

    if (!clientId) {
      return res.status(400).json({
        error: 'Meta Instagram App ID (INSTAGRAM_CLIENT_ID) not configured in server environment.'
      });
    }

    // Single-use state is stored server-side; do not put profile ownership in a
    // bearer value that can be replayed or moved between browser sessions.
    const state = crypto.randomBytes(32).toString('base64url');
    const stateHash = crypto.createHash('sha256').update(state).digest('hex');
    const now = Date.now();
    db.prepare('DELETE FROM instagram_oauth_states WHERE expires_at <= ?').run(now);
    db.prepare(`INSERT INTO instagram_oauth_states (state_hash, profile_id, redirect_uri, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`)
      .run(stateHash, req.user!.profileId, redirectUri, now + 10 * 60 * 1000, now);

    const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=instagram_business_basic&response_type=code&state=${encodeURIComponent(state)}`;

    return res.json({ authUrl });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to generate Instagram authorization URL: ' + err.message });
  }
});

// 3. Instagram OAuth Callback
type ConsumedInstagramState = { profile_id: string; redirect_uri: string; expires_at: number };

function consumeInstagramState(state: string | undefined): ConsumedInstagramState | string {
  if (!state) return 'Missing_security_state';
  if (!/^[A-Za-z0-9_-]{40,}$/.test(state)) return 'Malformed_security_state';
  const stateHash = crypto.createHash('sha256').update(state).digest('hex');
  const consumed = db.transaction(() => {
    const row = db.prepare('SELECT profile_id, redirect_uri, expires_at FROM instagram_oauth_states WHERE state_hash = ?')
      .get(stateHash) as ConsumedInstagramState | undefined;
    if (!row) return undefined;
    db.prepare('DELETE FROM instagram_oauth_states WHERE state_hash = ?').run(stateHash);
    return row;
  })();
  if (!consumed) return 'Invalid_or_reused_security_state';
  if (consumed.expires_at <= Date.now()) return 'Expired_security_state';
  return consumed;
}

instagramRouter.get('/integrations/instagram/callback', async (req: Request, res: Response) => {
  const { code, state, error, error_description } = req.query as {
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  };

  if (error || !code) {
    if (typeof state === 'string' && /^[A-Za-z0-9_-]{40,}$/.test(state)) {
      const stateHash = crypto.createHash('sha256').update(state).digest('hex');
      db.prepare('DELETE FROM instagram_oauth_states WHERE state_hash = ?').run(stateHash);
    }
    const reason = encodeURIComponent(error_description || error || 'Authorization was cancelled or denied');
    return res.redirect(`/studio?instagram_error=${reason}`);
  }

  // Validate and consume state atomically. The callback intentionally does not
  // require the Liinx session because the OAuth provider returns to this URL;
  // ownership is bound to the single-use server-side state.
  const stateResult = consumeInstagramState(state);
  if (typeof stateResult === 'string') return res.redirect(`/studio?instagram_error=${stateResult}`);
  const consumed = stateResult;
  const profileId = consumed.profile_id;

  try {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    const redirectUri = consumed.redirect_uri;

    if (!clientId || !clientSecret) {
      return res.redirect('/studio?instagram_error=Missing_server_credentials');
    }

    // Step 1: Exchange code for short-lived access token
    const formData = new URLSearchParams();
    formData.append('client_id', clientId);
    formData.append('client_secret', clientSecret);
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', redirectUri);
    formData.append('code', code);

    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: formData
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return res.redirect(`/studio?instagram_error=Token_exchange_failed_${encodeURIComponent(errText)}`);
    }

    const tokenData = await tokenRes.json() as { access_token: string; user_id: string };

    // Step 2: Exchange for long-lived access token (60 days)
    let longLivedToken = tokenData.access_token;
    let tokenExpiresIn = 60 * 24 * 3600;

    try {
      const longTokenUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${tokenData.access_token}`;
      const longRes = await fetch(longTokenUrl);
      if (longRes.ok) {
        const longData = await longRes.json() as { access_token: string; expires_in: number };
        longLivedToken = longData.access_token;
        tokenExpiresIn = longData.expires_in;
      }
    } catch {
      // Fallback to short-lived token
    }

    // Step 3: Fetch username
    let username = `user_${tokenData.user_id}`;
    try {
      const userRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${longLivedToken}`);
      if (userRes.ok) {
        const userData = await userRes.json() as { id: string; username: string };
        if (userData.username) {
          username = userData.username;
        }
      }
    } catch {
      // Use fallback username
    }

    // Step 4: Persist in database
    const now = Date.now();
    const tokenExpiresAt = now + tokenExpiresIn * 1000;
    const syncId = createId('ins');

    db.prepare(`
      INSERT INTO instagram_sync (
        id, profile_id, instagram_user_id, instagram_username, access_token, token_type, token_expires_at, token_issued_at, auto_sync_enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'bearer', ?, ?, 1, ?, ?)
      ON CONFLICT(profile_id) DO UPDATE SET
        instagram_user_id = excluded.instagram_user_id,
        instagram_username = excluded.instagram_username,
        access_token = excluded.access_token,
        token_expires_at = excluded.token_expires_at,
        token_issued_at = excluded.token_issued_at,
        last_sync_error = NULL,
        auto_sync_enabled = 1,
        updated_at = excluded.updated_at
    `).run(syncId, profileId, String(tokenData.user_id), username, encryptSecret(longLivedToken), tokenExpiresAt, now, now, now);

    // Initial media pull
    try {
      const mediaItems = await fetchInstagramMedia(longLivedToken);
      syncMediaToBlocks(profileId, mediaItems);
    } catch (error) {
      db.prepare('UPDATE instagram_sync SET last_sync_error = ?, updated_at = ? WHERE profile_id = ?')
        .run(error instanceof Error ? error.message : 'Initial Instagram sync failed.', Date.now(), profileId);
    }

    return res.redirect('/studio?instagram_connected=true');
  } catch (err: any) {
    return res.redirect(`/studio?instagram_error=${encodeURIComponent(err.message)}`);
  }
});

// 4. Trigger Manual Sync for Connected Account
instagramRouter.post('/integrations/instagram/sync', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profileId = req.user!.profileId;
    const syncRow = db.prepare(`
      SELECT access_token, token_expires_at, token_issued_at, last_sync_attempt_at, instagram_username
      FROM instagram_sync 
      WHERE profile_id = ?
    `).get(profileId) as any;

    if (!syncRow) {
      return res.status(400).json({ error: 'No Instagram account connected to this profile.' });
    }

    const now = Date.now();
    if (syncRow.last_sync_attempt_at && now - syncRow.last_sync_attempt_at < 30_000) {
      return res.status(429).json({ error: 'Instagram sync was requested recently. Please retry shortly.' });
    }
    db.prepare('UPDATE instagram_sync SET last_sync_attempt_at = ?, last_sync_error = NULL, updated_at = ? WHERE profile_id = ?')
      .run(now, now, profileId);

    // Long-lived Instagram Login tokens can be refreshed only while valid and
    // after the provider's minimum token age. Never silently use an expired token.
    if (syncRow.token_expires_at && now >= syncRow.token_expires_at) {
      db.prepare('UPDATE instagram_sync SET last_sync_error = ?, updated_at = ? WHERE profile_id = ?')
        .run('Instagram access expired. Reconnect your account.', now, profileId);
      return res.status(401).json({ error: 'Instagram access token has expired. Please reconnect your account.' });
    }

    let accessToken = decryptSecret(syncRow.access_token);
    if (syncRow.token_expires_at && syncRow.token_issued_at &&
        syncRow.token_expires_at - now < 7 * 24 * 60 * 60 * 1000 &&
        now - syncRow.token_issued_at >= 24 * 60 * 60 * 1000) {
      try {
        const refreshed = await refreshInstagramToken(accessToken);
        const refreshedAt = Date.now();
        db.prepare('UPDATE instagram_sync SET access_token = ?, token_expires_at = ?, token_issued_at = ?, updated_at = ? WHERE profile_id = ?')
          .run(encryptSecret(refreshed.accessToken), refreshedAt + refreshed.expiresIn * 1000, refreshedAt, refreshedAt, profileId);
        accessToken = refreshed.accessToken;
      } catch {
        db.prepare('UPDATE instagram_sync SET last_sync_error = ?, updated_at = ? WHERE profile_id = ?')
          .run('Instagram access could not be refreshed. Reconnect your account.', Date.now(), profileId);
        return res.status(401).json({ error: 'Instagram access needs to be refreshed. Please reconnect your account.' });
      }
    }

    const mediaItems = await fetchInstagramMedia(accessToken);
    const result = syncMediaToBlocks(profileId, mediaItems);

    return res.json({
      success: true,
      message: `Sync complete. Analyzed ${result.mediaProcessed} posts and created ${result.totalCreated} new link blocks.`,
      mediaProcessed: result.mediaProcessed,
      linksCreated: result.linksCreated
    });
  } catch (err: any) {
    const message = err instanceof InstagramProviderError && (err.status === 401 || err.status === 403)
      ? 'Instagram authorization is no longer valid. Please reconnect your account.'
      : 'Instagram sync failed. Existing content was preserved; please retry.';
    if (err instanceof InstagramProviderError && (err.status === 401 || err.status === 403)) {
      db.prepare('UPDATE instagram_sync SET last_sync_error = ?, updated_at = ? WHERE profile_id = ?')
        .run(message, Date.now(), req.user!.profileId);
      return res.status(401).json({ error: message });
    }
    db.prepare('UPDATE instagram_sync SET last_sync_error = ?, updated_at = ? WHERE profile_id = ?')
      .run(message, Date.now(), req.user!.profileId);
    return res.status(502).json({ error: message });
  }
});

// 5. Test Caption Link Extraction & Manual Post Ingest
const testCaptionSchema = z.object({
  caption: z.string().min(1, 'Caption text cannot be empty').max(2200),
  saveToProfile: z.boolean().optional()
});

instagramRouter.post('/integrations/instagram/test-caption', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = testCaptionSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const { caption, saveToProfile } = parse.data;
    const profileId = req.user!.profileId;

    const extracted = extractLinksFromCaption(caption);

    if (saveToProfile && extracted.length > 0) {
      const pseudoMedia = [{
        id: `manual_${Date.now()}`,
        caption,
        timestamp: new Date().toISOString()
      }];

      const syncResult = syncMediaToBlocks(profileId, pseudoMedia);
      return res.json({
        success: true,
        extracted,
        savedCount: syncResult.totalCreated,
        blocks: syncResult.linksCreated
      });
    }

    return res.json({
      success: true,
      extracted,
      savedCount: 0
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Caption extraction failed: ' + err.message });
  }
});

// 6. Toggle Auto-Sync
const toggleSchema = z.object({
  enabled: z.boolean()
});

instagramRouter.post('/integrations/instagram/toggle-auto', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = toggleSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const profileId = req.user!.profileId;
    const result = db.prepare(`
      UPDATE instagram_sync 
      SET auto_sync_enabled = ?, updated_at = ?
      WHERE profile_id = ?
    `).run(parse.data.enabled ? 1 : 0, Date.now(), profileId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'No connected Instagram account found.' });
    }

    return res.json({ success: true, autoSyncEnabled: parse.data.enabled });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update auto-sync setting: ' + err.message });
  }
});

// 7. Disconnect Instagram Account
instagramRouter.post('/integrations/instagram/disconnect', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const profileId = req.user!.profileId;
    db.prepare('DELETE FROM instagram_sync WHERE profile_id = ?').run(profileId);
    return res.json({ success: true, message: 'Instagram access removed from Liinx. Revoke Liinx in Instagram settings if you also want to remove Meta-side authorization.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to disconnect: ' + err.message });
  }
});

// 8. Meta Webhook Handlers for Real-Time Event Sync
instagramRouter.get('/webhooks/instagram', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === expectedToken) {
    return res.status(200).send(challenge);
  }

  return res.status(403).send('Forbidden');
});

instagramRouter.post('/webhooks/instagram', async (req: Request, res: Response) => {
  // Validate HMAC Signature if secret configured
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  const signature = req.headers['x-hub-signature-256'] as string;

  if (!clientSecret) return res.status(503).send('Instagram webhook is not configured.');
  if (!signature) return res.status(401).send('Missing signature');
  const rawBody = (req as any).rawBody || Buffer.from(JSON.stringify(req.body));
  const digest = 'sha256=' + crypto.createHmac('sha256', clientSecret).update(rawBody).digest('hex');
  const digestBuffer = Buffer.from(digest, 'utf8');
  const signatureBuffer = Buffer.from(signature, 'utf8');
  if (digestBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(digestBuffer, signatureBuffer)) {
    return res.status(401).send('Invalid signature');
  }

  const body = req.body;
  if (body.object === 'instagram' && Array.isArray(body.entry)) {
    for (const entry of body.entry) {
      const igUserId = entry.id;
      if (!igUserId) continue;

      // Find profile with active auto-sync
      const syncRow = db.prepare(`
        SELECT profile_id, access_token 
        FROM instagram_sync 
        WHERE instagram_user_id = ? AND auto_sync_enabled = 1
      `).get(String(igUserId)) as any;

      if (syncRow && syncRow.access_token) {
        try {
          const media = await fetchInstagramMedia(decryptSecret(syncRow.access_token));
          syncMediaToBlocks(syncRow.profile_id, media);
        } catch (error) {
          db.prepare('UPDATE instagram_sync SET last_sync_error = ?, updated_at = ? WHERE profile_id = ?')
            .run('Instagram sync failed. Existing content was preserved; please reconnect or retry.', Date.now(), syncRow.profile_id);
          logError('Instagram webhook sync failed', error, { profileId: syncRow.profile_id });
        }
      }
    }
  }

  // Acknowledge receipt to Meta immediately
  return res.status(200).send('EVENT_RECEIVED');
});
