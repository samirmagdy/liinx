import React from 'react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';
import { PageEditorFields } from './PageEditorFields';

/** Whether the open page is live, where it sits in the navigation, and how it is removed. */
export const PageEditorForm: React.FC = () => {
  const { tr: ui, isRtl } = useUiLanguage();
  const {
    pages,
    activePage,
    pageEditPublished,
    setPageEditPublished,
    isSavingPage,
    handleSavePage,
    handleMovePage,
    setDeletePageId
  } = useBuilder();

  if (!activePage) return null;
  const position = pages.findIndex(page => page.id === activePage.id);

  return (
    <>
      <div className="mt-4 grid grid-cols-1 gap-2 border-t border-neutral-100 pt-4 sm:grid-cols-2">
        <PageEditorFields />
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          {!activePage.isHome && (
            <div className="sm:col-span-2 space-y-1">
              <label htmlFor="page-manager-edit-published" className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
                <input
                  id="page-manager-edit-published"
                  name="pageEditPublished"
                  type="checkbox"
                  checked={pageEditPublished}
                  onChange={event => setPageEditPublished(event.target.checked)}
                />
                {ui('Published')}
              </label>
              <p className="text-xs font-normal text-neutral-500">
                {ui('Changes save directly to this page. Unpublishing hides it from visitors until it is published again.')}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleSavePage}
            disabled={isSavingPage}
            className="rounded-xl border border-neutral-300 px-3 py-2 text-xs font-bold text-neutral-900 hover:border-neutral-900 disabled:opacity-50"
          >
            {isSavingPage ? ui('Saving…') : ui('Save page settings')}
          </button>
          <button
            type="button"
            onClick={() => handleMovePage(-1)}
            disabled={activePage.isHome || position <= 1}
            aria-label={ui('Move page earlier')}
            className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-neutral-200 text-xs font-bold disabled:opacity-30"
          >
            {isRtl ? '→' : '←'}
          </button>
          <button
            type="button"
            onClick={() => handleMovePage(1)}
            disabled={position === pages.length - 1}
            aria-label={ui('Move page later')}
            className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-neutral-200 text-xs font-bold disabled:opacity-30"
          >
            {isRtl ? '←' : '→'}
          </button>
        </div>
      </div>
      {!activePage.isHome && (
        <button
          type="button"
          onClick={() => setDeletePageId(activePage.id)}
          className="mt-3 text-xs font-semibold text-rose-600 hover:text-rose-800"
        >
          {ui('Delete current page')}
        </button>
      )}
    </>
  );
};
