import { Router } from 'express';
import { db } from '../db.js';
import { bookingUrl } from '../../src/utils/booking.js';
import { blockExtraSchemas, normalizeFormFields, parseBlockContract, type ContractBlockType } from '../contracts.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { invalidatePublicProfileCache } from './profiles.js';
import { createId } from '../utils/ids.js';
import bcrypt from 'bcryptjs';
import { sharedRateLimit } from '../middleware/rateLimit.js';
import { hasEntitlement } from '../entitlements.js';
import { cleanupUploadedFileIfUnreferenced } from '../services/uploadLifecycle.js';

export const blocksRouter = Router();

interface BlockRequestData {
  type?: ContractBlockType;
  title?: string;
  url?: string | null;
  subtitle?: string | null;
  badge?: string | null;
  icon?: string | null;
  highlighted?: boolean;
  startAt?: number | null;
  endAt?: number | null;
  pageId?: string;
  extra?: Record<string, unknown>;
}

function prepareBlockExtra(type: string, extra: Record<string, unknown> | undefined): string | null {
  if (!extra) return null;
  const copy = { ...extra };
  if (type === 'form' && Array.isArray(copy.fields)) copy.fields = normalizeFormFields(copy.fields);
  if (type === 'content_gate' && typeof copy.password === 'string' && copy.password.length > 0) {
    copy.passwordHash = bcrypt.hashSync(copy.password, 12);
    delete copy.password;
  } else if (type === 'content_gate' && copy.password === '') {
    delete copy.password;
    delete copy.passwordHash;
  }
  return JSON.stringify(copy);
}

function ownedUploadForUser(fileUrl: unknown, userId: string): boolean {
  if (typeof fileUrl !== 'string' || !fileUrl.startsWith('/uploads/')) return true;
  return Boolean(db.prepare('SELECT 1 FROM uploaded_files WHERE path = ? AND owner_user_id = ?').get(fileUrl, userId));
}

// Public content-gate verification. Protected content is deliberately returned
// only after the password is checked server-side; it is never included in the
// public profile response.
blocksRouter.post('/content-gates/verify', sharedRateLimit({ name: 'content-gate', limit: 10, windowMs: 15 * 60 * 1000 }), async (req, res) => {
  const { profileId, blockId, password } = req.body || {};
  if (typeof profileId !== 'string' || typeof blockId !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'A valid access code is required.' });
  }
  if (password.length === 0 || password.length > 128) return res.status(400).json({ error: 'An access code is required.' });
  const row = db.prepare(`
    SELECT b.extra_json
    FROM blocks b
    INNER JOIN pages p ON p.id = b.page_id AND p.profile_id = b.profile_id
    WHERE b.id = ? AND b.profile_id = ? AND b.type = 'content_gate' AND p.published = 1
      AND (b.start_at IS NULL OR b.start_at <= ?) AND (b.end_at IS NULL OR b.end_at > ?)
  `).get(blockId, profileId, Date.now(), Date.now()) as { extra_json?: string | null } | undefined;
  if (!row?.extra_json) return res.status(404).json({ error: 'This gated content is unavailable.' });
  let extra: any;
  try { extra = JSON.parse(row.extra_json); } catch { return res.status(500).json({ error: 'This gated content is corrupted.' }); }
  if (typeof extra.passwordHash !== 'string' || !extra.passwordHash.startsWith('$2')) return res.status(500).json({ error: 'This gated content is unavailable.' });
  try {
    if (!(await bcrypt.compare(password, extra.passwordHash))) return res.status(403).json({ error: 'The access code is not correct.' });
  } catch {
    return res.status(500).json({ error: 'This gated content is unavailable.' });
  }
  res.json({ unlocked: true, body: typeof extra.body === 'string' ? extra.body : '' });
});

// Create new block
blocksRouter.post('/studio/blocks', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const parse = parseBlockContract(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const { type, title, url, subtitle, badge, icon, highlighted, startAt, endAt, pageId, extra } = parse.data as BlockRequestData & { type: ContractBlockType; title: string };
    if (type === 'download' && !ownedUploadForUser(extra?.fileUrl, req.user!.userId)) {
      return res.status(403).json({ error: 'The uploaded file does not belong to this account.' });
    }
    if (type === 'booking' && (!bookingUrl(url) || extra != null)) {
      return res.status(400).json({ error: 'A valid Calendly event URL is required; booking blocks do not accept extra fields.' });
    }
    const profileId = req.user!.profileId;
    const profile = db.prepare('SELECT plan, display_name as displayName FROM profiles WHERE id = ?').get(profileId) as { plan?: string; displayName?: string } | undefined;
    const selectedPage = pageId
      ? db.prepare('SELECT id FROM pages WHERE id = ? AND profile_id = ?').get(pageId, profileId) as { id: string } | undefined
      : db.prepare('SELECT id FROM pages WHERE profile_id = ? AND is_home = 1').get(profileId) as { id: string } | undefined;
    if (!selectedPage && !pageId && profile) {
      const homeId = createId('page');
      db.prepare(`INSERT INTO pages (id, profile_id, slug, title, description, sort_order, is_home, published, created_at, updated_at) VALUES (?, ?, 'home', ?, NULL, 0, 1, 1, ?, ?)`)
        .run(homeId, profileId, profile.displayName || 'Home', Date.now(), Date.now());
    }
    const resolvedPage = selectedPage || (!pageId ? db.prepare('SELECT id FROM pages WHERE profile_id = ? AND is_home = 1').get(profileId) as { id: string } | undefined : undefined);
    if (!resolvedPage) return res.status(400).json({ error: 'The selected page does not belong to this profile.' });
    if (!hasEntitlement(profile?.plan, 'scheduling') && (startAt != null || endAt != null)) {
      return res.status(403).json({ error: 'Scheduled links require a Pro or Studio subscription plan.' });
    }
    const now = Date.now();
    const id = createId('blk');

    // Get current max position
    const maxPosRow = db.prepare('SELECT MAX(position) as maxPos FROM blocks WHERE profile_id = ? AND page_id = ?').get(profileId, resolvedPage.id) as { maxPos: number | null };
    const nextPos = (maxPosRow && maxPosRow.maxPos !== null) ? maxPosRow.maxPos + 1 : 0;

    db.prepare(`
      INSERT INTO blocks (
        id, profile_id, type, title, url, subtitle, icon, badge, highlighted, position, start_at, end_at, page_id, extra_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      profileId,
      type,
      title,
      url || null,
      subtitle || null,
      icon || null,
      badge || null,
      highlighted ? 1 : 0,
      nextPos,
      startAt || null,
      endAt || null,
      resolvedPage.id,
      prepareBlockExtra(type, extra),
      now,
      now
    );
    invalidatePublicProfileCache(profileId);

    res.status(201).json({
      id,
      revision: now,
      type,
      title,
      url: url || null,
      subtitle: subtitle || null,
      icon: icon || null,
      badge: badge || null,
      highlighted: Boolean(highlighted),
      startAt: startAt || null,
      endAt: endAt || null,
      position: nextPos,
      pageId: resolvedPage.id,
      clicks: 0,
      ...(type === 'content_gate' ? { locked: typeof extra?.password === 'string' && extra.password.length > 0 } : (extra || {}))
    });
  } catch (err: any) {
    console.error('Create block error:', err);
    res.status(500).json({ error: 'Failed to create block.' });
  }
});

// Reorder blocks (must precede parameterized /:id route)
blocksRouter.put('/studio/blocks/reorder', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { blockIds, pageId } = req.body;
    if (!Array.isArray(blockIds) || blockIds.length === 0) {
      return res.status(400).json({ error: 'blockIds array is required.' });
    }

    const profileId = req.user!.profileId;
    const page = pageId ? db.prepare('SELECT id FROM pages WHERE id = ? AND profile_id = ?').get(pageId, profileId) as { id: string } | undefined : undefined;
    if (pageId && !page) return res.status(400).json({ error: 'The selected page does not belong to this profile.' });
    if (!pageId) {
      const requested = db.prepare(`SELECT id, page_id as pageId FROM blocks WHERE profile_id = ? AND id IN (${blockIds.map(() => '?').join(',')})`).all(profileId, ...blockIds) as Array<{ id: string; pageId: string | null }>;
      if (requested.length !== blockIds.length || new Set(requested.map(block => block.pageId)).size !== 1) return res.status(400).json({ error: 'A valid pageId is required to reorder these blocks.' });
    }
    const owned = page
      ? db.prepare('SELECT id FROM blocks WHERE profile_id = ? AND page_id = ? ORDER BY position ASC').all(profileId, page.id) as { id: string }[]
      : db.prepare('SELECT id FROM blocks WHERE profile_id = ? ORDER BY position ASC').all(profileId) as { id: string }[];
    const ownedIds = owned.map(block => block.id);
    if (blockIds.length !== ownedIds.length || new Set(blockIds).size !== blockIds.length || blockIds.some((id: string) => !ownedIds.includes(id))) {
      return res.status(400).json({ error: 'Please include every block exactly once when reordering.' });
    }
    const updatePos = page
      ? db.prepare('UPDATE blocks SET position = ? WHERE id = ? AND profile_id = ? AND page_id = ?')
      : db.prepare('UPDATE blocks SET position = ? WHERE id = ? AND profile_id = ?');

    const reorderTx = db.transaction(() => {
      // The uniqueness invariant requires a temporary disjoint range while
      // positions are swapped one row at a time.
      ownedIds.forEach((id, index) => {
        if (page) {
          updatePos.run(index + 1000000, id, profileId, page.id);
        } else {
          updatePos.run(index + 1000000, id, profileId);
        }
      });
      blockIds.forEach((id: string, index: number) => {
        if (page) {
          updatePos.run(index, id, profileId, page.id);
        } else {
          updatePos.run(index, id, profileId);
        }
      });
    });

    reorderTx();
    invalidatePublicProfileCache(profileId);
    res.json({ success: true, message: 'Blocks reordered successfully.' });
  } catch (err: any) {
    console.error('Reorder blocks error:', err);
    res.status(500).json({ error: 'Failed to reorder blocks.' });
  }
});

blocksRouter.put('/studio/blocks/:id/move', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const blockId = req.params.id;
    const profileId = req.user!.profileId;
    const targetPageId = typeof req.body?.pageId === 'string' ? req.body.pageId : '';
    const block = db.prepare('SELECT id, page_id as pageId FROM blocks WHERE id = ? AND profile_id = ?').get(blockId, profileId) as { id: string; pageId: string | null } | undefined;
    const page = db.prepare('SELECT id FROM pages WHERE id = ? AND profile_id = ?').get(targetPageId, profileId) as { id: string } | undefined;
    if (!block || !page) return res.status(400).json({ error: 'The block and destination page must belong to this profile.' });
    if (block.pageId === page.id) return res.json({ success: true, block: { id: block.id, pageId: page.id } });
    const max = db.prepare('SELECT COALESCE(MAX(position), -1) as value FROM blocks WHERE profile_id = ? AND page_id = ?').get(profileId, page.id) as { value: number };
    db.prepare('UPDATE blocks SET page_id = ?, position = ?, updated_at = ? WHERE id = ? AND profile_id = ?').run(page.id, max.value + 1, Date.now(), blockId, profileId);
    invalidatePublicProfileCache(profileId);
    res.json({ success: true, block: { id: block.id, pageId: page.id, position: max.value + 1 } });
  } catch (err: any) {
    console.error('Move block error:', err);
    res.status(500).json({ error: 'Failed to move block.' });
  }
});

blocksRouter.post('/studio/blocks/:id/duplicate', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const blockId = req.params.id;
    const profileId = req.user!.profileId;
    const source = db.prepare('SELECT * FROM blocks WHERE id = ? AND profile_id = ?').get(blockId, profileId) as any;
    if (!source) return res.status(404).json({ error: 'Block not found or unauthorized.' });
    const targetPageId = typeof req.body?.pageId === 'string' ? req.body.pageId : source.page_id;
    const page = db.prepare('SELECT id FROM pages WHERE id = ? AND profile_id = ?').get(targetPageId, profileId) as { id: string } | undefined;
    if (!page) return res.status(400).json({ error: 'The destination page does not belong to this profile.' });
    const max = db.prepare('SELECT COALESCE(MAX(position), -1) as value FROM blocks WHERE profile_id = ? AND page_id = ?').get(profileId, page.id) as { value: number };
    const now = Date.now();
    const id = createId('blk');
    db.prepare(`INSERT INTO blocks (id, profile_id, type, title, url, subtitle, icon, badge, highlighted, position, start_at, end_at, page_id, extra_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, profileId, source.type, source.title, source.url, source.subtitle, source.icon, source.badge, source.highlighted, max.value + 1, source.start_at, source.end_at, page.id, source.extra_json, now, now);
    invalidatePublicProfileCache(profileId);
    res.status(201).json({ success: true, block: { id, revision: now, type: source.type, title: source.title, url: source.url, subtitle: source.subtitle, icon: source.icon, badge: source.badge, highlighted: Boolean(source.highlighted), position: max.value + 1, pageId: page.id } });
  } catch (err: any) {
    console.error('Duplicate block error:', err);
    res.status(500).json({ error: 'Failed to duplicate block.' });
  }
});

// Update block
blocksRouter.put('/studio/blocks/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const blockId = req.params.id;
    const profileId = req.user!.profileId;

    // Check ownership
    const existing = db.prepare('SELECT * FROM blocks WHERE id = ? AND profile_id = ?').get(blockId, profileId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Block not found or unauthorized.' });
    }

    const parse = parseBlockContract(req.body, existing.type as ContractBlockType);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const now = Date.now();
    const data = parse.data as BlockRequestData;
    const revision = (parse.data as { revision?: number }).revision;
    const profile = db.prepare('SELECT plan FROM profiles WHERE id = ?').get(profileId) as { plan?: string } | undefined;
        if (!hasEntitlement(profile?.plan, 'scheduling') && (data.startAt != null || data.endAt != null || existing.start_at != null || existing.end_at != null)) {
      return res.status(403).json({ error: 'Scheduled links require a Pro or Studio subscription plan.' });
    }
    if (existing.type === 'booking' && (!bookingUrl(data.url === undefined ? existing.url : data.url) || data.extra != null)) {
      return res.status(400).json({ error: 'A valid Calendly event URL is required; booking blocks do not accept extra fields.' });
    }

    let existingExtra: Record<string, unknown> = {};
    if (existing.extra_json) {
      try { existingExtra = JSON.parse(existing.extra_json); } catch (e) {}
    }

    const mergedExtra = data.extra !== undefined ? { ...existingExtra, ...data.extra } : existingExtra;
    const previousFileUrl = existing.type === 'download' && typeof (existingExtra as any).fileUrl === 'string' ? (existingExtra as any).fileUrl : null;
    if (data.extra !== undefined) {
      const extraParse = blockExtraSchemas[existing.type as ContractBlockType].safeParse(mergedExtra);
      if (!extraParse.success) return res.status(400).json({ error: extraParse.error.issues[0]?.message || 'Invalid block data.' });
    }
    if (existing.type === 'download' && !ownedUploadForUser(mergedExtra.fileUrl, req.user!.userId)) {
      return res.status(403).json({ error: 'The uploaded file does not belong to this account.' });
    }

    const saved = db.prepare(`
      UPDATE blocks
      SET title = coalesce(?, title),
          url = ?,
          subtitle = ?,
          badge = ?,
          icon = ?,
          highlighted = ?,
          start_at = ?,
          end_at = ?,
          extra_json = ?,
          updated_at = ?
      WHERE id = ? AND profile_id = ? AND (? IS NULL OR updated_at = ?)
    `).run(
      data.title !== undefined ? data.title : existing.title,
      data.url !== undefined ? data.url : existing.url,
      data.subtitle !== undefined ? data.subtitle : existing.subtitle,
      data.badge !== undefined ? data.badge : existing.badge,
      data.icon !== undefined ? data.icon : existing.icon,
      data.highlighted !== undefined ? (data.highlighted ? 1 : 0) : existing.highlighted,
      data.startAt !== undefined ? data.startAt : existing.start_at,
      data.endAt !== undefined ? data.endAt : existing.end_at,
      data.extra !== undefined ? prepareBlockExtra(existing.type, mergedExtra) : existing.extra_json,
      now,
      blockId,
      profileId,
      revision ?? null,
      revision ?? null
    );

    if (saved.changes === 0) return res.status(409).json({ error: 'This block changed in another tab. Reload it before retrying your changes.' });
    const nextFileUrl = existing.type === 'download' && typeof (mergedExtra as any).fileUrl === 'string' ? (mergedExtra as any).fileUrl : null;
    if (previousFileUrl && previousFileUrl !== nextFileUrl) cleanupUploadedFileIfUnreferenced(previousFileUrl, req.user!.userId);
    res.json({ success: true, revision: now, message: 'Block updated successfully.' });
    invalidatePublicProfileCache(profileId);
  } catch (err: any) {
    console.error('Update block error:', err);
    res.status(500).json({ error: 'Failed to update block.' });
  }
});

// Delete block
blocksRouter.delete('/studio/blocks/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const blockId = req.params.id;
    const profileId = req.user!.profileId;

    const existing = db.prepare('SELECT type, extra_json FROM blocks WHERE id = ? AND profile_id = ?').get(blockId, profileId) as { type: string; extra_json?: string | null } | undefined;
    let previousFileUrl: string | null = null;
    if (existing?.type === 'download' && existing.extra_json) {
      try { const extra = JSON.parse(existing.extra_json); previousFileUrl = typeof extra?.fileUrl === 'string' ? extra.fileUrl : null; } catch { previousFileUrl = null; }
    }
    const result = db.prepare('DELETE FROM blocks WHERE id = ? AND profile_id = ?').run(blockId, profileId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Block not found or unauthorized.' });
    }

    if (previousFileUrl) cleanupUploadedFileIfUnreferenced(previousFileUrl, req.user!.userId);

    res.json({ success: true, message: 'Block deleted successfully.' });
    invalidatePublicProfileCache(profileId);
  } catch (err: any) {
    console.error('Delete block error:', err);
    res.status(500).json({ error: 'Failed to delete block.' });
  }
});
