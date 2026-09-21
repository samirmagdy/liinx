import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { brand, canonicalOrigin, isFirstPartyHost } from '../shared/config/brand';
import { collectSourceFiles, readArabicParity } from './helpers/arabicParity';

const rootDir = path.resolve(__dirname, '..');
const baselinePath = path.join(rootDir, '.arabic-ui-baseline.json');
const sourceFiles = collectSourceFiles(path.join(rootDir, 'src'));

const read = (file: string) => fs.readFileSync(file, 'utf8');
const rel = (file: string) => path.relative(rootDir, file).split(path.sep).join('/');

/** Everything a creator touches after the brochure: the product surface. */
const IN_APP_PREFIXES = ['src/features/', 'src/context/'];
const isInApp = (file: string) => IN_APP_PREFIXES.some(prefix => rel(file).startsWith(prefix));

describe('Phase 3: one domain, one vocabulary', () => {
  it('ships no hardcoded host inside src/ — every host comes from shared/config/brand.ts', () => {
    const hostLiteral = /\b(?:raloa\.app|raloa\.me|raloa\.vercel\.app|[a-z0-9-]+\.fly\.dev)\b/i;
    const violations: string[] = [];

    for (const file of [...sourceFiles, path.join(rootDir, 'public', 'robots.txt')]) {
      if (!fs.existsSync(file)) continue;
      read(file).split('\n').forEach((line, index) => {
        if (hostLiteral.test(line)) violations.push(`${rel(file)}:${index + 1}: ${line.trim().slice(0, 120)}`);
      });
    }

    expect(violations, `Inline hosts found:\n${violations.join('\n')}`).toEqual([]);
  });

  it('still serves a sitemap line from the route that knows the request origin', () => {
    const route = read(path.join(rootDir, 'server', 'server.ts'));
    expect(route).toMatch(/Sitemap: \$\{origin\}\/sitemap\.xml/);
  });

  /**
   * `index.html` is the one place an absolute URL has to be written literally: crawlers and
   * link unfurlers read the shipped head, and `scripts/prerender.tsx` only rewrites
   * canonical/og:url per route. This pins those literals to the brand config so a domain
   * change fails here instead of shipping stale share metadata.
   */
  it('keeps the literal metadata in index.html in step with the brand config', () => {
    const html = read(path.join(rootDir, 'index.html'));
    expect(html).toContain(`<link rel="canonical" href="${canonicalOrigin}/" />`);
    expect(html).toContain(`content="${canonicalOrigin}/social/og-image-1200x630.jpg"`);
    expect(html).toContain(`"url": "${canonicalOrigin}"`);
    expect(html).toContain(`mailto:${brand.supportEmail}`);
  });

  it('owns the host list in one place so client and server agree on first-party hosts', () => {
    expect(canonicalOrigin).toBe(`https://${brand.domain}`);
    expect(isFirstPartyHost('localhost')).toBe(true);
    expect(isFirstPartyHost('127.0.0.1')).toBe(true);
    expect(isFirstPartyHost('raloa.vercel.app')).toBe(true);
    expect(isFirstPartyHost(brand.domain)).toBe(true);
    expect(isFirstPartyHost(`anything.${brand.domain}`)).toBe(true);
    expect(isFirstPartyHost('')).toBe(true);
    expect(isFirstPartyHost('links.yourbrand.com')).toBe(false);
    expect(isFirstPartyHost(brand.cnameTarget)).toBe(false);
  });

  it('keeps the banned nouns out of the product', () => {
    const banned = [
      { pattern: /Bio (Profile|Studio)/, why: 'the glossary calls a site a Site and the tool Studio' },
      { pattern: /Blocks & Content/, why: 'the Content tab owns blocks' },
      { pattern: /Studio Builder/, why: 'the tool is Studio' },
      { pattern: /micro-?site/i, why: 'marketing says mini-site everywhere' },
      { pattern: /Launch My Page/, why: 'signup creates an account; Publish is the live action' }
    ];
    const violations: string[] = [];

    for (const file of sourceFiles) {
      const lines = read(file).split('\n');
      lines.forEach((line, index) => {
        for (const entry of banned) {
          if (entry.pattern.test(line)) violations.push(`${rel(file)}:${index + 1} — ${entry.why}: ${line.trim().slice(0, 120)}`);
        }
      });
    }

    expect(violations, `Vocabulary violations:\n${violations.join('\n')}`).toEqual([]);
  });

  it('reserves "mini-site" for marketing and calls the thing a site inside the product', () => {
    const violations: string[] = [];
    for (const file of sourceFiles) {
      if (!isInApp(file)) continue;
      read(file).split('\n').forEach((line, index) => {
        if (/mini-?site/i.test(line)) violations.push(`${rel(file)}:${index + 1}: ${line.trim().slice(0, 120)}`);
      });
    }
    expect(violations, `In-app copy must say "site":\n${violations.join('\n')}`).toEqual([]);
  });
});

describe('Phase 3: Arabic parity ratchet', () => {
  const { keys, missing, latinValues, inlineTernaries } = readArabicParity();
  const hasBaseline = fs.existsSync(baselinePath);
  const baseline: { missing: string[]; inlineBilingualTernaries: Record<string, number> } = hasBaseline
    ? JSON.parse(read(baselinePath))
    : { missing: [], inlineBilingualTernaries: {} };

  it('does not add untranslated ui() strings — baseline in .arabic-ui-baseline.json', () => {
    expect(hasBaseline, 'run `npm run arabic:baseline` to (re)generate .arabic-ui-baseline.json').toBe(true);
    const added = missing.filter(key => !baseline.missing.includes(key));
    const stale = baseline.missing.filter(key => !missing.includes(key));

    expect(added, `New ui() strings with no Arabic entry — translate them, do not baseline them:\n${added.join('\n')}`).toEqual([]);
    expect(stale, `Translated since the baseline was taken — prune these from .arabic-ui-baseline.json:\n${stale.join('\n')}`).toEqual([]);
  });

  it('never renders a Latin-only value where Arabic is expected', () => {
    expect(latinValues, `Arabic entries that contain no Arabic text:\n${latinValues.join('\n')}`).toEqual([]);
  });

  it('does not add inline bilingual ternaries that bypass the dictionary', () => {
    expect(hasBaseline, 'run `npm run arabic:baseline` to (re)generate .arabic-ui-baseline.json').toBe(true);
    const added = Object.entries(inlineTernaries)
      .filter(([file, count]) => count > (baseline.inlineBilingualTernaries[file] ?? 0))
      .map(([file, count]) => `${file}: ${count} (baseline ${baseline.inlineBilingualTernaries[file] ?? 0}) — write ui('English copy') and give it an Arabic entry`);
    const finished = Object.keys(baseline.inlineBilingualTernaries).filter(file => !(file in inlineTernaries));

    expect(added, `More copy moved out of the dictionary:\n${added.join('\n')}`).toEqual([]);
    expect(finished, `These files no longer hold inline bilingual ternaries — drop them from .arabic-ui-baseline.json:\n${finished.join('\n')}`).toEqual([]);
  });

  it('actually reads the product, not an empty set', () => {
    expect(keys.length).toBeGreaterThan(600);
    expect(missing.length).toBeGreaterThan(0);
    expect(baseline.missing.length).toBe(missing.length);
  });
});
