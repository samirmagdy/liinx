import { describe, expect, it } from 'vitest';
import { matchesPublicPageSearch, searchableBlockText } from '../src/utils/publicSearch.js';

describe('public page search indexing', () => {
  it('normalizes punctuation and mixed Arabic/English content', () => {
    const block = { type: 'link', title: '  Studio — مرحباً!  ', subtitle: 'Design / تصميم' };
    expect(matchesPublicPageSearch(block, 'studio')).toBe(true);
    expect(matchesPublicPageSearch(block, 'مرحبا')).toBe(true);
    expect(matchesPublicPageSearch(block, 'unmatched')).toBe(false);
  });

  it('indexes folder entries and FAQ content but not gated body text', () => {
    const folder = { type: 'folder', title: 'Resources', items: [{ title: 'Read the guide', subtitle: 'Docs' }] };
    const faq = { type: 'faq', title: 'FAQ', items: [{ question: 'How?', answer: 'Follow the guide.' }] };
    const gate = { type: 'content_gate', title: 'Private', description: 'Access code', body: 'secret unpublished text' };
    expect(matchesPublicPageSearch(folder, 'guide')).toBe(true);
    expect(matchesPublicPageSearch(faq, 'follow')).toBe(true);
    expect(matchesPublicPageSearch(gate, 'secret')).toBe(false);
    expect(searchableBlockText(gate)).not.toContain('secret');
  });
});
