import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';

const createdProfileIds: string[] = [];

function addProfile(
  suffix: string,
  options: { bio?: string; redirect?: string; redirectUntil?: number } = {}
) {
  const id = `seo_profile_${suffix}`;
  const username = `seo-${suffix}`;
  const timestamp = Date.UTC(2025, 0, 1);
  db.prepare(`INSERT INTO profiles
    (id, username, display_name, bio, page_redirect_url, page_redirect_until, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, username, `SEO ${suffix}`, options.bio || null, options.redirect || null, options.redirectUntil || null, timestamp, timestamp);
  createdProfileIds.push(id);
  const pageId = `seo_page_${suffix}`;
  db.prepare(`INSERT INTO pages
    (id, profile_id, slug, title, description, sort_order, is_home, published, created_at, updated_at)
    VALUES (?, ?, 'home', ?, NULL, 0, 1, 1, ?, ?)`)
    .run(pageId, id, `SEO ${suffix}`, timestamp, timestamp);
  return { id, pageId, username };
}

describe('SEO sitemap output', () => {
  beforeAll(() => initDatabase());

  afterEach(() => {
    for (const id of createdProfileIds.splice(0)) {
      db.prepare('DELETE FROM blocks WHERE profile_id = ?').run(id);
      db.prepare('DELETE FROM pages WHERE profile_id = ?').run(id);
      db.prepare('DELETE FROM profiles WHERE id = ?').run(id);
    }
  });

  it('includes substantive published pages, omits empty and actively redirected profiles, and reports content update dates', async () => {
    const runId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const updatedContent = addProfile(`${runId}-content`);
    db.prepare(`INSERT INTO blocks (id, profile_id, page_id, type, title, position, created_at, updated_at)
      VALUES (?, ?, ?, 'link', 'Portfolio', 0, ?, ?)`)
      .run(`seo_block_${runId}`, updatedContent.id, updatedContent.pageId, Date.UTC(2025, 0, 1), Date.UTC(2025, 4, 6));

    const empty = addProfile(`${runId}-empty`);
    const redirected = addProfile(`${runId}-redirected`, {
      bio: 'Profile is configured to redirect.',
      redirect: 'https://example.com/moved',
      redirectUntil: Date.now() + 60_000
    });

    const response = await request(app).get('/sitemap.xml').expect(200);
    expect(response.headers['content-type']).toMatch(/application\/xml/);
    expect(response.text).toContain(`/@${updatedContent.username}`);
    expect(response.text).toContain('<lastmod>2025-05-06</lastmod>');
    expect(response.text).not.toContain(`/@${empty.username}`);
    expect(response.text).not.toContain(`/@${redirected.username}`);
    expect(response.text).not.toContain('<changefreq>');
    expect(response.text).not.toContain('<priority>');
  });
});
