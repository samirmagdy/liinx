import React from 'react';
import { recommendedBlockTypes } from '../../../../../shared/index.js';
import { type BlockCatalogItem } from './addBlockCatalog';
import { BlockCatalogGrid } from './BlockCatalogGrid';

/** The suggested types, resolved against the real catalogue so a stale suggestion cannot render. */
export function resolveRecommendedBlocks(catalog: BlockCatalogItem[], intent: unknown): BlockCatalogItem[] {
  return recommendedBlockTypes(intent)
    .map(type => catalog.find(item => item.type === type))
    .filter((item): item is BlockCatalogItem => Boolean(item));
}

interface RecommendedBlocksProps {
  items: BlockCatalogItem[];
  ui: (key: string) => string;
  onSelect: (item: BlockCatalogItem) => void;
  onBrowseAll: () => void;
}

/**
 * A filtered view of the same grid the whole catalogue uses, so a suggestion offers nothing the
 * full list does not: every block in the catalogue is included on every plan, and nothing here says
 * or implies otherwise.
 */
export const RecommendedBlocks: React.FC<RecommendedBlocksProps> = ({ items, ui, onSelect, onBrowseAll }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between gap-2 px-0.5">
      <h3 className="text-[11px] font-mono font-bold uppercase tracking-caps text-neutral-500">
        {ui('Recommended for you')}
      </h3>
      <button
        type="button"
        onClick={onBrowseAll}
        className="min-h-11 rounded-md px-1 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:underline underline-offset-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        {ui('Browse all blocks')}
      </button>
    </div>
    <BlockCatalogGrid items={items} searchQuery="" ui={ui} onSelect={onSelect} />
  </div>
);
