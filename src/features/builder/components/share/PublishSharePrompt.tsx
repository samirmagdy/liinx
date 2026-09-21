import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { onPagePublished } from '../../utils/publishEvents';
import { ShareActions } from './ShareActions';

/**
 * Appears only when a page really changed to published. Nothing here fires on a plain save, so the
 * prompt never claims a page became reachable when it merely had its title edited.
 */
export const PublishSharePrompt: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const [publishedPageId, setPublishedPageId] = useState<string | null>(null);

  useEffect(() => onPagePublished(pageId => setPublishedPageId(pageId)), []);

  if (!publishedPageId) return null;

  return (
    <aside
      role="status"
      className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl animate-fade-in"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-neutral-900">{ui('Your page is live.')}</h2>
          <p className="mt-0.5 text-xs text-neutral-600">{ui('Anyone with this address can open it now.')}</p>
        </div>
        <button
          type="button"
          onClick={() => setPublishedPageId(null)}
          aria-label={ui('Dismiss')}
          className="grid min-h-11 min-w-11 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-3">
        <ShareActions />
      </div>
    </aside>
  );
};
