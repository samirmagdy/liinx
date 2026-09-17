import React from 'react';
import { BlockCatalogItem } from './addBlockCatalog';

interface BlockCatalogGridProps {
  items: BlockCatalogItem[];
  searchQuery: string;
  ui: (key: string) => string;
  onSelect: (item: BlockCatalogItem) => void;
}

export const BlockCatalogGrid: React.FC<BlockCatalogGridProps> = ({
  items,
  searchQuery,
  ui,
  onSelect
}) => {
  if (items.length === 0) {
    return (
      <div className="col-span-2 sm:col-span-3 py-8 text-center text-xs text-neutral-500">
        {ui("No matching blocks found for")} &quot;{searchQuery}&quot;
      </div>
    );
  }

  return (
    <div className="overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[320px]">
      {items.map(item => {
        const IconComponent = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className="p-2.5 rounded-xl border border-neutral-200 bg-white hover:border-neutral-900 hover:shadow-xs flex items-start gap-2.5 text-left transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 group"
          >
            <div className={`p-2 rounded-lg shrink-0 transition-transform group-hover:scale-105 ${item.colorClass}`}>
              <IconComponent className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-neutral-900 truncate">
                {ui(item.titleKey)}
              </div>
              <div className="text-[10px] text-neutral-500 line-clamp-1 leading-tight mt-0.5">
                {ui(item.descKey)}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
