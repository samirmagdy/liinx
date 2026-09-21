import { db } from '../db.js';
import { createId } from '../utils/ids.js';
import {
  findSiteTemplate,
  normalizeBlockExtra,
  normalizeFormFields,
  type SiteTemplate,
  type SiteTemplateBlock
} from '../../shared/index.js';

/**
 * The only place that writes pages and blocks. Profile duplication, starter-site
 * application, and the block routes all go through these helpers so a row created by
 * one path cannot have columns the other paths do not know about.
 */
export interface CompositionPage {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sortOrder: number;
  isHome: boolean;
  published: boolean;
}

export interface CompositionBlock {
  id: string;
  type: string;
  title: string;
  url: string | null;
  subtitle: string | null;
  icon: string | null;
  badge: string | null;
  highlighted: boolean;
  visible: boolean;
  position: number;
  startAt: number | null;
  endAt: number | null;
  pageId: string;
  extraJson: string | null;
}

export function newPageId(): string { return createId('page'); }
export function newBlockId(): string { return createId('blk'); }

export function insertPages(profileId: string, pages: readonly CompositionPage[], now: number): void {
  const insert = db.prepare('INSERT INTO pages (id, profile_id, slug, title, description, sort_order, is_home, published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const page of pages) {
    insert.run(page.id, profileId, page.slug, page.title, page.description, page.sortOrder, page.isHome ? 1 : 0, page.published ? 1 : 0, now, now);
  }
}

export function insertBlocks(profileId: string, blocks: readonly CompositionBlock[], now: number): void {
  const insert = db.prepare('INSERT INTO blocks (id, profile_id, type, title, url, subtitle, icon, badge, highlighted, visible, position, start_at, end_at, page_id, extra_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const block of blocks) {
    insert.run(block.id, profileId, block.type, block.title, block.url, block.subtitle, block.icon, block.badge,
      block.highlighted ? 1 : 0, block.visible ? 1 : 0, block.position, block.startAt, block.endAt, block.pageId, block.extraJson, now, now);
  }
}

/**
 * Creates a home page and adopts the profile's orphaned blocks. Callers keep deciding *when*
 * one is missing; this keeps the row shape single-sourced.
 */
export function createHomePage(profileId: string, title: string, description: string | null = null, now = Date.now()): string {
  const id = newPageId();
  insertPages(profileId, [{ id, slug: 'home', title, description, sortOrder: 0, isHome: true, published: true }], now);
  db.prepare('UPDATE blocks SET page_id = ? WHERE profile_id = ? AND page_id IS NULL').run(id, profileId);
  return id;
}

export function homePageId(profileId: string): string | undefined {
  const row = db.prepare('SELECT id FROM pages WHERE profile_id = ? AND is_home = 1').get(profileId) as { id: string } | undefined;
  return row?.id;
}

export function nextBlockPosition(profileId: string, pageId: string): number {
  const row = db.prepare('SELECT MAX(position) as maxPos FROM blocks WHERE profile_id = ? AND page_id = ?').get(profileId, pageId) as { maxPos: number | null };
  return row.maxPos === null ? 0 : row.maxPos + 1;
}

export function nextPageSortOrder(profileId: string): number {
  const row = db.prepare('SELECT MAX(sort_order) as maxOrder FROM pages WHERE profile_id = ?').get(profileId) as { maxOrder: number | null };
  return row.maxOrder === null ? 0 : row.maxOrder + 1;
}

/**
 * Starter blocks are authored without item ids. Stored rows always carry them, because the
 * builder keys its repeated editors by id and would treat two rows without one as the same row.
 */
function templateExtra(type: string, extra: Record<string, unknown> | undefined): string | null {
  if (!extra) return null;
  const normalized = normalizeBlockExtra(type, extra);
  if (Array.isArray(normalized.items)) {
    normalized.items = normalized.items.map((item, index) => (
      item && typeof item === 'object' ? { id: `item_${index}`, ...(item as Record<string, unknown>) } : item
    ));
  }
  if (type === 'form' && Array.isArray(normalized.fields)) normalized.fields = normalizeFormFields(normalized.fields);
  return Object.keys(normalized).length ? JSON.stringify(normalized) : null;
}

function compositionBlock(block: SiteTemplateBlock, pageId: string, position: number): CompositionBlock {
  return {
    id: newBlockId(),
    type: block.type,
    title: block.title,
    url: block.url || null,
    subtitle: block.subtitle || null,
    icon: block.icon || null,
    badge: block.badge || null,
    highlighted: Boolean(block.highlighted),
    visible: true,
    position,
    startAt: null,
    endAt: null,
    pageId,
    extraJson: templateExtra(block.type, block.extra)
  };
}

export interface CompositionOutcome {
  pagesAdded: number;
  blocksAdded: number;
}

export type CompositionMode = 'append' | 'replace';

/**
 * Writes a starter composition into a real profile.
 *
 * `append` keeps everything the account already has and adds the template's pages and blocks
 * alongside it; a declared page whose slug already exists is reused rather than duplicated,
 * because the pages table forbids two rows with the same slug. `replace` removes the profile's
 * non-home pages and all of its blocks first, which is why callers must ask for it explicitly.
 */
export const applyComposition = db.transaction((profileId: string, template: SiteTemplate, mode: CompositionMode): CompositionOutcome => {
  const now = Date.now();
  const home = homePageId(profileId)
    || createHomePage(profileId, (db.prepare('SELECT display_name FROM profiles WHERE id = ?').get(profileId) as { display_name?: string } | undefined)?.display_name || 'Home', null, now);

  if (mode === 'replace') {
    db.prepare('DELETE FROM blocks WHERE profile_id = ?').run(profileId);
    db.prepare('DELETE FROM pages WHERE profile_id = ? AND is_home = 0').run(profileId);
  }

  const pageIds = new Map<string, string>([['home', home]]);
  let pagesAdded = 0;
  for (const page of template.pages || []) {
    const existing = db.prepare('SELECT id FROM pages WHERE profile_id = ? AND slug = ?').get(profileId, page.slug) as { id: string } | undefined;
    if (existing) {
      pageIds.set(page.slug, existing.id);
      continue;
    }
    const id = newPageId();
    insertPages(profileId, [{ id, slug: page.slug, title: page.title, description: page.description || null, sortOrder: nextPageSortOrder(profileId), isHome: false, published: true }], now);
    pageIds.set(page.slug, id);
    pagesAdded += 1;
  }

  const positions = new Map<string, number>();
  const blocks = (template.blocks || []).map(block => {
    const pageId = pageIds.get(block.page || 'home') || home;
    const position = positions.get(pageId) ?? nextBlockPosition(profileId, pageId);
    positions.set(pageId, position + 1);
    return compositionBlock(block, pageId, position);
  });
  insertBlocks(profileId, blocks, now);

  return { pagesAdded, blocksAdded: blocks.length };
});

/**
 * A starter site also decides how the page looks. Custom theme overrides are cleared because the
 * client merges them over the preset, so a leftover override would apply the template's colours
 * nowhere. Identity fields are only filled while they are still empty: an existing creator's bio
 * belongs to the creator, and a template does not get to replace it.
 */
export const applySiteTemplate = db.transaction((profileId: string, template: SiteTemplate, mode: CompositionMode): CompositionOutcome => {
  const outcome = applyComposition(profileId, template, mode);
  const profile = db.prepare('SELECT category, bio, share_title as shareTitle, share_description as shareDescription FROM profiles WHERE id = ?')
    .get(profileId) as { category?: string | null; bio?: string | null; shareTitle?: string | null; shareDescription?: string | null } | undefined;
  const isDefaultCategory = !profile?.category || profile.category === 'Creator';
  db.prepare('UPDATE profiles SET theme_id = ?, category = ?, custom_theme_json = NULL, bio = ?, share_title = ?, share_description = ?, updated_at = ? WHERE id = ?')
    .run(template.themeId,
      isDefaultCategory ? template.category : profile!.category,
      (profile?.bio ? profile.bio : template.profile?.bio) || null,
      (profile?.shareTitle ? profile.shareTitle : template.profile?.shareTitle) || null,
      (profile?.shareDescription ? profile.shareDescription : template.profile?.shareDescription) || null,
      Date.now(), profileId);
  return outcome;
});

/** Applies a catalog entry by id. Returns null when the id is not a real starter site. */
export function applySiteTemplateById(profileId: string, templateId: unknown, mode: CompositionMode): CompositionOutcome | null {
  const template = findSiteTemplate(templateId);
  if (!template) return null;
  return applySiteTemplate(profileId, template, mode);
}
