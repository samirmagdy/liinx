import React from 'react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';
import { PageEditorForm } from './PageEditorForm';

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
          dir="auto"
          value={newPageTitle}
          onChange={event => setNewPageTitle(event.target.value)}
          placeholder={ui('New page title')}
          aria-label={ui('New page title')}
          className="rounded-xl border border-neutral-200 px-3 py-2 text-xs text-neutral-900"
        />
        <input
          id="page-manager-new-slug"
          name="newPageSlug"
          dir="ltr"
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
      <PageEditorForm />
      {pageManagerError && (
        <p role="alert" className="mt-2 text-xs text-rose-700">
          {pageManagerError}
        </p>
      )}
    </section>
  );
};
