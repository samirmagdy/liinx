import React from 'react';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { useBuilder } from '../context/BuilderContext';

/**
 * RALOA has no separate revision to publish, so "saved" and "live" are the same event for a
 * published page. The wording has to say that, and has to stop saying it the moment the page
 * being edited is one visitors cannot reach.
 */
export const SaveStatusIndicator: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { activePage, saveStatus, saveErrorBanner, queueRef, handleRetryFailedSaves } = useBuilder();

  const pending = Boolean(queueRef.current?.dirty) || saveStatus === 'saving';
  const failed = Boolean(saveErrorBanner) || saveStatus === 'error';

  return (
    <div className="save-status flex items-center gap-1.5 text-xs text-neutral-600" title={ui('Changes are published automatically')}>
      <span className={`w-2 h-2 rounded-full ${
        saveStatus === 'saving' ? 'bg-amber-500 animate-ping' :
        failed ? 'bg-rose-500' : 'bg-emerald-500'
      }`} />
      <span className="font-mono text-xs">
        {failed ? ui('Save failed') : pending ? ui('Saving...') : activePage?.published ? ui('Saved · Live') : ui('Saved')}
      </span>
      {activePage && (
        <span className="save-status-page text-neutral-500">
          <bdi>{activePage.title}</bdi> {activePage.published ? ui('is live') : ui('is unpublished')}
        </span>
      )}
      {pending && saveStatus === 'error' && (
        <button
          type="button"
          onClick={handleRetryFailedSaves}
          className="ml-1 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
        >
          {ui('Retry')}
        </button>
      )}
    </div>
  );
};
