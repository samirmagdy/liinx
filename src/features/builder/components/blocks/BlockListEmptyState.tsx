import React from 'react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';

/**
 * The list is empty because nothing has been added to this page yet, so the state asks for one
 * action and says nothing else. There is no illustration to fill the space with and no claim to make.
 */
export const BlockListEmptyState: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { setShowAddMenu } = useBuilder();

  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-5 py-8 text-center">
      <p className="text-sm font-semibold text-neutral-900">{ui('This page has no blocks yet.')}</p>
      <button
        type="button"
        onClick={() => setShowAddMenu(true)}
        className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-neutral-900 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-black cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        {ui('Add your first block')}
      </button>
    </div>
  );
};
