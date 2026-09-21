import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Router } from 'wouter';
import { BuilderProvider } from '../src/features/builder/context/BuilderContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { CapabilitiesProvider } from '../src/context/CapabilitiesContext';
import { ProductFeedbackProvider } from '../src/components/ProductFeedback';
import { SettingsShowcaseCard } from '../src/features/builder/components/panels/settings/SettingsShowcaseCard';
import { ShowcaseGrid } from '../src/components/MadeWithRaloaSection';
import { TEST_CREATOR_PROFILE } from './fixtures/testProfiles';
import { repoRoot } from './helpers/arabicParity';
import { runtimeTranslations } from '../src/config/runtimeTranslations';
import type { CreatorProfile, ShowcaseProfile } from '../src/types';

if (typeof window === 'undefined') {
  (global as any).window = {
    location: { origin: 'https://raloa.test', href: 'https://raloa.test/', pathname: '/', search: '' },
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

const renderCard = (profile: CreatorProfile) => renderToString(
  <Router hook={() => ['/studio', () => {}]}>
    <LanguageProvider>
      <CapabilitiesProvider>
        <ProductFeedbackProvider>
          <BuilderProvider initialProfile={profile}>
            <SettingsShowcaseCard />
          </BuilderProvider>
        </ProductFeedbackProvider>
      </CapabilitiesProvider>
    </LanguageProvider>
  </Router>
);

const entry = (username: string, over: Partial<ShowcaseProfile> = {}): ShowcaseProfile => ({
  ...TEST_CREATOR_PROFILE,
  id: `prof_${username}`,
  username,
  displayName: username === 'nourstudio' ? 'Nour Studio' : 'Maya Fields',
  bio: 'Ceramics made by hand in Amman',
  url: `/@${username}`,
  blocks: [{ id: `blk_${username}`, type: 'link', title: 'Shop the kiln opening', url: 'https://example.com' }],
  ...over
});

describe('the gallery consent card', () => {
  it('shows the switch in the position the server stored', () => {
    const on = renderCard({ ...TEST_CREATOR_PROFILE, showcaseOptIn: true });
    expect(on).toContain('role="switch"');
    expect(on).toContain('aria-checked="true"');
    const off = renderCard({ ...TEST_CREATOR_PROFILE, showcaseOptIn: false });
    expect(off).toContain('aria-checked="false"');
  });

  it('says what it does, and that only published pages qualify', () => {
    const html = renderCard({ ...TEST_CREATOR_PROFILE, showcaseOptIn: false });
    expect(html).toContain('gallery');
    expect(html, 'the card must not promise reach the server cannot give').toContain('published');
  });

  it('has Arabic for every word it renders', () => {
    const source = fs.readFileSync(
      path.join(repoRoot, 'src', 'features', 'builder', 'components', 'panels', 'settings', 'SettingsShowcaseCard.tsx'),
      'utf8'
    );
    const literals = [...source.matchAll(/\bui\(\s*'((?:[^']|\\')*)'\s*[,)]/g)].map(match => match[1]);
    expect(literals.length, 'the card has no copy to translate').toBeGreaterThan(3);
    const missing = literals.filter(literal => !runtimeTranslations[literal]);
    expect(missing, `untranslated: ${missing.join(' | ')}`).toEqual([]);
  });
});

describe('the made-with-RALOA gallery', () => {
  const renderGrid = (profiles: ShowcaseProfile[]) => renderToString(
    <Router hook={() => ['/templates', () => {}]}>
      <LanguageProvider>
        <ShowcaseGrid profiles={profiles} />
      </LanguageProvider>
    </Router>
  );

  it('renders the pages it is given, each linking to its real address', () => {
    const html = renderGrid([entry('mayafields'), entry('nourstudio')]);
    expect(html).toContain('Maya Fields');
    expect(html).toContain('Nour Studio');
    expect(html).toContain('/@mayafields');
    expect(html).toContain('/@nourstudio');
    expect(html).toContain('Shop the kiln opening');
  });

  it('says so when nobody has opted in, instead of filling the gap', () => {
    const html = renderGrid([]);
    expect(html).not.toContain('/@');
    expect(html).toMatch(/no creators have opted in|not yet|no pages yet/i);
  });

  it('never hardcodes a handle or a name', () => {
    const source = fs.readFileSync(path.join(repoRoot, 'src', 'components', 'MadeWithRaloaSection.tsx'), 'utf8');
    const handles = [...source.matchAll(/\/@[A-Za-z0-9_]+/g)].map(match => match[0]);
    expect(handles, `hardcoded handles: ${handles.join(', ')}`).toEqual([]);
  });
});
