import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { parseBlockContract } from '../contracts.js';
import { createId } from '../utils/ids.js';
import { invalidatePublicProfileCache } from './profiles.js';
import { hasEntitlement } from '../entitlements.js';
import { sharedRateLimit } from '../middleware/rateLimit.js';

export const apiV1Router = Router();

// Operational quota for the public API: 120 requests/minute per source IP.
// This is deliberately separate from Studio authentication limits.
apiV1Router.use('/v1', sharedRateLimit({ name: 'api-v1', limit: 120, windowMs: 60000 }));

// Middleware: Authenticate with API Key (liinx_live_...)
export interface ApiKeyRequest extends Request {
  profile?: any;
  apiKeyId?: string;
}

export function requireApiKey(req: ApiKeyRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'API key required. Include "Authorization: Bearer liinx_live_..." header.'
    });
  }

  const rawKey = authHeader.split(' ')[1].trim();
  if (!rawKey.startsWith('liinx_live_')) {
    return res.status(401).json({ error: 'Invalid API key format. Keys start with liinx_live_' });
  }

  const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyRecord = db.prepare('SELECT * FROM api_keys WHERE key_hash = ? AND (expires_at IS NULL OR expires_at > ?)').get(hash, Date.now()) as any;

  if (!keyRecord) {
    return res.status(401).json({ error: 'Invalid or revoked API key.' });
  }

  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(keyRecord.profile_id) as any;
  if (!profile) {
    return res.status(404).json({ error: 'Associated creator profile not found.' });
  }

  req.profile = profile;
  if (!hasEntitlement(profile.plan, 'apiAccess')) {
    return res.status(403).json({ error: 'Public REST API access is available exclusively on the Studio tier.' });
  }
  req.apiKeyId = keyRecord.id;
  next();
}

// -------------------------------------------------------------
// Studio API Key Management Routes (Authenticated via JWT)
// -------------------------------------------------------------

// List API Keys
apiV1Router.get('/studio/api-keys', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const profileId = req.user!.profileId;
    const keys = db.prepare(`
      SELECT id, prefix, name, created_at as createdAt
        , expires_at as expiresAt
      FROM api_keys
      WHERE profile_id = ? AND (expires_at IS NULL OR expires_at > ?)
      ORDER BY created_at DESC
    `).all(profileId, Date.now()) as any[];

    res.json({ keys, pagination: { limit: keys.length, hasMore: false } });
  } catch (err: any) {
    console.error('List API keys error:', err);
    res.status(500).json({ error: 'Failed to retrieve API keys' });
  }
});

const createKeySchema = z.object({
  name: z.string().trim().min(1, 'Key name is required').max(50)
});

// Generate New API Key (Studio Plan Required)
apiV1Router.post('/studio/api-keys', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = db.prepare('SELECT plan FROM profiles WHERE id = ?').get(req.user!.profileId) as any;
    if (!profile || !hasEntitlement(profile.plan, 'apiAccess')) {
      return res.status(403).json({
        error: 'Public REST API access is available exclusively on the Studio tier. Please upgrade to create API keys.'
      });
    }

    const parse = createKeySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const rawSecret = crypto.randomBytes(24).toString('hex');
    const fullKey = `liinx_live_${rawSecret}`;
    const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex');
    const prefix = `liinx_live_${rawSecret.substring(0, 6)}...`;
    const keyId = createId('key');
    const now = Date.now();
    const expiresAt = now + 90 * 24 * 60 * 60 * 1000;

    db.prepare(`
      INSERT INTO api_keys (id, profile_id, key_hash, prefix, name, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(keyId, req.user!.profileId, keyHash, prefix, parse.data.name, expiresAt, now);

    res.status(201).json({
      success: true,
      key: {
        id: keyId,
        name: parse.data.name,
        prefix,
        createdAt: now,
        expiresAt
      },
      apiKey: fullKey,
      warning: 'Please copy your API key now. You will not be able to view it again.'
    });
  } catch (err: any) {
    console.error('Generate API key error:', err);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

// Revoke API Key
apiV1Router.delete('/studio/api-keys/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const keyId = req.params.id;
    const profileId = req.user!.profileId;

    const result = db.prepare('DELETE FROM api_keys WHERE id = ? AND profile_id = ?').run(keyId, profileId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'API key not found or unauthorized' });
    }

    res.json({ success: true, message: 'API key revoked successfully' });
  } catch (err: any) {
    console.error('Revoke API key error:', err);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

// -------------------------------------------------------------
// Public REST API v1 Endpoints (Authenticated via API Key)
// -------------------------------------------------------------

// GET /api/v1/profile
apiV1Router.get('/v1/profile', requireApiKey, (req: ApiKeyRequest, res: Response) => {
  try {
    const profile = req.profile;
    const limitValue = Number(req.query.limit ?? 100);
    const offsetValue = Number(req.query.offset ?? 0);
    if (!Number.isInteger(limitValue) || limitValue < 1 || limitValue > 100 || !Number.isInteger(offsetValue) || offsetValue < 0) {
      return res.status(400).json({ error: 'limit must be 1-100 and offset must be a non-negative integer.' });
    }
    const pages = db.prepare('SELECT id, slug, title, description, sort_order as sortOrder, is_home as isHome, published FROM pages WHERE profile_id = ? ORDER BY sort_order ASC, id ASC').all(profile.id);
    const blocks = db.prepare('SELECT id, type, title, url, subtitle, badge, icon, highlighted, position, page_id as pageId, created_at FROM blocks WHERE profile_id = ? ORDER BY page_id ASC, position ASC, id ASC LIMIT ? OFFSET ?').all(profile.id, limitValue, offsetValue);
    const total = (db.prepare('SELECT COUNT(*) AS count FROM blocks WHERE profile_id = ?').get(profile.id) as { count: number }).count;

    res.json({
      id: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      bio: profile.bio,
      avatarUrl: profile.avatar_url,
      plan: profile.plan,
      customDomain: profile.custom_domain,
      pages,
      blocks,
      pagination: { limit: limitValue, offset: offsetValue, total, hasMore: offsetValue + blocks.length < total }
    });
  } catch (err: any) {
    console.error('v1 profile error:', err);
    res.status(500).json({ error: 'Failed to retrieve profile via API' });
  }
});

// POST /api/v1/blocks
apiV1Router.post('/v1/blocks', requireApiKey, (req: ApiKeyRequest, res: Response) => {
  try {
    if (req.body?.type !== undefined && req.body.type !== 'link') {
      return res.status(400).json({ error: 'API v1 currently supports link block creation only.' });
    }
    const parse = parseBlockContract({ ...req.body, type: 'link' });
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const profile = req.profile;
    const { title, url, subtitle, badge, highlighted, pageId } = parse.data as {
      title: string; url: string; subtitle?: string | null; badge?: string | null; highlighted?: boolean;
      pageId?: string;
    };
    const idempotencyKey = req.header('Idempotency-Key')?.trim() || null;
    if (idempotencyKey && !/^[A-Za-z0-9._:-]{1,100}$/.test(idempotencyKey)) {
      return res.status(400).json({ error: 'Idempotency-Key must be 1-100 safe characters.' });
    }
    if (idempotencyKey) {
      const existingKey = db.prepare('SELECT profile_id, response_json FROM api_idempotency_keys WHERE request_key = ?').get(idempotencyKey) as { profile_id: string; response_json: string } | undefined;
      if (existingKey && existingKey.profile_id !== req.profile!.id) return res.status(409).json({ error: 'Idempotency-Key is already associated with another profile.' });
      if (existingKey) return res.status(200).json({ ...JSON.parse(existingKey.response_json), idempotentReplay: true });
    }
    const now = Date.now();
    const id = createId('blk');
    const createBlock = db.transaction(() => {
      let targetPage = pageId
        ? db.prepare('SELECT id FROM pages WHERE id = ? AND profile_id = ?').get(pageId, profile.id) as { id: string } | undefined
        : db.prepare('SELECT id FROM pages WHERE profile_id = ? AND is_home = 1').get(profile.id) as { id: string } | undefined;
      if (!targetPage) {
        if (pageId) throw new Error('PAGE_NOT_FOUND');
        const homeId = createId('page');
        db.prepare(`INSERT INTO pages (id, profile_id, slug, title, description, sort_order, is_home, published, created_at, updated_at) VALUES (?, ?, 'home', ?, NULL, 0, 1, 1, ?, ?)`).run(homeId, profile.id, profile.display_name || 'Home', now, now);
        targetPage = { id: homeId };
      }

      const maxPosRow = db.prepare('SELECT MAX(position) as maxPos FROM blocks WHERE profile_id = ? AND page_id = ?').get(profile.id, targetPage.id) as { maxPos: number | null };
    const nextPos = (maxPosRow && maxPosRow.maxPos !== null) ? maxPosRow.maxPos + 1 : 0;

    db.prepare(`
      INSERT INTO blocks (id, profile_id, type, title, url, subtitle, badge, highlighted, position, page_id, created_at, updated_at)
      VALUES (?, ?, 'link', ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, profile.id, title, url, subtitle || null, badge || null, highlighted ? 1 : 0, nextPos, targetPage.id, now, now);
      const response = { success: true, block: { id, type: 'link', title, url, subtitle: subtitle || null, badge: badge || null, highlighted: Boolean(highlighted), position: nextPos, pageId: targetPage.id, createdAt: now } };
      if (idempotencyKey) db.prepare('INSERT INTO api_idempotency_keys (request_key, profile_id, response_json, created_at) VALUES (?, ?, ?, ?)').run(idempotencyKey, profile.id, JSON.stringify(response), now);
      return response;
    });
    let payload;
    try { payload = createBlock(); } catch (error: any) {
      if (error?.message === 'PAGE_NOT_FOUND') return res.status(404).json({ error: 'The selected page does not belong to this profile.' });
      throw error;
    }
    invalidatePublicProfileCache(profile.id);
    res.status(201).json(payload);
  } catch (err: any) {
    console.error('v1 create block error:', err);
    res.status(500).json({ error: 'Failed to create block via API' });
  }
});

// DELETE /api/v1/blocks/:id
apiV1Router.delete('/v1/blocks/:id', requireApiKey, (req: ApiKeyRequest, res: Response) => {
  try {
    const blockId = req.params.id;
    const profile = req.profile;

    const result = db.prepare('DELETE FROM blocks WHERE id = ? AND profile_id = ?').run(blockId, profile.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Block not found or does not belong to your profile' });
    }
    invalidatePublicProfileCache(profile.id);

    res.json({ success: true, message: 'Block deleted successfully' });
  } catch (err: any) {
    console.error('v1 delete block error:', err);
    res.status(500).json({ error: 'Failed to delete block via API' });
  }
});
