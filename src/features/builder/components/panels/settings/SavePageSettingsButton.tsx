import React from 'react';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useBuilder } from '../../../context/BuilderContext';

/**
 * The public-page fields are one group on the server, so every card that holds one of them
 * saves the whole group. The label and the confirmation both say that rather than claiming
 * to save only the card in front of the creator.
 */
export const SavePageSettingsButton: React.FC<{ feedback?: string | null }> = ({ feedback }) => {
  const { tr: ui } = useUiLanguage();
  const { isSavingPageSettings, handleSavePageSettings } = useBuilder();

  return (
    <div className="flex items-center justify-between gap-3">
      {feedback
        ? <p role="status" className="text-xs text-emerald-700">{feedback}</p>
        : <span />}
      <button
        type="button"
        disabled={isSavingPageSettings}
        onClick={() => void handleSavePageSettings()}
        className="min-h-11 rounded-xl bg-neutral-900 px-4 text-xs font-bold text-white disabled:opacity-50"
      >
        {isSavingPageSettings ? ui('Saving...') : ui('Save public page settings')}
      </button>
    </div>
  );
};
