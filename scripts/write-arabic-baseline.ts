import fs from 'node:fs';
import path from 'node:path';
import { readArabicParity, repoRoot } from '../tests/helpers/arabicParity';

const { missing, inlineTernaries } = readArabicParity();
const target = path.join(repoRoot, '.arabic-ui-baseline.json');
const total = Object.values(inlineTernaries).reduce((sum, n) => sum + n, 0);
fs.writeFileSync(target, `${JSON.stringify({ missing, count: missing.length, inlineBilingualTernaries: inlineTernaries }, null, 2)}\n`);
console.log(`Wrote ${missing.length} untranslated ui() keys and ${total} inline bilingual ternaries across ${Object.keys(inlineTernaries).length} files`);
