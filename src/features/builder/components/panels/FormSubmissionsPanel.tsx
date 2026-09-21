import React from 'react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';

/** Answers creators collected through form blocks, with export and delete. */
export const FormSubmissionsPanel: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    formSubmissions,
    formSubmissionsLoading,
    formSubmissionsError,
    formSubmissionTotal,
    formSubmissionHasMore,
    formSubmissionPage,
    setFormSubmissionPage,
    refreshSubmissions,
    handleDeleteFormSubmission
  } = useBuilder();

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
      <FormSubmissionFilters />

      {formSubmissionsLoading ? (
        <p role="status" className="py-6 text-center text-xs text-neutral-500">{ui('Loading form responses...')}</p>
      ) : formSubmissionsError ? (
        <div role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <p>{formSubmissionsError}</p>
          <button type="button" onClick={refreshSubmissions} className="mt-2 min-h-11 font-semibold underline">
            {ui('Retry')}
          </button>
        </div>
      ) : formSubmissions.length === 0 ? (
        <p role="status" className="py-6 text-center text-xs text-neutral-500">
          {formSubmissionTotal ? ui('No responses on this page.') : ui('No form responses yet.')}
        </p>
      ) : (
        <ul className="mt-3 max-h-96 space-y-2 overflow-auto">
          {formSubmissions.map(item => (
            <li key={item.id}>
              <FormSubmissionCard item={item} onDelete={() => void handleDeleteFormSubmission(item.id)} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-neutral-200 pt-2 text-xs text-neutral-500">
        <span>{formSubmissionTotal ? `${ui('Page')} ${formSubmissionPage} · ${formSubmissionTotal} ${ui('total')}` : ''}</span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={formSubmissionsLoading || formSubmissionPage <= 1}
            onClick={() => setFormSubmissionPage(page => Math.max(1, page - 1))}
            className="min-h-11 rounded border border-neutral-300 px-2 font-semibold disabled:opacity-40"
          >
            {ui('Previous')}
          </button>
          <button
            type="button"
            disabled={formSubmissionsLoading || !formSubmissionHasMore}
            onClick={() => setFormSubmissionPage(page => page + 1)}
            className="min-h-11 rounded border border-neutral-300 px-2 font-semibold disabled:opacity-40"
          >
            {ui('Next')}
          </button>
        </div>
      </div>
    </section>
  );
};

/** Heading, count, CSV export and the per-form filter. */
const FormSubmissionFilters: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    profile,
    formSubmissionsLoading,
    formSubmissionTotal,
    formSubmissionFilter,
    setFormSubmissionFilter,
    setFormSubmissionPage,
    handleExportFormResponses
  } = useBuilder();
  const formBlocks = profile.blocks.filter(block => block.type === 'form');

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-sm text-neutral-900">{ui('Form responses')}</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            {formSubmissionTotal ? `${formSubmissionTotal} ${ui('stored responses')}` : ui('No form responses yet.')}
          </p>
        </div>
        <button
          type="button"
          disabled={formSubmissionsLoading || formSubmissionTotal === 0}
          onClick={() => void handleExportFormResponses()}
          className="min-h-11 rounded-lg border border-neutral-300 px-2.5 text-xs font-semibold text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {ui('Export responses CSV')}
        </button>
      </div>

      <label htmlFor="audience-form-filter" className="mt-3 block text-xs font-semibold text-neutral-700">
        {ui('Filter by form')}
        <select
          id="audience-form-filter"
          name="formSubmissionFilter"
          value={formSubmissionFilter}
          onChange={event => {
            setFormSubmissionFilter(event.target.value);
            setFormSubmissionPage(1);
          }}
          className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs font-normal text-neutral-900"
        >
          <option value="">{ui('All forms')}</option>
          {formBlocks.map(block => (
            <option key={block.id} value={block.id}>{block.title}</option>
          ))}
        </select>
      </label>
    </>
  );
};

const FormSubmissionCard: React.FC<{ item: import('../../types/builder.types').FormSubmissionItem; onDelete: () => void }> = ({ item, onDelete }) => {
  const { tr: ui } = useUiLanguage();
  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-3 text-xs text-neutral-700">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-neutral-900">{item.formTitle}</p>
          <time className="font-mono text-neutral-600" dateTime={new Date(item.createdAt).toISOString()}>
            {new Date(item.createdAt).toLocaleString()}
          </time>
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`${ui('Delete response')} ${item.formTitle}`}
          className="min-h-11 text-rose-700 underline"
        >
          {ui('Delete')}
        </button>
      </div>
      <dl className="mt-2 space-y-1">
        {Object.entries(item.fields).map(([name, value]) => (
          <div key={name} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2">
            <dt className="font-semibold break-words">{item.fieldLabels[name] || name}</dt>
            <dd className="whitespace-pre-wrap break-words">{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
};
