import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { collectSourceFiles, relativeToRoot, repoRoot } from './helpers/arabicParity';

/**
 * The product has no verified audience figures, so nothing on a page a visitor reads may
 * imply one. Demo profiles are labelled fiction, but a number inside them is still the only
 * number on the marketing page, and a visitor reads it as ours.
 */
const AUDIENCE_CLAIM = /[0-9][0-9.,\u0660-\u0669]*\s*\+?\s*(creators|readers|subscribers|members|users|clients|followers|testimonials|قارئ|قراء|مشترك|متابع|عضو)/i;

describe('marketing copy stays free of invented proof', () => {
  const scanned = [
    ...collectSourceFiles(path.join(repoRoot, 'src', 'demo')),
    ...collectSourceFiles(path.join(repoRoot, 'src', 'components')),
    ...collectSourceFiles(path.join(repoRoot, 'src', 'pages')),
    path.join(repoRoot, 'src', 'config', 'i18n.ts'),
    path.join(repoRoot, 'src', 'config', 'faq.ts'),
    path.join(repoRoot, 'src', 'config', 'runtimeTranslations.ts')
  ];

  it('finds no audience counts anywhere a visitor can read', () => {
    const hits: string[] = [];
    for (const file of scanned) {
      if (!fs.existsSync(file)) continue;
      fs.readFileSync(file, 'utf8').split('\n').forEach((line, index) => {
        if (AUDIENCE_CLAIM.test(line)) hits.push(`${relativeToRoot(file)}:${index + 1}: ${line.trim().slice(0, 110)}`);
      });
    }
    expect(hits, `invented proof:\n${hits.join('\n')}`).toEqual([]);
  });

  it('keeps no discount claim that the prices do not support', () => {
    const i18n = fs.readFileSync(path.join(repoRoot, 'src', 'config', 'i18n.ts'), 'utf8');
    // The rendered badge is "2 months free", which the annual price actually is.
    expect(i18n).not.toMatch(/yearlySave/);
    expect(i18n).not.toMatch(/Save 20%|وفّر ٢٠٪/);
  });

  it('keeps invented performance numbers off the page', () => {
    // Nothing here is measured, so a percentage attached to an outcome is a made-up figure.
    const PERCENT = /\d{2,}\s*%/;
    const OUTCOME = /\b(more|lift|increase|higher)\b|\bclicks\b|\bconversions?\b|\bsales\b|نقرات|مبيعات|تحويل/i;
    const hits: string[] = [];
    for (const file of scanned) {
      if (!fs.existsSync(file)) continue;
      fs.readFileSync(file, 'utf8').split('\n').forEach((line, index) => {
        const text = line.trim();
        if (/gradient|rgba|#[0-9a-f]{3}|duration-|width|height|opacity|scale/i.test(text)) return;
        if (PERCENT.test(text) && OUTCOME.test(text)) hits.push(`${relativeToRoot(file)}:${index + 1}: ${text.slice(0, 110)}`);
      });
    }
    expect(hits, `invented performance numbers:\n${hits.join('\n')}`).toEqual([]);
  });
});
