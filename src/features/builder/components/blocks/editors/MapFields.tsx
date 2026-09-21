import React from 'react';
import { type ProfileBlock } from '../../../../../types';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useAdvancedFields } from './useAdvancedFields';

interface MapFieldsProps {
  block: ProfileBlock;
}

export const MapFields: React.FC<MapFieldsProps> = ({ block }) => {
  const { tr: ui } = useUiLanguage();
  const { advanced, updateAdvanced } = useAdvancedFields(block);

  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-500 mb-1">
        {ui('Address or place to find')}
        <input
          id={`block-map-location-${block.id}`}
          name="mapLocation"
          value={advanced.location || ''}
          onChange={e => updateAdvanced('location', e.target.value)}
          maxLength={300}
          placeholder={ui('City or address')}
          className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
        />
      </label>
      <p className="text-xs font-normal text-neutral-500">
        {ui('Directions link only. No embedded map or device location request is used.')}
      </p>
    </div>
  );
};
