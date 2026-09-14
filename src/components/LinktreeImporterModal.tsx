import React, { useState } from 'react';
import { api } from '../services/api';
import { 
  Download, 
  Check, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  Sparkles, 
  ArrowRight,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LinktreeImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const LinktreeImporterModal: React.FC<LinktreeImporterModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [updateProfileInfo, setUpdateProfileInfo] = useState(true);

  if (!isOpen) return null;

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setPreviewData(null);

    try {
      const res = await api.importer.preview(url.trim());
      if (res.success && res.data) {
        setPreviewData(res.data);
        setSelectedIndices(new Set(res.data.links.map((_: any, i: number) => i)));
      } else {
        setError('No links found on this profile.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to inspect profile. Ensure the profile is public.');
    } finally {
      setLoading(false);
    }
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

      onImportComplete();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import links.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                One-Click Linktree Importer
              </h2>
              <p className="text-xs text-neutral-500">
                Migrate in seconds with 0% manual copy-pasting
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {!previewData ? (
            <form onSubmit={handlePreview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Linktree or Beacons Profile URL
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://linktr.ee/yourname or yourname"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 focus:border-neutral-900 dark:focus:border-white focus:outline-none"
                    autoFocus
                    required
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1.5">
                  Supports Linktree, Beacons, and public bio profiles.
                </p>
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
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting Profile & Links...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Scan & Preview Links</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Profile Preview Card */}
              <div className="p-3.5 bg-neutral-50 dark:bg-white/5 rounded-2xl border border-neutral-200 dark:border-white/10 flex items-center gap-3">
                {previewData.avatarUrl && (
                  <img
                    src={previewData.avatarUrl}
                    alt={previewData.displayName || 'Avatar'}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                    {previewData.displayName || 'Profile Preview'}
                  </p>
                  {previewData.bio && (
                    <p className="text-[11px] text-neutral-500 line-clamp-2 mt-0.5">
                      {previewData.bio}
                    </p>
                  )}
                  <span className="inline-block mt-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                    {previewData.links.length} links discovered
                  </span>
                </div>
              </div>

              {/* Update Profile Toggle */}
              <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={updateProfileInfo}
                  onChange={(e) => setUpdateProfileInfo(e.target.checked)}
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer"
                />
                <span>Also import avatar and bio info into profile</span>
              </label>

              {/* Links Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>Select links to import:</span>
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
                          : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-white/10 opacity-60'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-neutral-900 dark:text-white truncate">{link.title}</p>
                        <p className="text-[10px] text-neutral-400 truncate">{link.url}</p>
                      </div>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                        selectedIndices.has(idx)
                          ? 'bg-emerald-600 border-emerald-600 text-white'
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
                  onClick={() => setPreviewData(null)}
                  className="py-2 px-3 rounded-xl border border-neutral-200 dark:border-white/10 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-white/5 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCommit}
                  disabled={importing || selectedIndices.size === 0}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Importing {selectedIndices.size} Links...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Import {selectedIndices.size} Links into LIINX</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
