import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { ImporterError } from './ImporterError';

interface ImporterUrlFormProps {
  ui: (key: string) => string;
  url: string;
  loading: boolean;
  error: string | null;
  onUrlChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}

export const ImporterUrlForm: React.FC<ImporterUrlFormProps> = ({
  ui,
  url,
  loading,
  error,
  onUrlChange,
  onSubmit
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
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
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://linktr.ee/yourname"
          className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-100 dark:bg-neutral-900/10 border border-neutral-200 dark:border-neutral-800 focus:border-neutral-900 dark:focus:border-neutral-900 outline-none"
          autoFocus
          required
        />
      </div>
    </div>

    {error && <ImporterError message={error} />}

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
);
