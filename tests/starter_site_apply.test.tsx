import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import { SITE_TEMPLATES, type CreatorProfile } from '../shared/index.js';
import { runtimeTranslations } from '../src/config/runtimeTranslations';
import { LanguageProvider } from '../src/context/LanguageContext';
import { StarterSiteDialog } from '../src/features/builder/components/dialogs/StarterSiteDialog';
import { clearStarterSiteParam, readStarterSiteParam, starterSiteBlocks } from '../src/utils/starterSites';

if (typeof window === 'undefined') {
  (global as any).window = {
    location: { origin: 'https://raloa.test', href: 'https://raloa.test/', search: '', pathname: '/ar/studio' },
    history: { replaceState: (_s: unknown, _t: string, url: string) => { written.push(url); } },
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

const written: string[] = [];
const rootDir = path.resolve(__dirname, '..');
const source = (relative: string) => fs.readFileSync(path.join(rootDir, relative), 'utf-8');
const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

function withLocation(search: string, run: () => void) {
  const previous = window.location.search;
  Object.defineProperty(window.location, 'search', { value: search, configurable: true, writable: true });
  try {
    run();
  } finally {
    Object.defineProperty(window.location, 'search', { value: previous, configurable: true, writable: true });
  }
}

const studioProfile: CreatorProfile = {
  id: 'prof_test',
  username: 'existingcreator',
  displayName: 'Existing Creator',
  bio: 'A bio the starter site must not overwrite.',
  avatarUrl: '',
  category: 'Creator',
  verified: false,
  themeId: 'editorial-stone',
  socials: [{ platform: 'instagram', url: 'https://instagram.com/existingcreator' }],
  pages: [{ id: 'page_home', slug: 'home', title: 'My Links', description: null, sortOrder: 0, isHome: true, published: true }],
  blocks: [{ id: 'blk_existing', pageId: 'page_home', type: 'link', title: 'Already published', url: 'https://raloa.test', visible: true }] as any
};

function renderDialog(templateId: string, options: { error?: string | null; language?: 'en' | 'ar' } = {}): string {
  const starterSite = SITE_TEMPLATES.find(template => template.id === templateId)!;
  return renderToString(
    <LanguageProvider initialLanguage={options.language || 'en'}>
      <StarterSiteDialog
        starterSite={starterSite}
        profile={studioProfile}
        error={options.error ?? null}
        busy={false}
        onApply={() => {}}
        onDismiss={() => {}}
      />
    </LanguageProvider>
  );
}

// Every label the dialog can put on screen, in either state.
const STARTER_SITE_LABELS = [
  'Starter site preview',
  'Starter site',
  'Add to my page',
  'Replace my content',
  'Tap again to replace everything',
  'Adding...',
  'Add your name',
  'Your theme changes to',
  'Adding keeps your existing pages and blocks. These pages are added below what you already have.',
  'Replace deletes your other pages and all of their blocks. Your profile details and social links stay.',
  'We could not add that starter site. Please try again.',
  'blocks',
  'pages',
  'Cancel'
];

describe('studio starter site routing', () => {
  it('reads ?template as a catalogue id and ignores every other value', () => {
    withLocation('?template=tmpl-editorial', () => {
      expect(readStarterSiteParam()?.id).toBe('tmpl-editorial');
    });
    // A theme id used to be applied as a colour change while the button promised a whole site.
    for (const rejected of ['editorial-stone', 'midnight-ink', 'tmpl-does-not-exist', '']) {
      withLocation(`?template=${rejected}`, () => {
        expect(readStarterSiteParam(), `${rejected} is not a starter site`).toBeNull();
      });
    }
    withLocation('', () => expect(readStarterSiteParam()).toBeNull());
  });

  it('strips the param without losing the locale base or other query state', () => {
    written.length = 0;
    withLocation('?template=tmpl-editorial&import=1', () => clearStarterSiteParam());
    expect(written).toEqual(['/ar/studio?import=1']);
    written.length = 0;
    withLocation('?import=1', () => clearStarterSiteParam());
    expect(written).toEqual([]);
  });

  it('applies through the server endpoint instead of a theme write', () => {
    const hook = source('src/features/builder/hooks/useStarterSite.ts');
    expect(hook).toContain('api.studio.applyTemplate(starterSite.id, mode)');
    // The builder must not keep the old colour-swatch shortcut, and the dialog has to be mounted.
    expect(source('src/features/builder/hooks/useProfile.ts')).not.toContain('THEMES.some(theme => theme.id === template)');
    expect(source('src/features/builder/components/BuilderShell.tsx')).toContain('<StarterSiteDialogHost />');
    expect(source('src/services/api.ts')).toContain('/studio/templates/${encodeURIComponent(templateId)}/apply');
  });
});

describe('studio starter site dialog', () => {
  it('shows the composition that the endpoint will write', () => {
    for (const template of SITE_TEMPLATES) {
      const html = renderDialog(template.id);
      expect(html).toContain(escape(template.name));
      for (const block of starterSiteBlocks(template).filter(item => item.type !== 'spacer')) {
        expect(html, `${template.id} is missing "${block.title}"`).toContain(escape(block.title));
      }
      expect(html, `${template.id} borrows somebody's photograph`).not.toContain('unsplash');
    }
  });

  it('keeps the account own words, handle and social links in the preview', () => {
    const html = renderDialog('tmpl-editorial');
    expect(html).toContain(escape('My Links'));
    expect(html).toContain(escape('A bio the starter site must not overwrite.'));
    expect(html).toContain(escape('existingcreator'));
    expect(html).not.toContain(escape('Add your name'));
  });

  it('offers additive and destructive actions, and surfaces a failure', () => {
    const html = renderDialog('tmpl-editorial');
    expect(html).toContain('Add to my page');
    expect(html).toContain('Replace my content');
    expect(html).toContain('Cancel');
    expect(renderDialog('tmpl-editorial', { error: 'That starter site does not exist.' })).toContain('That starter site does not exist.');
    expect(renderDialog('tmpl-editorial')).not.toContain('That starter site does not exist.');
  });

  it('has real Arabic for every label the dialog can show', () => {
    const arabic = renderDialog('tmpl-editorial', { language: 'ar' });
    for (const key of STARTER_SITE_LABELS) {
      const value = runtimeTranslations[key];
      expect(value, `"${key}" has no Arabic entry`).toBeTruthy();
      expect(value, `"${key}" Arabic just repeats the English`).not.toBe(key);
    }
    expect(arabic).toContain(runtimeTranslations['Add to my page']);
    expect(arabic).toContain(runtimeTranslations['Replace my content']);
    expect(arabic).toContain(runtimeTranslations['Starter site']);
    expect(arabic).toContain(runtimeTranslations['Your theme changes to']);
    // The hook's own fallback has to be translatable too, or a failure is English-only.
    expect(source('src/features/builder/hooks/useStarterSite.ts')).toContain("ui('We could not add that starter site. Please try again.')");
    expect(runtimeTranslations['We could not add that starter site. Please try again.']).toBeTruthy();
  });
});
