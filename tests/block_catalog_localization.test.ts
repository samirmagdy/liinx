import { describe, expect, it } from 'vitest';
import { BLOCK_CATALOG } from '../src/features/builder/components/blocks/addBlockCatalog';
import { translateRuntime } from '../src/config/runtimeTranslations';

const ar = (key: string) => translateRuntime(key, 'ar');

/**
 * The add-block catalogue prints a title and a description side by side, so a catalogue entry that
 * only half-translates is visible to the creator as one Arabic line and one English line. The keys
 * live in a data file rather than in ui('…') calls, which is why nothing else catches them.
 */
describe('add-block catalogue localization', () => {
  it('translates every catalogue title and description', () => {
    expect(BLOCK_CATALOG.length).toBeGreaterThan(0);
    for (const item of BLOCK_CATALOG) {
      expect(ar(item.titleKey), item.titleKey).not.toBe(item.titleKey);
      expect(ar(item.descKey), item.descKey).not.toBe(item.descKey);
    }
  });

  it('names the block types differently from one another', () => {
    const titles = BLOCK_CATALOG.map(item => ar(item.titleKey));
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('translates the catalogue chrome around the grid', () => {
    for (const key of ['All', 'Essential', 'Media', 'Engage', 'Commerce', 'Search blocks', 'Search block types (e.g. video, form, event)...', 'Clear search', 'Recommended for you', 'Browse all blocks']) {
      expect(ar(key), key).not.toBe(key);
    }
  });

  it('leaves English untouched', () => {
    expect(translateRuntime('Gallery', 'en')).toBe('Gallery');
  });
});
