import React from 'react';
import { type ProfileBlock } from '../../../../../types';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useAdvancedFields } from './useAdvancedFields';

interface SpacerFieldProps {
  block: ProfileBlock;
}

function clampSpacerHeight(raw: unknown): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.min(240, Math.max(16, parsed)) : 48;
}

export const SpacerField: React.FC<SpacerFieldProps> = ({ block }) => {
  const { tr: ui } = useUiLanguage();
  const { advanced, updateAdvanced } = useAdvancedFields(block);
  const spacerHeight = clampSpacerHeight(advanced.height);

  return (
    <div>
      <label htmlFor={`spacer-height-${block.id}`} className="block text-xs font-semibold text-neutral-500 mb-1">
        {ui('Height (px)')}
      </label>
      <input
        id={`spacer-height-${block.id}`}
        type="number"
        min="16"
        max="240"
        step="1"
        value={spacerHeight}
        onChange={e => updateAdvanced('height', clampSpacerHeight(e.target.value))}
        aria-describedby={`spacer-help-${block.id}`}
        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
      />
      <p id={`spacer-help-${block.id}`} className="mt-1 text-xs font-normal text-neutral-500">
        {ui(`Adds ${spacerHeight}px of intentional space. Normal block gaps are not added around this spacer.`)}
      </p>
    </div>
  );
};
