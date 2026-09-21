import React from 'react';
import { type ProfileBlock } from '../../../../../types';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useAdvancedFields } from './useAdvancedFields';

interface ContentGateFieldProps {
  block: ProfileBlock;
}

export const ContentGateField: React.FC<ContentGateFieldProps> = ({ block }) => {
  const { tr: ui } = useUiLanguage();
  const { advanced, updateAdvanced } = useAdvancedFields(block);

  return (
    <div>
      <label htmlFor={`block-gate-password-${block.id}`} className="block text-xs font-semibold text-neutral-500 mb-1">
        {ui('Access code')}
      </label>
      <input
        id={`block-gate-password-${block.id}`}
        name="gatePassword"
        type="password"
        autoComplete="current-password"
        value={advanced.password || ''}
        onChange={e => updateAdvanced('password', e.target.value)}
        placeholder={advanced.locked ? ui('Leave blank to keep the current code; enter a new code to replace it.') : ui('Set a code to protect this text.')}
        maxLength={128}
        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
      />
      <p className="mt-1 text-xs font-normal text-neutral-500">
        {ui('Content gates protect inline text only. They do not provide membership or identity verification.')}
      </p>
    </div>
  );
};
