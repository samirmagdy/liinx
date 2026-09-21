import React from 'react';
import { Plus, Download } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useCapabilities } from '../../../../context/CapabilitiesContext';
import { useBuilder } from '../../context/BuilderContext';
import { AddBlockPopover } from './AddBlockPopover';

export const AddBlockMenu: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { hasAnyImporter } = useCapabilities();
  const { showAddMenu, setShowAddMenu, setShowImporterModal } = useBuilder();

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1 relative">
        <button
          id="builder-add-block"
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full py-3.5 px-4 rounded-2xl bg-neutral-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <Plus className="w-4 h-4" />
          <span>{ui("Add New Link or Block to Profile")}</span>
        </button>

        {showAddMenu && <AddBlockPopover />}
      </div>

      <button
        type="button"
        onClick={() => setShowImporterModal(true)}
        className={`py-3.5 px-4 rounded-2xl bg-neutral-50 border shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 shrink-0 ${
          hasAnyImporter
            ? 'border-neutral-200 hover:border-emerald-600 text-neutral-900 hover:text-emerald-700 font-bold focus-visible:ring-emerald-500/20'
            : 'border-neutral-200 hover:border-neutral-300 text-neutral-600 font-medium focus-visible:ring-neutral-400'
        }`}
        title={hasAnyImporter ? ui("Import Linktree") : ui("Profile importing is currently unavailable")}
      >
        <Download className={`w-4 h-4 ${hasAnyImporter ? 'text-emerald-600' : 'text-neutral-600'}`} />
        <span>{hasAnyImporter ? ui("Import Linktree") : ui("Import")}</span>
        {!hasAnyImporter && (
          <span className="text-[11px] font-mono font-bold uppercase tracking-caps px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
            {ui("Paused")}
          </span>
        )}
      </button>
    </div>
  );
};
