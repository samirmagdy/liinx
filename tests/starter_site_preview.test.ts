import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomBytes } from 'node:crypto';
import { app } from '../server/server.js';
import { SITE_TEMPLATES, type SiteTemplate } from '../shared/index.js';
import { starterSiteBlocks, starterSitePages, starterSitePreview, HOME_PAGE_SLUG } from '../src/utils/starterSites.js';

/**
 * The gallery and the signup picker render a projection of the shared catalog. This file's job is
 * to prove that projection is the page the server actually publishes, field by field.
 */

function handle(prefix: string): string {
  return `${prefix}_${Date.now()}_${randomBytes(3).toString('hex')}`.replace(/[^a-z0-9_]/g, '').slice(0, 30);
}

/** Fields a visitor can see and that apply must reproduce exactly. */
function comparable(block: any) {
  return {
    type: block.type,
    title: block.title,
    url: block.url ?? null,
    subtitle: block.subtitle ?? null,
    badge: block.badge ?? null,
    icon: block.icon ?? null,
    highlighted: Boolean(block.highlighted),
    items: block.items ?? null,
    fields: block.fields ?? null,
    body: block.body ?? null,
    description: block.description ?? null,
    buttonText: block.buttonText ?? null
  };
}

async function openAccountWithStarterSite(template: SiteTemplate) {
  const username = handle('preview');
  const response = await request(app).post('/api/auth/register')
    .send({ email: `${username}@raloa.test`, password: 'StarterPreview2026!', username, templateId: template.id })
    .expect(201);
  return { username, token: response.body.token as string };
}

describe('starter site preview projection', () => {
  it('shows every block the account is opened with, in the same order, on every page', async () => {
    for (const template of SITE_TEMPLATES) {
      const { username } = await openAccountWithStarterSite(template);
      const slugs = [HOME_PAGE_SLUG, ...(template.pages || []).map(page => page.slug)];

      for (const slug of slugs) {
        const visitor = await request(app)
          .get(`/api/profiles/${username}${slug === HOME_PAGE_SLUG ? '' : `?page=${slug}`}`)
          .expect(200);
        expect(
          visitor.body.blocks.map(comparable),
          `${template.id} / ${slug}`
        ).toEqual(starterSiteBlocks(template, slug).map(comparable));
      }
    }
  });

  it('agrees with the live page about the identity fields and the page tree', async () => {
    const template = SITE_TEMPLATES[0];
    const { username, token } = await openAccountWithStarterSite(template);
    const visitor = await request(app).get(`/api/profiles/${username}`).expect(200);
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);

    const preview = starterSitePreview(template, {
      username,
      displayName: studio.body.displayName,
      socials: [{ platform: 'email', url: `mailto:${username}@raloa.test` }]
    });
    expect(visitor.body.displayName).toBe(preview.displayName);
    expect(visitor.body.bio).toBe(preview.bio);
    expect(visitor.body.themeId).toBe(preview.themeId);
    expect(visitor.body.category).toBe(preview.category);
    expect(visitor.body.socials).toEqual(preview.socials);
    expect(visitor.body.pages.map((page: any) => page.slug)).toEqual(preview.pages!.map(page => page.slug));
    // A starter site arrives without a photo: the preview must not borrow someone else's.
    expect(preview.avatarUrl).toBe('');
    expect(visitor.body.avatarUrl).toBe('');
  });

  it('invents no engagement, destinations, or imagery', () => {
    for (const template of SITE_TEMPLATES) {
      const preview = starterSitePreview(template);
      expect(preview.stats).toBeUndefined();
      expect(preview.avatarUrl).toBe('');
      expect(preview.socials).toEqual([]);
      expect(preview.pages!.map(page => page.slug)).toEqual(starterSitePages(template, preview.displayName).map(page => page.slug));
      for (const block of starterSiteBlocks(template)) {
        if (block.type === 'link') expect((block as any).url, `${template.id}: ${block.title} invents a destination`).toBeNull();
        if (block.type === 'folder') for (const item of (block as any).items || []) {
          expect(item.url, `${template.id}: ${block.title} invents a destination`).toBe('');
        }
      }
    }
  });
});
