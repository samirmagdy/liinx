import { Router } from 'express';
import { db } from '../db.js';
import { pageContract, pageUpdateContract } from '../contracts.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { createId } from '../utils/ids.js';
import { invalidatePublicProfileCache } from './profiles.js';
import { RESERVED_USERNAMES } from '../../src/config/brand.js';

export const pagesRouter = Router();

const pageSchema = pageContract;
const pageUpdateSchema = pageUpdateContract;
const RESERVED_PAGE_SLUGS = new Set<string>(['home', ...RESERVED_USERNAMES]);

function pageForUser(pageId: string, userId: string) {
  return db.prepare(`
    SELECT pages.* FROM pages
    JOIN profiles ON profiles.id = pages.profile_id
    WHERE pages.id = ? AND profiles.user_id = ?
  `).get(pageId, userId) as any;
}

function invalidateProfile(profileId: string) {
  invalidatePublicProfileCache(profileId);
}

pagesRouter.get('/studio/pages', requireAuth, (req: AuthenticatedRequest, res) => {
  const pages = db.prepare(`SELECT id, slug, title, description, sort_order as sortOrder, is_home as isHome, published, created_at as createdAt, updated_at as updatedAt, updated_at as revision FROM pages WHERE profile_id = ? ORDER BY sort_order ASC, created_at ASC`).all(req.user!.profileId) as any[];
  res.json({ pages: pages.map(page => ({ ...page, isHome: Boolean(page.isHome), published: Boolean(page.published) })) });
});

pagesRouter.post('/studio/pages', requireAuth, (req: AuthenticatedRequest, res) => {
  const parsed = pageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const profileId = req.user!.profileId;
  if (RESERVED_PAGE_SLUGS.has(parsed.data.slug)) return res.status(400).json({ error: 'This page slug is reserved. Choose another URL slug.' });
  const existing = db.prepare('SELECT id FROM pages WHERE profile_id = ? AND slug = ?').get(profileId, parsed.data.slug);
  if (existing) return res.status(409).json({ error: 'A page with this slug already exists.' });
  const max = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as value FROM pages WHERE profile_id = ?').get(profileId) as { value: number };
  const now = Date.now();
  const page = { id: createId('page'), profileId, slug: parsed.data.slug, title: parsed.data.title, description: parsed.data.description || null, sortOrder: max.value + 1, isHome: false, published: parsed.data.published !== false, createdAt: now, updatedAt: now, revision: now };
  db.prepare(`INSERT INTO pages (id, profile_id, slug, title, description, sort_order, is_home, published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`).run(page.id, profileId, page.slug, page.title, page.description, page.sortOrder, page.published ? 1 : 0, now, now);
  invalidateProfile(profileId);
  res.status(201).json({ page });
});

pagesRouter.put('/studio/pages/reorder', requireAuth, (req: AuthenticatedRequest, res) => {
  const ids = req.body?.pageIds;
  if (!Array.isArray(ids) || ids.length === 0 || new Set(ids).size !== ids.length) return res.status(400).json({ error: 'pageIds must include every page exactly once.' });
  const owned = db.prepare('SELECT id FROM pages WHERE profile_id = ? ORDER BY sort_order ASC').all(req.user!.profileId) as Array<{ id: string }>;
  const ownedIds = owned.map(page => page.id);
  if (ids.length !== ownedIds.length || ids.some((id: unknown) => typeof id !== 'string' || !ownedIds.includes(id))) return res.status(400).json({ error: 'pageIds must include every page exactly once.' });
  const home = db.prepare('SELECT id FROM pages WHERE profile_id = ? AND is_home = 1').get(req.user!.profileId) as { id: string } | undefined;
  if (home && ids[0] !== home.id) return res.status(400).json({ error: 'The home page must remain first.' });
  const update = db.prepare('UPDATE pages SET sort_order = ?, updated_at = ? WHERE id = ? AND profile_id = ?');
  const now = Date.now();
  db.transaction(() => ids.forEach((id: string, index: number) => update.run(index, now, id, req.user!.profileId)))();
  invalidateProfile(req.user!.profileId);
  const pages = db.prepare('SELECT id, slug, title, description, sort_order as sortOrder, is_home as isHome, published, created_at as createdAt, updated_at as updatedAt, updated_at as revision FROM pages WHERE profile_id = ? ORDER BY sort_order ASC, created_at ASC').all(req.user!.profileId) as any[];
  res.json({ success: true, pages: pages.map(page => ({ ...page, isHome: Boolean(page.isHome), published: Boolean(page.published) })) });
});

pagesRouter.put('/studio/pages/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const page = pageForUser(req.params.id, req.user!.userId);
  if (!page) return res.status(404).json({ error: 'Page not found.' });
  const parsed = pageUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  if (page.is_home && parsed.data.slug && parsed.data.slug !== 'home') return res.status(400).json({ error: 'The home page slug cannot be changed.' });
  if (!page.is_home && parsed.data.slug && RESERVED_PAGE_SLUGS.has(parsed.data.slug)) return res.status(400).json({ error: 'This page slug is reserved. Choose another URL slug.' });
  if (parsed.data.slug && parsed.data.slug !== page.slug) {
    const duplicate = db.prepare('SELECT id FROM pages WHERE profile_id = ? AND slug = ? AND id != ?').get(page.profile_id, parsed.data.slug, page.id);
    if (duplicate) return res.status(409).json({ error: 'A page with this slug already exists.' });
  }
  const next = { slug: page.is_home ? 'home' : (parsed.data.slug ?? page.slug), title: parsed.data.title ?? page.title, description: parsed.data.description === undefined ? page.description : parsed.data.description, published: page.is_home ? true : (parsed.data.published === undefined ? Boolean(page.published) : parsed.data.published), sortOrder: parsed.data.sortOrder ?? page.sort_order };
  const revision = parsed.data.revision;
  const now = Date.now();
  const result = db.prepare('UPDATE pages SET slug = ?, title = ?, description = ?, published = ?, sort_order = ?, updated_at = ? WHERE id = ? AND profile_id = ? AND (? IS NULL OR updated_at = ?)').run(next.slug, next.title, next.description || null, next.published ? 1 : 0, next.sortOrder, now, page.id, page.profile_id, revision ?? null, revision ?? null);
  if (result.changes === 0) return res.status(409).json({ error: 'This page changed in another tab. Reload it before retrying your changes.' });
  invalidateProfile(page.profile_id);
  res.json({ success: true, revision: now });
});

pagesRouter.delete('/studio/pages/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const page = pageForUser(req.params.id, req.user!.userId);
  if (!page) return res.status(404).json({ error: 'Page not found.' });
  if (page.is_home) return res.status(400).json({ error: 'The home page cannot be deleted.' });
  const home = db.prepare('SELECT id FROM pages WHERE profile_id = ? AND is_home = 1').get(page.profile_id) as { id: string };
  if (!home) return res.status(409).json({ error: 'The Home page is unavailable, so this page cannot be deleted safely.' });
  const blockCount = db.prepare('SELECT COUNT(*) as count FROM blocks WHERE page_id = ? AND profile_id = ?').get(page.id, page.profile_id) as { count: number };
  if (!page.published && blockCount.count > 0) return res.status(409).json({ error: 'This unpublished page has blocks. Publish it or remove its blocks before deleting so draft content is not exposed on Home.' });
  db.transaction(() => {
    const blocks = db.prepare('SELECT id FROM blocks WHERE page_id = ? AND profile_id = ? ORDER BY position ASC, created_at ASC, id ASC').all(page.id, page.profile_id) as Array<{ id: string }>;
    db.prepare('UPDATE blocks SET position = position + 1000000 WHERE page_id = ? AND profile_id = ?').run(page.id, page.profile_id);
    const maxPosition = db.prepare('SELECT COALESCE(MAX(position), -1) as value FROM blocks WHERE page_id = ? AND profile_id = ?').get(home.id, page.profile_id) as { value: number };
    const moveBlock = db.prepare('UPDATE blocks SET page_id = ?, position = ? WHERE id = ? AND profile_id = ?');
    blocks.forEach((block, index) => moveBlock.run(home.id, maxPosition.value + 1 + index, block.id, page.profile_id));
    db.prepare('DELETE FROM pages WHERE id = ? AND profile_id = ?').run(page.id, page.profile_id);
  })();
  invalidateProfile(page.profile_id);
  res.json({ success: true, message: 'Page deleted. Its blocks were moved to Home in their original order.' });
});
