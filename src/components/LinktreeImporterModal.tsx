import { useLanguage as useUiLanguage } from '../context/LanguageContext';
import { useCapabilities } from '../context/CapabilitiesContext';
import { Modal } from './Modal';
import React, { useRef, useState } from 'react';
import { api } from '../services/api';
import { 
  Download, 
  Check, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  X,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { friendlyErrorMessage } from '../utils/errors';
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
  const { hasAnyImporter } = useCapabilities();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [updateProfileInfo, setUpdateProfileInfo] = useState(true);
  const requestGeneration = useRef(0);
  const availablePages = pages;
  const [pageId, setPageId] = useState(() => availablePages.find(page => page.isHome)?.id || '');

  if (!isOpen) return null;

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setPreviewData(null);
    const generation = ++requestGeneration.current;

    try {
      const res = await api.importer.preview(url.trim());
      if (generation !== requestGeneration.current) return;
      if (res.success && res.data) {
        setPreviewData(res.data);
        setSelectedIndices(new Set(res.data.links.map((_: any, i: number) => i)));
      } else {
        setError('No links found on this profile.');
      }
    } catch (err: any) {
      if (generation === requestGeneration.current) setError(friendlyErrorMessage(err, 'We could not inspect that profile. Make sure it is public and try again.'));
    } finally {
      if (generation === requestGeneration.current) setLoading(false);
    }
  };

  const handleCancel = () => {
    requestGeneration.current++;
    setLoading(false);
    setImporting(false);
    setPreviewData(null);
    setError(null);
    onClose();
  };

  const toggleSelectIndex = (idx: number) => {
    const next = new Set(selectedIndices);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setSelectedIndices(next);
  };

  const handleCommit = async () => {
    if (!previewData || selectedIndices.size === 0) return;

    setImporting(true);
    setError(null);

    try {
      const linksToImport = previewData.links.filter((_: any, i: number) => selectedIndices.has(i));
      await api.importer.commit({
        pageId: pageId || undefined,
        links: linksToImport,
        updateProfileInfo,
        displayName: previewData.displayName,
        bio: previewData.bio,
        avatarUrl: previewData.avatarUrl
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      await onImportComplete();
      onClose();
    } catch (err: any) {
      setError(friendlyErrorMessage(err, 'We could not import those links. Your profile was not changed; please try again.'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={handleCancel} label={ui('Import links')} wide>
      <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${hasAnyImporter ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                {ui("Import links")}</h2>
              <p className="text-xs text-neutral-500">
                {hasAnyImporter ? ui("Preview and choose links before importing") : ui("Direct profile importing is currently paused")}</p>
            </div>
          </div>
          <button 
            onClick={handleCancel}
            aria-label={ui('Close modal')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {!hasAnyImporter ? (
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
                  onClick={handleCancel}
                  className="py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-900/10 cursor-pointer"
                >
                  {ui("Close")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCancel();
                    onAddManual?.();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>{ui("Add links manually")}</span>
                </button>
              </div>
            </div>
          ) : !previewData ? (
            <form onSubmit={handlePreview} className="space-y-4">
              <div>
                <label htmlFor="linktree-profile-url" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {ui("Supported public profile URL")}</label>
                <div className="relative">
                  <input
                    id="linktree-profile-url"
                    name="profileUrl"
                    aria-label={ui("Linktree or Beacons Profile URL")}
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://linktr.ee/yourname"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-100 dark:bg-neutral-900/10 border border-neutral-200 dark:border-neutral-800 focus:border-neutral-900 dark:focus:border-neutral-900 outline-none"
                    autoFocus
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{ui("Extracting Profile & Links...")}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>{ui("Scan & Preview Links")}</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Step 2: Confirmation & Select Links */
            <div className="space-y-4">
              {/* Profile Preview Card */}
              <div className="p-3.5 rounded-2xl bg-neutral-100/60 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
                {previewData.avatarUrl ? (
                  <img
                    src={previewData.avatarUrl}
                    alt={previewData.displayName || "Avatar"}
                    className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 font-bold text-sm">
                    {previewData.displayName?.[0] || 'U'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                    {previewData.displayName || previewData.username}
                  </h4>
                  {previewData.bio && (
                    <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                      {previewData.bio}
                    </p>
                  )}
                  <span className="inline-block mt-1 text-[10px] text-neutral-600 dark:text-neutral-300 font-medium">
                    {previewData.links.length} {ui("links found")}
                  </span>
                </div>
              </div>

              {/* Update Profile Toggle */}
              <label htmlFor="importer-update-profile-info" className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">
                <input
                  id="importer-update-profile-info"
                  name="updateProfileInfo"
                  type="checkbox"
                  checked={updateProfileInfo}
                  onChange={(e) => setUpdateProfileInfo(e.target.checked)}
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
                  onChange={event => setPageId(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-normal text-neutral-900"
                  aria-label={ui("Import destination page")}
                >
                  {availablePages.map(page => <option key={page.id} value={page.id}>{page.isHome ? ui('Home') : `${page.title}${page.published ? '' : ' (draft)'}`}</option>)}
                </select>
                <span className="mt-1 block text-[10px] font-normal text-neutral-500">{ui("Imported links are appended to this page; existing content is not overwritten.")}</span>
              </label>

              {previewData.warnings?.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900" role="status">
                  <p className="font-semibold">{ui("Some source content could not be imported")}</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4">{previewData.warnings.map((warning: string) => <li key={warning}>{warning}</li>)}</ul>
                </div>
              )}

              {/* Links Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>{ui("Select links to import:")}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedIndices.size === previewData.links.length) {
                        setSelectedIndices(new Set());
                      } else {
                        setSelectedIndices(new Set(previewData.links.map((_: any, i: number) => i)));
                      }
                    }}
                    className="hover:text-neutral-900 dark:hover:text-white font-medium cursor-pointer"
                  >
                    {selectedIndices.size === previewData.links.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {previewData.links.map((link: any, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => toggleSelectIndex(idx)}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        selectedIndices.has(idx)
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                          : 'bg-neutral-100/50 dark:bg-neutral-900/20 border-neutral-300 dark:border-neutral-600 opacity-60'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-neutral-900 dark:text-white truncate">{link.title}</p>
                        <p className="text-[10px] text-neutral-600 truncate">{link.url}</p>
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

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { requestGeneration.current++; setPreviewData(null); setError(null); }}
                  className="py-2 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-900/10 cursor-pointer"
                >
                  {ui("Back")}</button>
                <button
                  type="button"
                  onClick={handleCommit}
                  disabled={importing || selectedIndices.size === 0}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{ui("Importing")}{selectedIndices.size} {ui("Links...")}</span>
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
          )}
        </div>
      </div>
    </Modal>
  );
};
