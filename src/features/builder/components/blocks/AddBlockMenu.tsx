import React, { useState, useMemo } from 'react';
import { Plus, Download } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useCapabilities } from '../../../../context/CapabilitiesContext';
import { useBuilder } from '../../context/BuilderContext';
import { BLOCK_CATALOG, type BlockCategory, type BlockCatalogItem } from './addBlockCatalog';
import { BlockCatalogGrid } from './BlockCatalogGrid';
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

export const AddBlockMenu: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { hasAnyImporter } = useCapabilities();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BlockCategory>('all');

  const {
    showAddMenu,
    setShowAddMenu,
    handleAddLink,
    handleAddHeader,
    handleAddAudio,
    handleAddVideo,
    handleAddFolder,
    handleAddNewsletter,
    handleAddAdvancedBlock,
    setShowImporterModal
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
  };

  const filteredCatalog = useMemo(
    () => filterCatalog(BLOCK_CATALOG, selectedCategory, searchQuery, ui),
    [selectedCategory, searchQuery, ui]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1 relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full py-3.5 px-4 rounded-2xl bg-neutral-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-2"
        >
          <Plus className="w-4 h-4" />
          <span>{ui("Add New Link or Block to Profile")}</span>
        </button>

        {showAddMenu && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 shadow-2xl z-20 flex flex-col gap-3 animate-fade-in max-h-[480px] overflow-hidden">
            <AddBlockHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              ui={ui}
            />

            <BlockCatalogGrid
              items={filteredCatalog}
              searchQuery={searchQuery}
              ui={ui}
              onSelect={handleSelectBlock}
            />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowImporterModal(true)}
        className={`py-3.5 px-4 rounded-2xl bg-neutral-50 border shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 shrink-0 ${
          hasAnyImporter
            ? 'border-neutral-200 hover:border-emerald-600 text-neutral-900 hover:text-emerald-700 font-bold focus-visible:ring-emerald-500/20'
            : 'border-neutral-200 hover:border-neutral-300 text-neutral-600 font-medium focus-visible:ring-neutral-400'
        }`}
        title={hasAnyImporter ? ui("Import Linktree") : ui("Profile importing is currently unavailable")}
      >
        <Download className={`w-4 h-4 ${hasAnyImporter ? 'text-emerald-600' : 'text-neutral-400'}`} />
        <span>{hasAnyImporter ? ui("Import Linktree") : ui("Import")}</span>
        {!hasAnyImporter && (
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
            {ui("Paused")}
          </span>
        )}
      </button>
    </div>
  );
};
