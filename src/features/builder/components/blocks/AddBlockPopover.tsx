import React, { useState, useMemo } from 'react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';
import { BLOCK_CATALOG, type BlockCategory, type BlockCatalogItem } from './addBlockCatalog';
import { BlockCatalogGrid } from './BlockCatalogGrid';
import { RecommendedBlocks, resolveRecommendedBlocks } from './RecommendedBlocks';
import { AddBlockHeader } from './AddBlockHeader';

function filterCatalog(catalog: BlockCatalogItem[], category: BlockCategory, query: string, ui: (k: string) => string): BlockCatalogItem[] {
  const clean = query.trim().toLowerCase();
  return catalog.filter(item => {
    if (category !== 'all' && item.category !== category) return false;
    if (!clean) return true;
    return (
      ui(item.titleKey).toLowerCase().includes(clean) ||
      item.titleKey.toLowerCase().includes(clean) ||
      ui(item.descKey).toLowerCase().includes(clean) ||
      item.descKey.toLowerCase().includes(clean) ||
      item.type.toLowerCase().includes(clean)
    );
  });
}

/** The catalogue browser: search, category chips, and the suggestions the account's discipline earns. */
export const AddBlockPopover: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BlockCategory>('all');
  const [browseAll, setBrowseAll] = useState(false);

  const {
    profile,
    setShowAddMenu,
    handleAddLink,
    handleAddHeader,
    handleAddAudio,
    handleAddVideo,
    handleAddFolder,
    handleAddNewsletter,
    handleAddAdvancedBlock
  } = useBuilder();

  const handleSelectBlock = (item: BlockCatalogItem) => {
    const actions: Record<string, () => void> = {
      link: handleAddLink,
      header: handleAddHeader,
      audio: handleAddAudio,
      video: handleAddVideo,
      folder: handleAddFolder,
      newsletter: handleAddNewsletter
    };
    if (actions[item.handlerKey]) {
      actions[item.handlerKey]();
    } else {
      handleAddAdvancedBlock(item.type);
    }
    setShowAddMenu(false);
    setSearchQuery('');
    setBrowseAll(false);
  };

  const filteredCatalog = useMemo(
    () => filterCatalog(BLOCK_CATALOG, selectedCategory, searchQuery, ui),
    [selectedCategory, searchQuery, ui]
  );

  /** Suggestions come from the discipline stored on the account; without one, the full grid shows. */
  const recommended = useMemo(() => resolveRecommendedBlocks(BLOCK_CATALOG, profile.signupIntent), [profile.signupIntent]);
  const showingRecommendations = recommended.length > 0 && !browseAll && !searchQuery.trim() && selectedCategory === 'all';

  return (
    <div className="absolute top-full left-0 right-0 mt-2 p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 shadow-2xl z-20 flex flex-col gap-3 animate-fade-in max-h-[480px] overflow-hidden">
      <AddBlockHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        ui={ui}
      />

      {showingRecommendations ? (
        <RecommendedBlocks
          items={recommended}
          ui={ui}
          onSelect={handleSelectBlock}
          onBrowseAll={() => setBrowseAll(true)}
        />
      ) : (
        <BlockCatalogGrid
          items={filteredCatalog}
          searchQuery={searchQuery}
          ui={ui}
          onSelect={handleSelectBlock}
        />
      )}
    </div>
  );
};
