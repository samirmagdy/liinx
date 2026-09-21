import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runtimeTranslations } from '../../src/config/runtimeTranslations';

export const repoRoot = path.resolve(fileURLToPath(import.meta.url), '..', '..', '..');

/** Keys whose Arabic value is a product name that stays Latin on purpose. */
export const latinValueAllowlist = new Set(['Studio', 'Studio VIP', 'PRO / STUDIO']);

const arabicScript = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function relativeToRoot(file: string): string {
  return path.relative(repoRoot, file).split(path.sep).join('/');
}

export function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) collectSourceFiles(fullPath, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(fullPath);
  }
  return out;
}

/** Every statically written `ui('…')` / `ui("…")` literal under src/. */
export function usedUiKeys(files: string[]): string[] {
  const keys = new Set<string>();
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/\bui\(\s*(['"])((?:\\.|(?!\1)[^\\])*)\1\s*[,)]/g)) {
      const key = match[2];
      if (key.includes('${')) continue;
      keys.add(key.replace(/\\(['"])/g, '$1'));
    }
  }
  return [...keys].sort();
}

/**
 * Copy written as `{ar ? 'عربي' : 'English'}` instead of `ui('English')`. It translates
 * today but it bypasses the dictionary, so nothing tells a contributor the key is missing.
 * The Arabic branch may be a JSX element (`ar ? <X /> : 'English'`), so the branch itself
 * is scanned to the end of the ternary rather than to the first quoted literal.
 */
export function countInlineBilingualTernaries(files: string[]): Record<string, number> {
  const starts = /\b(?:ar|isRtl)\s*\?\s*/g;
  const counts: Record<string, number> = {};
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    let count = 0;
    for (const match of source.matchAll(starts)) {
      const ternary = source.slice(match.index, source.indexOf(':', match.index + match[0].length));
      if (ternary.length && arabicScript.test(ternary)) count += 1;
    }
    if (count) counts[relativeToRoot(file)] = count;
  }
  return counts;
}


export function readArabicParity(dir = repoRoot) {
  const files = collectSourceFiles(path.join(dir, 'src'));
  const keys = usedUiKeys(files);
  return {
    keys,
    missing: keys.filter(key => !(key in runtimeTranslations)),
    latinValues: keys.filter(
      key => key in runtimeTranslations && !arabicScript.test(runtimeTranslations[key]) && !latinValueAllowlist.has(key)
    ),
    inlineTernaries: countInlineBilingualTernaries(files)
  };
}
