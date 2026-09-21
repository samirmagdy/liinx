import React from 'react';
import { Download, X } from 'lucide-react';
import { Modal } from './Modal';
import { useLanguage as useUiLanguage } from '../context/LanguageContext';
import { ImporterUnavailable } from './importer/ImporterUnavailable';
import { ImporterUrlForm } from './importer/ImporterUrlForm';
import { ImporterReview } from './importer/ImporterReview';
import { useLinkImport } from './importer/useLinkImport';
import type { CreatorPage } from '../types';

interface LinktreeImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  pages: CreatorPage[];
  onAddManual?: () => void;
}

export const LinktreeImporterModal: React.FC<LinktreeImporterModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  pages,
  onAddManual
}) => {
  const { tr: ui } = useUiLanguage();
  const importer = useLinkImport({ pages, onClose, onImportComplete });

  if (!isOpen) return null;

  return (
    <Modal open={isOpen} onClose={importer.cancel} label={ui('Import links')} wide>
      <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${importer.hasAnyImporter ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                {ui("Import links")}</h2>
              <p className="text-xs text-neutral-500">
                {importer.hasAnyImporter ? ui("Preview and choose links before importing") : ui("Direct profile importing is currently paused")}</p>
            </div>
          </div>
          <button 
            onClick={importer.cancel}
            aria-label={ui('Close modal')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {!importer.hasAnyImporter ? (
            <ImporterUnavailable ui={ui} onClose={importer.cancel} onAddManual={onAddManual} />
          ) : !importer.previewData ? (
            <ImporterUrlForm
              ui={ui}
              url={importer.url}
              loading={importer.loading}
              error={importer.error}
              onUrlChange={importer.setUrl}
              onSubmit={importer.preview}
            />
          ) : (
            /* Step 2: Confirmation & Select Links */
            <ImporterReview
              ui={ui}
              preview={importer.previewData}
              pages={importer.availablePages}
              selectedIndices={importer.selectedIndices}
              allSelected={importer.allSelected}
              importing={importer.importing}
              error={importer.error}
              updateProfileInfo={importer.updateProfileInfo}
              pageId={importer.pageId}
              onToggleProfileInfo={importer.setUpdateProfileInfo}
              onPageIdChange={importer.setPageId}
              onToggleIndex={importer.toggleSelectIndex}
              onToggleAll={importer.toggleSelectAll}
              onBack={importer.back}
              onCommit={importer.commit}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};
