import React from 'react';
import { type ProfileBlock } from '../../../../../types';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useAdvancedFields } from './useAdvancedFields';

interface FormConsentFieldProps {
  block: ProfileBlock;
}

export const FormConsentField: React.FC<FormConsentFieldProps> = ({ block }) => {
  const { tr: ui } = useUiLanguage();
  const { advanced, updateAdvanced } = useAdvancedFields(block);

  return (
    <div className="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
      <label className="flex items-start gap-2 font-semibold">
        <input
          id={`block-form-consentreq-${block.id}`}
          name="consentRequired"
          type="checkbox"
          checked={advanced.consentRequired === true}
          onChange={e => updateAdvanced('consentRequired', e.target.checked)}
          className="mt-0.5"
        />
        {ui('Require visitor consent before storing responses')}
      </label>
      <p className="mt-1 pl-5 font-normal">
        {ui('Do not imply consent is collected unless this is enabled. RALOA does not send notifications automatically.')}
      </p>
      {advanced.consentRequired === true && (
        <input
          id={`block-form-consenttxt-${block.id}`}
          name="consentText"
          value={advanced.consentText || ''}
          onChange={e => updateAdvanced('consentText', e.target.value)}
          maxLength={300}
          placeholder={ui('Consent text (optional)')}
          aria-label={ui('Consent text')}
          className="mt-2 w-full rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-xs text-neutral-900"
        />
      )}
    </div>
  );
};
