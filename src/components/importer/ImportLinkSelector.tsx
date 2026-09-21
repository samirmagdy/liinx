import React from 'react';
import { Check } from 'lucide-react';
import type { ImporterLink } from './useLinkImport';

interface ImportLinkSelectorProps {
  ui: (key: string) => string;
  links: ImporterLink[];
  selectedIndices: Set<number>;
  allSelected: boolean;
  onToggleIndex: (index: number) => void;
  onToggleAll: () => void;
}

export const ImportLinkSelector: React.FC<ImportLinkSelectorProps> = ({
  ui,
  links,
  selectedIndices,
  allSelected,
  onToggleIndex,
  onToggleAll
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-xs text-neutral-500">
      <span>{ui("Select links to import:")}</span>
      <button
        type="button"
        onClick={onToggleAll}
        className="hover:text-neutral-900 dark:hover:text-white font-medium cursor-pointer"
      >
        {allSelected ? 'Deselect All' : 'Select All'}
      </button>
    </div>

    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
      {links.map((link, idx) => (
        <div
          key={idx}
          onClick={() => onToggleIndex(idx)}
          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors cursor-pointer ${
            selectedIndices.has(idx)
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
              : 'bg-neutral-100/50 dark:bg-neutral-900/20 border-neutral-300 dark:border-neutral-600 opacity-60'
          }`}
        >
          <div className="min-w-0 pr-2">
            <p className="font-semibold text-neutral-900 dark:text-white truncate">{link.title}</p>
            <p className="text-xs text-neutral-600 truncate">{link.url}</p>
          </div>
          <div className={`w-4 h-4 rounded flex items-center justify-center border ${
            selectedIndices.has(idx)
              ? 'bg-emerald-700 border-emerald-700 text-white'
              : 'border-neutral-300 dark:border-neutral-600'
          }`}>
            {selectedIndices.has(idx) && <Check className="w-3 h-3" />}
          </div>
        </div>
      ))}
    </div>
  </div>
);
