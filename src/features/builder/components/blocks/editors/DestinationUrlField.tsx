import React from 'react';
import { type ProfileBlock } from '../../../../../types';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useBuilder } from '../../../context/BuilderContext';
import { useAdvancedFields } from './useAdvancedFields';

interface DestinationUrlFieldProps {
  block: ProfileBlock;
}

export const DestinationUrlField: React.FC<DestinationUrlFieldProps> = ({ block }) => {
  const { tr: ui } = useUiLanguage();
  const { handleBlockFileUpload } = useBuilder();
  const { advanced, updateAdvanced } = useAdvancedFields(block);

  return (
    <div>
      <label htmlFor={`block-url-${block.id}`} className="block text-xs font-semibold text-neutral-500 mb-1">
        {ui('Destination URL')}
      </label>
      <input
        id={`block-url-${block.id}`}
        name="url"
        value={advanced.fileUrl || advanced.url || ''}
        onChange={e => updateAdvanced(block.type === 'download' ? 'fileUrl' : 'url', e.target.value)}
        placeholder="https://..."
        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
      />
      {block.type === 'download' && (
        <input
          id={`block-download-file-${block.id}`}
          name="downloadFile"
          type="file"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) void handleBlockFileUpload(block.id, file);
          }}
          aria-label={ui('Upload downloadable file')}
          className="mt-2 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-900"
        />
      )}
    </div>
  );
};
