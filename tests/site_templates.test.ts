import { describe, expect, it } from 'vitest';
import {
  SITE_TEMPLATES,
  TEMPLATE_ALLOWED_BLOCK_TYPES,
  findSiteTemplate,
  parseSiteTemplate,
  siteTemplatesForIntent
} from '../shared/index.js';
import { presetThemeIds } from '../shared/contracts/profiles.js';
import { THEMES } from '../src/config/themes.js';
import { translations } from '../src/config/i18n.js';

const SERIALIZED = JSON.stringify(SITE_TEMPLATES);

describe('site template contract', () => {
  it('rejects unknown keys, undeclared pages, scheduling, and hidden blocks', () => {
    const base = {
      id: 'tmpl-test', name: 'Test', intent: 'creator', category: 'Creators',
      description: 'A considered starting point.', themeId: 'editorial-stone',
      blocks: [{ type: 'link', title: 'Add a link' }]
    };
    expect(parseSiteTemplate({ ...base, blocks: base.blocks.map(block => ({ ...block, url: 'javascript:alert(1)' })) }).success).toBe(false);
    expect(parseSiteTemplate({ ...base, extra: true }).success).toBe(false);
    expect(parseSiteTemplate({ ...base, blocks: [{ type: 'link', title: 'A', page: 'missing' }] }).success).toBe(false);
    expect(parseSiteTemplate({ ...base, blocks: [{ type: 'link', title: 'A', visible: false }] }).success).toBe(false);
    expect(parseSiteTemplate({ ...base, blocks: [{ type: 'link', title: 'A', startAt: 1 }] }).success).toBe(false);
    expect(parseSiteTemplate({ ...base, blocks: [{ type: 'content_gate', title: 'A', extra: { password: 'x' } }] }).success).toBe(false);
    expect(parseSiteTemplate({ ...base, themeId: 'not-a-theme' }).success).toBe(false);
    expect(parseSiteTemplate({ ...base, pages: [{ slug: 'home', title: 'Home' }] }).success).toBe(false);
  });

  it('accepts a fully-formed composition', () => {
    const parsed = parseSiteTemplate({
      id: 'tmpl-test', name: 'Test', intent: 'creator', category: 'Creators',
      description: 'A considered starting point.', themeId: 'editorial-stone',
      profile: { bio: 'Placeholder bio' },
      pages: [{ slug: 'work', title: 'Work', description: 'Projects' }],
      blocks: [
        { type: 'header', title: 'Start here' },
        { type: 'link', title: 'Add your link', page: 'work' },
        { type: 'newsletter', title: 'List', extra: { buttonText: 'Join' } }
      ]
    });
    expect(parsed.success).toBe(true);
  });
});

describe('site template catalog', () => {
  it('parses every entry through the contract', () => {
    expect(SITE_TEMPLATES.length).toBeGreaterThan(0);
    for (const template of SITE_TEMPLATES) expect(parseSiteTemplate(template).success).toBe(true);
  });

  it('has gallery copy in both languages for every starter site', () => {
    // The gallery lists the server catalog directly, so a catalog entry without translated
    // copy would surface an English name in Arabic, or an empty card.
    for (const language of ['en', 'ar'] as const) {
      const entries = translations[language].templatesSection.templates;
      for (const template of SITE_TEMPLATES) {
        expect(entries[template.id]?.name, `${language} name for ${template.id}`).toBeTruthy();
        expect(entries[template.id]?.description, `${language} description for ${template.id}`).toBeTruthy();
        expect(entries[template.id]?.category, `${language} category for ${template.id}`).toBeTruthy();
      }
    }
  });

  it('references only real themes and placeholder-safe block types', () => {
    for (const template of SITE_TEMPLATES) {
      expect(presetThemeIds).toContain(template.themeId);
      // A preset id the client cannot resolve would render the default theme after apply,
      // so the gallery preview and the published page would disagree.
      expect(THEMES.some(theme => theme.id === template.themeId), `no client theme for ${template.themeId}`).toBe(true);
      for (const block of template.blocks) expect(TEMPLATE_ALLOWED_BLOCK_TYPES).toContain(block.type);
    }
  });

  it('never publishes invented engagement, destinations, media, or credentials', () => {
    for (const banned of ['viewsThisMonth', 'totalClicks', '"ctr"', 'followers', 'likes', 'password', 'passwordHash', 'unsplash.com', 'example.com']) {
      expect(SERIALIZED, `catalog must not contain ${banned}`).not.toContain(banned);
    }
  });

  it('gives every intent at least one complete starter site', () => {
    const intents = ['creator', 'photographer', 'musician', 'developer', 'coach', 'business'] as const;
    for (const intent of intents) {
      const matches = siteTemplatesForIntent(intent);
      expect(matches.length, `no template for intent ${intent}`).toBeGreaterThan(0);
      for (const template of matches) {
        expect(template.blocks.length).toBeGreaterThanOrEqual(5);
        expect(new Set(template.blocks.map(block => block.page || 'home')).size + (template.pages?.length || 0)).toBeGreaterThan(1);
      }
    }
    expect(siteTemplatesForIntent('not-an-intent')).toEqual([]);
    expect(findSiteTemplate(SITE_TEMPLATES[0].id)?.id).toBe(SITE_TEMPLATES[0].id);
    expect(findSiteTemplate('tmpl-nope')).toBeUndefined();
    expect(findSiteTemplate(undefined)).toBeUndefined();
  });
});
