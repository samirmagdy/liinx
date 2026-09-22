import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { repoRoot } from './helpers/arabicParity';
import { getFaqs } from '../src/config/faq';
import { brand } from '../src/config/brand';

const en = getFaqs('en', false);
const ar = getFaqs('ar', false);
const questions = (list: { question: string }[]) => list.map(entry => entry.question);

describe('the FAQ answers what stops a purchase before it explains the product', () => {
  it('leads with price, then what happens when payment stops', () => {
    const first = questions(en).slice(0, 2).join(' | ');
    expect(first).toBe('Is there a free plan? | What happens to my page when a paid plan ends?');
    expect(en[1].answer).toContain('Nothing is deleted');
    expect(en[1].answer).toContain('Stripe billing portal');
  });

  it('answers the Arabic-reading visitor in the first five', () => {
    expect(questions(en).slice(0, 5)).toContain('Does RALOA work in Arabic?');
    expect(questions(ar).slice(0, 5)).toContain('هل تعمل RALOA بالعربية؟');
  });

  it('says the Arabic layout in both languages and never leaves an English answer in the Arabic list', () => {
    expect(ar).toHaveLength(en.length);
    for (const [index, entry] of ar.entries()) {
      expect(/[\u0600-\u06FF]/.test(entry.question), entry.question).toBe(true);
      expect(/[\u0600-\u06FF]/.test(entry.answer), `answer ${index}`).toBe(true);
    }
  });

  it('names the export path, because a visitor who cannot leave will not arrive', () => {
    const exportAnswer = en.find(entry => entry.question === 'Can I get my data out?');
    expect(exportAnswer?.answer).toContain('JSON');
    expect(exportAnswer?.answer).toContain('not included');
  });

  it('promises only what the export endpoint actually returns', () => {
    const source = readFileSync(join(repoRoot, 'server/routes/auth.ts'), 'utf8');
    const handler = source.slice(source.indexOf('/export-data'));
    for (const table of ['pages', 'blocks', 'newsletter_subscribers', 'form_submissions']) {
      expect(handler).toContain(`FROM ${table}`);
    }
    // The copy says media files are missing from the export, so the query must not select a file table.
    expect(handler.slice(0, handler.indexOf('res.json'))).not.toMatch(/FROM (media_files|uploads)/);
  });

  it('keeps the import answer honest for whichever capability the account has', () => {
    const question = 'Can I import my links?';
    expect(questions(getFaqs('en', true))).toContain(question);
    const paused = getFaqs('en', false).find(entry => entry.question === question);
    expect(paused?.answer).toContain('paused');
    const available = getFaqs('en', true).find(entry => entry.question === question);
    expect(available?.answer).toContain('review');
  });

  it('never hardcodes the host into an answer', () => {
    const source = readFileSync(join(repoRoot, 'src/config/faq.ts'), 'utf8');
    expect(source).not.toMatch(/raloa\.app|linktree|bio\.link/i);
    const copy = [...en, ...ar].map(entry => `${entry.question} ${entry.answer}`).join(' ');
    expect(copy).toContain(brand.domain);
  });
});
