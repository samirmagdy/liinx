import React from 'react';
import { AlertCircle, Plus } from 'lucide-react';

interface ImporterUnavailableProps {
  ui: (key: string) => string;
  onClose: () => void;
  onAddManual?: () => void;
}

export const ImporterUnavailable: React.FC<ImporterUnavailableProps> = ({ ui, onClose, onAddManual }) => (
  <div className="space-y-4 py-1" data-testid="importer-unavailable-state">
    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200">
          {ui("Automated import is currently unavailable")}
        </h3>
        <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
          {ui("Direct profile importing from Linktree, Beacons, and Bio.fm is paused until authorized provider API partnerships or official export adapters are configured. In compliance with provider terms of service, scraping public profiles is not permitted.")}
        </p>
      </div>
    </div>

    <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/50 space-y-2">
      <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
        {ui("How to add your links to RALOA:")}
      </p>
      <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1.5 list-disc pl-4">
        <li>{ui("Create customized link, music, video, or booking blocks in seconds.")}</li>
        <li>{ui("Reorder blocks with drag-and-drop to design your unique layout.")}</li>
        <li>{ui("Enjoy full design freedom with custom themes and no RALOA fee on external sales or bookings.")}</li>
      </ul>
    </div>

    <div className="flex items-center gap-3 pt-2">
      <button
        type="button"
        onClick={onClose}
        className="py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-900/10 cursor-pointer"
      >
        {ui("Close")}
      </button>
      <button
        type="button"
        onClick={() => {
          onClose();
          onAddManual?.();
        }}
        className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-xs"
      >
        <Plus className="w-4 h-4" />
        <span>{ui("Add links manually")}</span>
      </button>
    </div>
  </div>
);
