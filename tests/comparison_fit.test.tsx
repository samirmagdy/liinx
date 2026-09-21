import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Router } from 'wouter';
import { ComparisonSection } from '../src/components/ComparisonSection';
import { LanguageProvider } from '../src/context/LanguageContext';
import { CapabilitiesProvider } from '../src/context/CapabilitiesContext';
import { collectSourceFiles, relativeToRoot, repoRoot } from './helpers/arabicParity';

const read = (file: string) => fs.readFileSync(file, 'utf8');

/** The section links and navigates, so the test gives wouter a location that never moves. */
const renderSection = () => renderToString(
  <Router hook={() => ['/templates', () => {}]}>
    <LanguageProvider>
      <CapabilitiesProvider>
        <ComparisonSection />
      </CapabilitiesProvider>
    </LanguageProvider>
  </Router>
);

describe('the comparison states fit instead of beating a strawman', () => {
  it('opens with who RALOA is actually for', () => {
    const html = renderSection();
    expect(html).toContain('Choose RALOA if');
  });

  it('never presents a rival as a cartoon', () => {
    const html = renderSection();
    expect(html).not.toMatch(/basic link list/i);
    expect(html, 'no invented competitor column').not.toMatch(/not assessed|unassessed/i);
    // A rival is named exactly once, and only for the import that really reads that profile.
    expect((html.match(/Linktree/gi) ?? []).length, 'Linktree named once').toBe(1);
    expect((html.match(/Beacons/gi) ?? []).length, 'Beacons named once').toBe(1);
    expect(html).toContain('Moving from Linktree or Beacons?');
  });

  it('says out loud when a plain link list is the better tool', () => {
    const html = renderSection();
    expect(html).toContain('a simple link list may be enough for you');
  });

  it('keeps every claim tied to something the product does today', () => {
    const html = renderSection();
    // Each of these is a shipped surface, not an aspiration: pages and folders, the guided
    // domain wizard, newsletter and booking capture, the Arabic-first layout, and the v1 API.
    ['Pages and folders', 'your own address', 'collect emails', 'Arabic', 'REST API'].forEach(claim => {
      expect(html, claim).toContain(claim);
    });
  });
});

describe('no unassessed competitor data is left to be rendered by accident', () => {
  it('keeps the dormant comparison table out of the codebase', () => {
    const files = collectSourceFiles(path.join(repoRoot, 'src'));
    const offenders = files
      .filter(file => /not assessed|غير مُقيّم/i.test(read(file)) || /COMPARISON_FEATURES/.test(read(file)))
      .map(relativeToRoot);
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('leaves the marketing copy out of the translation dictionary too', () => {
    const i18n = read(path.join(repoRoot, 'src', 'config', 'i18n.ts'));
    expect(i18n).not.toContain('comparisonSection');
    expect(i18n).not.toContain('ComparisonRow');
  });

  it('writes the comparison UI through the dictionary, not inline language switches', () => {
    const offenders = collectSourceFiles(path.join(repoRoot, 'src', 'components', 'comparison'))
      .filter(file => /\bar\s*\?\s*['"`]/.test(read(file)))
      .map(relativeToRoot);
    expect(offenders, offenders.join('\n')).toEqual([]);
  });
});
