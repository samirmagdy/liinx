import React from 'react';
import { Download, Loader2 } from 'lucide-react';
import type { CreatorPage } from '../../types';
import { ImportLinkSelector } from './ImportLinkSelector';
import { ImportedProfileCard } from './ImportedProfileCard';
import { ImporterError } from './ImporterError';
import type { ImporterPreview } from './useLinkImport';

interface ImporterReviewProps {
  ui: (key: string) => string;
  preview: ImporterPreview;
  pages: CreatorPage[];
  selectedIndices: Set<number>;
  allSelected: boolean;
  importing: boolean;
  error: string | null;
  updateProfileInfo: boolean;
  pageId: string;
  onToggleProfileInfo: (value: boolean) => void;
  onPageIdChange: (value: string) => void;
  onToggleIndex: (index: number) => void;
  onToggleAll: () => void;
  onBack: () => void;
  onCommit: () => void;
}

export const ImporterReview: React.FC<ImporterReviewProps> = ({
  ui,
  preview,
  pages,
  selectedIndices,
  allSelected,
  importing,
  error,
  updateProfileInfo,
  pageId,
  onToggleProfileInfo,
  onPageIdChange,
  onToggleIndex,
  onToggleAll,
  onBack,
  onCommit
}) => (
  <div className="space-y-4">
    <ImportedProfileCard preview={preview} linksFoundLabel={ui("links found")} />

    <label htmlFor="importer-update-profile-info" className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">
      <input
        id="importer-update-profile-info"
        name="updateProfileInfo"
        type="checkbox"
        checked={updateProfileInfo}
        onChange={(e) => onToggleProfileInfo(e.target.checked)}
        className="rounded border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer"
      />
      <span>{ui("Also import avatar and bio info into profile")}</span>
    </label>

    <label htmlFor="importer-page-destination" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
      {ui("Import destination page")}
      <select
        id="importer-page-destination"
        name="importPageId"
        value={pageId}
        onChange={event => onPageIdChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-normal text-neutral-900"
        aria-label={ui("Import destination page")}
      >
        {pages.map(page => <option key={page.id} value={page.id}>{page.isHome ? ui('Home') : `${page.title}${page.published ? '' : ` (${ui('Unpublished')})`}`}</option>)}
      </select>
      <span className="mt-1 block text-xs font-normal text-neutral-500">{ui("Imported links are appended to this page; existing content is not overwritten.")}</span>
    </label>

    {preview.warnings && preview.warnings.length > 0 && (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900" role="status">
        <p className="font-semibold">{ui("Some source content could not be imported")}</p>
        <ul className="mt-1 list-disc space-y-1 pl-4">{preview.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>
      </div>
    )}

    <ImportLinkSelector
      ui={ui}
      links={preview.links}
      selectedIndices={selectedIndices}
      allSelected={allSelected}
      onToggleIndex={onToggleIndex}
      onToggleAll={onToggleAll}
    />

    {error && <ImporterError message={error} />}

    <div className="flex items-center gap-3 pt-2">
      <button
        type="button"
        onClick={onBack}
        className="py-2 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-900/10 cursor-pointer"
      >
        {ui("Back")}</button>
      <button
        type="button"
        onClick={onCommit}
        disabled={importing || selectedIndices.size === 0}
        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
      >
        {importing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{ui("Import")}{selectedIndices.size} {ui("Links...")}</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>{ui("Import")}{selectedIndices.size} {ui("Links into RALOA")}</span>
          </>
        )}
      </button>
    </div>
  </div>
);
