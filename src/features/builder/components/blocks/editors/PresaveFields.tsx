import React from 'react';
import { type ProfileBlock } from '../../../../../types';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useAdvancedFields } from './useAdvancedFields';

interface PresaveFieldsProps {
  block: ProfileBlock;
}

export const PresaveFields: React.FC<PresaveFieldsProps> = ({ block }) => {
  const { tr: ui } = useUiLanguage();
  const { advanced, updateAdvanced } = useAdvancedFields(block);

  return (
    <div className="sm:col-span-2">
      <label className="block text-xs font-semibold text-neutral-500">
        {ui('Release description')}
        <textarea
          id={`block-presave-desc-${block.id}`}
          name="presaveDescription"
          value={advanced.description || ''}
          onChange={e => updateAdvanced('description', e.target.value)}
          maxLength={1000}
          className="mt-1 min-h-16 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
        />
      </label>
      <p className="mt-1 text-xs font-normal text-neutral-500">
        {ui('External release link only. RALOA does not complete a music-service pre-save or request authorization.')}
      </p>
    </div>
  );
};
