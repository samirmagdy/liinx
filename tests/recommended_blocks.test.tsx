import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import { RECOMMENDED_BLOCK_TYPES, SIGNUP_INTENTS, recommendedBlockTypes } from '../shared/index.js';
import { runtimeTranslations } from '../src/config/runtimeTranslations';
import { BLOCK_CATALOG } from '../src/features/builder/components/blocks/addBlockCatalog';
import { RecommendedBlocks, resolveRecommendedBlocks } from '../src/features/builder/components/blocks/RecommendedBlocks';
import { BlockList } from '../src/features/builder/components/blocks/BlockList';
import { LanguageProvider } from '../src/context/LanguageContext';
import { CapabilitiesProvider } from '../src/context/CapabilitiesContext';
import { ProductFeedbackProvider } from '../src/components/ProductFeedback';
import { BuilderProvider } from '../src/features/builder/context/BuilderContext';
import { TEST_CREATOR_PROFILE } from './fixtures/testProfiles';
import type { CreatorProfile } from '../src/types';

if (typeof window === 'undefined') {
  (global as any).window = {
    location: { origin: 'https://raloa.test', href: 'https://raloa.test/studio', search: '', pathname: '/studio' },
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

const rootDir = path.resolve(__dirname, '..');
const source = (relative: string) => fs.readFileSync(path.join(rootDir, relative), 'utf-8');
const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

const profile = (overrides: Partial<CreatorProfile>): CreatorProfile => ({
  ...TEST_CREATOR_PROFILE,
  id: 'prof_recommendations',
  username: 'suggestcreator',
  ...overrides
} as CreatorProfile);

const render = (ui: React.ReactElement, initialProfile: CreatorProfile) => renderToString(
  <LanguageProvider>
    <CapabilitiesProvider>
      <ProductFeedbackProvider>
        <BuilderProvider initialProfile={initialProfile}>{ui}</BuilderProvider>
      </ProductFeedbackProvider>
    </CapabilitiesProvider>
  </LanguageProvider>
);

describe('recommended blocks', () => {
  it('suggests only block types the builder really has', () => {
    for (const intent of SIGNUP_INTENTS) {
      const types = RECOMMENDED_BLOCK_TYPES[intent];
      expect(types.length, `${intent} has no suggestions`).toBeGreaterThan(0);
      for (const type of types) {
        const matches = BLOCK_CATALOG.filter(item => item.type === type);
        expect(matches.length, `${type} is not one block in the catalogue`).toBe(1);
        expect(resolveRecommendedBlocks(BLOCK_CATALOG, intent).map(item => item.id)).toContain(matches[0].id);
      }
    }
  });

  it('keeps suggestions that need invented content out of the list', () => {
    // Events and pre-saves need real dates, products and downloads need real prices or files, and a
    // testimonial block needs somebody else's quote. None of those are a first win to suggest.
    const excluded = ['event', 'presave', 'product', 'download', 'testimonials', 'content_gate', 'spacer'];
    for (const types of Object.values(RECOMMENDED_BLOCK_TYPES)) {
      for (const type of excluded) expect(types, `${type} would ask for made-up content`).not.toContain(type);
    }
  });

  it('suggests nothing to an account whose discipline is unknown', () => {
    expect(recommendedBlockTypes(undefined)).toEqual([]);
    expect(recommendedBlockTypes('astronaut')).toEqual([]);
    expect(resolveRecommendedBlocks(BLOCK_CATALOG, undefined)).toEqual([]);
  });

  it('states the suggestions as a shorter path, never as a better plan', () => {
    const items = resolveRecommendedBlocks(BLOCK_CATALOG, 'musician');
    const html = renderToString(
      <LanguageProvider>
        <RecommendedBlocks items={items} ui={text => text} onSelect={() => {}} onBrowseAll={() => {}} />
      </LanguageProvider>
    );
    expect(html).toContain(escape('Recommended for you'));
    expect(html).toContain(escape('Browse all blocks'));
    expect(html).toContain(escape('Audio Track'));
    // Every block in the catalogue is included on Free, so the section must not hint otherwise.
    expect(html).not.toMatch(/\bPro\b|Upgrade|locked|Premium/i);
  });

  it('asks for one action when the page has nothing on it', () => {
    const empty = render(<BlockList />, profile({ blocks: [] as any }));
    expect(empty).toContain(escape('This page has no blocks yet.'));
    expect(empty).toContain(escape('Add your first block'));
    expect(empty).not.toContain('Collapse all');

    const filled = render(<BlockList />, profile({}));
    expect(filled).not.toContain('This page has no blocks yet.');
  });

  it('drives the suggestions from the discipline the server stored', () => {
    const popover = source('src/features/builder/components/blocks/AddBlockPopover.tsx');
    expect(popover).toContain('resolveRecommendedBlocks(BLOCK_CATALOG, profile.signupIntent)');
    expect(source('src/features/builder/components/blocks/RecommendedBlocks.tsx')).toContain('recommendedBlockTypes(intent)');
  });

  it('has Arabic for every new label', () => {
    for (const label of ['This page has no blocks yet.', 'Add your first block', 'Recommended for you', 'Browse all blocks']) {
      const arabic = runtimeTranslations[label];
      expect(arabic, `${label} has no Arabic`).toBeTruthy();
      expect(arabic, `${label} maps to itself`).not.toBe(label);
    }
  });
});
