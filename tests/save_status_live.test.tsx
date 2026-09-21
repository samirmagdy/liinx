import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { BuilderToolbar } from '../src/features/builder/components/BuilderToolbar';
import { PageManager } from '../src/features/builder/components/pages/PageManager';
import { BuilderProvider } from '../src/features/builder/context/BuilderContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { CapabilitiesProvider } from '../src/context/CapabilitiesContext';
import { ProductFeedbackProvider } from '../src/components/ProductFeedback';
import { TEST_CREATOR_PROFILE } from './fixtures/testProfiles';
import { collectSourceFiles, relativeToRoot, repoRoot } from './helpers/arabicParity';
import { runtimeTranslations } from '../src/config/runtimeTranslations';
import type { CreatorProfile, CreatorPage } from '../src/types';

if (typeof window === 'undefined') {
  (global as any).window = {
    location: { origin: 'https://raloa.test', href: 'https://raloa.test/studio', search: '' },
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

const page = (over: Partial<CreatorPage>): CreatorPage => ({
  id: over.id ?? 'page_home_1',
  slug: over.slug ?? 'home',
  title: over.title ?? 'Home',
  sortOrder: over.sortOrder ?? 0,
  isHome: over.isHome ?? true,
  published: over.published ?? true,
  ...over
});

const profileWith = (pages: CreatorPage[]): CreatorProfile => ({
  ...TEST_CREATOR_PROFILE,
  id: 'prof_save_status',
  username: 'savestatus',
  displayName: 'Save Status',
  plan: 'free',
  pages,
  blocks: []
});

const render = (profile: CreatorProfile, ui: React.ReactElement) => renderToString(
  <LanguageProvider>
    <CapabilitiesProvider>
      <ProductFeedbackProvider>
        <BuilderProvider initialProfile={profile}>{ui}</BuilderProvider>
      </ProductFeedbackProvider>
    </CapabilitiesProvider>
  </LanguageProvider>
);

const published = profileWith([
  page({ id: 'page_home_1', title: 'Home' }),
  page({ id: 'page_arch_1', slug: 'archive', title: 'Archive', isHome: false, published: false, sortOrder: 1 })
]);

// Home can never be unpublished server-side, so an account whose only page is a
// secondary one is how the Studio reaches an unpublished active page.
const unpublished = profileWith([
  page({ id: 'page_arch_1', slug: 'archive', title: 'Archive', isHome: false, published: false })
]);

describe('Saved · Live autosave state', () => {
  it('names the autosave contract instead of a bare "Saved"', () => {
    const html = render(published, <BuilderToolbar />);
    expect(html).toContain('Saved · Live');
    expect(html).toContain('Changes are published automatically');
  });

  it('states the live page by name', () => {
    const html = render(published, <BuilderToolbar />);
    expect(html).toContain('Home');
    expect(html).toContain('is live');
  });

  it('does not claim Live while the page a creator is editing is unpublished', () => {
    const html = render(unpublished, <BuilderToolbar />);
    expect(html).not.toContain('Saved · Live');
    expect(html).toContain('Archive');
    expect(html).toContain('is unpublished');
  });

  it('marks each page chip with the state the server actually holds', () => {
    const html = render(published, <PageManager />);
    expect(html).toContain('Home is live');
    expect(html).toContain('Archive is unpublished');
  });
});

describe('The roadmap forbids draft wording before Phase 5b', () => {
  const files = collectSourceFiles(`${repoRoot}/src`);

  /**
   * Only standalone words inside quoted literals count: `socialDrafts` and
   * `social-link-draft-3` are internal names, `(draft)` and `draft revision` are copy.
   */
  const literalForms = [
    /'((?:\\.|[^'\\])*)'/g,
    /"((?:\\.|[^"\\])*)"/g,
    /`([^`]*)`/g
  ];
  const isCopy = (text: string) => /[\s(]draft[\s).,!]/i.test(text);
  const offenders: string[] = [];
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    for (const pattern of literalForms) {
      for (const match of source.matchAll(pattern)) {
        if (isCopy(match[1])) offenders.push(`${relativeToRoot(file)}: "${match[1]}"`);
      }
    }
  }

  it('no interface string offers a draft', () => {
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('no Arabic value offers a draft either', () => {
    const translated = Object.entries(runtimeTranslations)
      .filter(([, value]) => /draft|مسودة/i.test(value))
      .map(([key]) => key);
    expect(translated, translated.join(' | ')).toEqual([]);
  });
});
