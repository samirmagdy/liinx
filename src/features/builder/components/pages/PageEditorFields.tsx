import React from 'react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';

/** What the page is called, the address it lives at, and the line a visitor sees before opening it. */
export const PageEditorFields: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    activePage,
    pageEditTitle,
    setPageEditTitle,
    pageEditSlug,
    setPageEditSlug,
    pageEditDescription,
    setPageEditDescription
  } = useBuilder();

  if (!activePage) return null;

  return (
    <>
      <label htmlFor="page-manager-edit-title" className="grid gap-1 text-xs font-semibold text-neutral-700">
        {ui('Page title')}
        <input
          id="page-manager-edit-title"
          name="pageEditTitle"
          dir="auto"
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
          dir="ltr"
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
          dir="auto"
          value={pageEditDescription}
          onChange={event => setPageEditDescription(event.target.value)}
          aria-label={ui('Page description')}
          maxLength={240}
          rows={2}
          className="rounded-xl border border-neutral-200 px-3 py-2 text-xs text-neutral-900"
        />
      </label>
    </>
  );
};
