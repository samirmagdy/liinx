import React from 'react';
import { Search, X } from 'lucide-react';
import { type BlockCategory } from './addBlockCatalog';

interface AddBlockHeaderProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedCategory: BlockCategory;
  onCategorySelect: (cat: BlockCategory) => void;
  ui: (key: string) => string;
}

export const AddBlockHeader: React.FC<AddBlockHeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategorySelect,
  ui
}) => {
  const categories: { id: BlockCategory; label: string }[] = [
    { id: 'all', label: ui('All') },
    { id: 'essential', label: ui('Essential') },
    { id: 'media', label: ui('Media') },
    { id: 'engage', label: ui('Engage') },
    { id: 'commerce', label: ui('Commerce') }
  ];

  return (
    <>
      <div className="relative flex items-center">
        <label htmlFor="add-block-search-input" className="sr-only">
          {ui("Search blocks")}
        </label>
        <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
        <input
          id="add-block-search-input"
          name="addBlockSearch"
          type="search"
          autoFocus
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={ui("Search block types (e.g. video, form, event)...")}
          className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10"
        />
        {searchQuery && (
          <button
            type="button"
            aria-label={ui("Clear search")}
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 p-0.5 rounded-full text-neutral-400 hover:text-neutral-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategorySelect(cat.id)}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300 hover:text-neutral-900'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </>
  );
};
