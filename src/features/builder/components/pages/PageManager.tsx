import React from 'react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';

export const PageManager: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    pages,
    activePage,
    setActivePageId,
    newPageTitle,
    setNewPageTitle,
    newPageSlug,
    setNewPageSlug,
    handleCreatePage,
    pageEditTitle,
    setPageEditTitle,
    pageEditSlug,
    setPageEditSlug,
    pageEditDescription,
    setPageEditDescription,
    pageEditPublished,
    setPageEditPublished,
    isSavingPage,
    handleSavePage,
    handleMovePage,
    setDeletePageId,
    pageManagerError
  } = useBuilder();

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs" aria-labelledby="pages-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="pages-heading" className="text-sm font-bold text-neutral-900">{ui('Pages')}</h2>
          <p className="mt-1 text-xs text-neutral-500">{ui('Create separate pages and publish them from your profile navigation.')}</p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label={ui('Profile pages')}>
          {pages.map(page => (
            <button
              key={page.id}
              type="button"
              aria-current={page.id === activePage?.id ? 'page' : undefined}
              onClick={() => setActivePageId(page.id)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-neutral-900/30 ${
                page.id === activePage?.id
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-200 text-neutral-700 hover:border-neutral-500'
              }`}
            >
              {page.title}{page.isHome ? ` (${ui('Home')})` : ''}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input
          id="page-manager-new-title"
          name="newPageTitle"
          value={newPageTitle}
          onChange={event => setNewPageTitle(event.target.value)}
          placeholder={ui('New page title')}
          aria-label={ui('New page title')}
          className="rounded-xl border border-neutral-200 px-3 py-2 text-xs text-neutral-900"
        />
        <input
          id="page-manager-new-slug"
          name="newPageSlug"
          value={newPageSlug}
          onChange={event => setNewPageSlug(event.target.value.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase())}
          placeholder={ui('url-slug')}
          aria-label={ui('New page URL slug')}
          className="rounded-xl border border-neutral-200 px-3 py-2 font-mono text-xs text-neutral-900"
        />
        <button
          type="button"
          onClick={handleCreatePage}
          className="rounded-xl bg-neutral-900 px-3 py-2 text-xs font-bold text-white hover:bg-black"
        >
          {ui('Add page')}
        </button>
      </div>
      {activePage && (
        <div className="mt-4 grid grid-cols-1 gap-2 border-t border-neutral-100 pt-4 sm:grid-cols-2">
          <label htmlFor="page-manager-edit-title" className="grid gap-1 text-xs font-semibold text-neutral-700">
            {ui('Page title')}
            <input
              id="page-manager-edit-title"
              name="pageEditTitle"
              value={pageEditTitle}
              onChange={event => setPageEditTitle(event.target.value)}
              aria-label={ui('Page title')}
              className="rounded-xl border border-neutral-200 px-3 py-2 text-xs text-neutral-900"
            />
          </label>
          <label htmlFor="page-manager-edit-slug" className="grid gap-1 text-xs font-semibold text-neutral-700">
            {ui('URL slug')}
            <input
              id="page-manager-edit-slug"
              name="pageEditSlug"
              value={pageEditSlug}
              disabled={activePage.isHome}
              onChange={event => setPageEditSlug(event.target.value.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase())}
              aria-label={ui('URL slug')}
              className="rounded-xl border border-neutral-200 px-3 py-2 font-mono text-xs text-neutral-900 disabled:bg-neutral-100"
            />
          </label>
          <label htmlFor="page-manager-edit-description" className="grid gap-1 text-xs font-semibold text-neutral-700 sm:col-span-2">
            {ui('Description')}
            <textarea
              id="page-manager-edit-description"
              name="pageEditDescription"
              value={pageEditDescription}
              onChange={event => setPageEditDescription(event.target.value)}
              aria-label={ui('Page description')}
              maxLength={240}
              rows={2}
              className="rounded-xl border border-neutral-200 px-3 py-2 text-xs text-neutral-900"
            />
          </label>
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
                  {ui('Changes save directly to the published page. Unpublished pages are hidden; RALOA does not keep a separate draft revision.')}
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
              disabled={activePage.isHome || pages.findIndex(page => page.id === activePage.id) <= 1}
              aria-label={ui('Move page left')}
              className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-neutral-200 text-xs font-bold disabled:opacity-30"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => handleMovePage(1)}
              disabled={pages.findIndex(page => page.id === activePage.id) === pages.length - 1}
              aria-label={ui('Move page right')}
              className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-neutral-200 text-xs font-bold disabled:opacity-30"
            >
              →
            </button>
          </div>
        </div>
      )}
      {activePage && !activePage.isHome && (
        <button
          type="button"
          onClick={() => setDeletePageId(activePage.id)}
          className="mt-3 text-xs font-semibold text-rose-600 hover:text-rose-800"
        >
          {ui('Delete current page')}
        </button>
      )}
      {pageManagerError && (
        <p role="alert" className="mt-2 text-xs text-rose-700">
          {pageManagerError}
        </p>
      )}
    </section>
  );
};
