import React, { useState } from 'react';
import { CheckCircle2, Share2 } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../context/LanguageContext';

/**
 * The phone's own status bar, and the one thing a reader can do from it: copy the address.
 * A preview that cannot be used shows the same chrome without making it a tab stop.
 */
export const PhoneStatusBar: React.FC<{ interactive: boolean; username: string }> = ({ interactive, username }) => {
  const { tr: ui } = useUiLanguage();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/@${username}`);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="flex items-center justify-between text-xs px-2 mb-6 opacity-70">
        <span className="font-mono text-[11px] font-semibold tracking-tight">9:41</span>
        <div className="flex items-center gap-1">
          {interactive ? (
            <button
              onClick={share}
              aria-label={ui('Share bio link')}
              title={ui('Copy bio link')}
              className="grid min-h-11 min-w-11 place-items-center rounded-full hover:bg-neutral-900/10 dark:hover:bg-neutral-100/10 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span aria-hidden="true" className="grid min-h-11 min-w-11 place-items-center rounded-full opacity-80">
              <Share2 className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>

      {copied && (
        <div role="status" aria-live="polite" className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-neutral-900 text-white text-[11px] px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-fade-in">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>{ui('Link copied to clipboard')}</span>
        </div>
      )}
    </>
  );
};
