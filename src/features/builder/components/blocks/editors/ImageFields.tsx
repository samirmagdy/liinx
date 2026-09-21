import React from 'react';
import { type ProfileBlock } from '../../../../../types';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useBuilder } from '../../../context/BuilderContext';
import { useAdvancedFields } from './useAdvancedFields';
import { ImageMetadataFields } from './ImageMetadataFields';

interface ImageFieldsProps {
  block: ProfileBlock;
}

export const ImageFields: React.FC<ImageFieldsProps> = ({ block }) => {
  const { tr: ui } = useUiLanguage();
  const { handleBlockImageUpload } = useBuilder();
  const { advanced, updateAdvanced } = useAdvancedFields(block);

  return (
    <div className="space-y-2 sm:col-span-2">
      <label className="block text-xs font-semibold text-neutral-500 mb-1">
        {ui('Image URL')}
        <input
          id={`image-url-${block.id}`}
          name="imageUrl"
          value={advanced.imageUrl || ''}
          onChange={e => updateAdvanced('imageUrl', e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
        />
      </label>
      <input
        id={`image-file-upload-${block.id}`}
        name="imageFile"
        type="file"
        accept="image/*"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) void handleBlockImageUpload(block.id, file);
          e.currentTarget.value = '';
        }}
        aria-label={ui('Upload or replace image')}
        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
      />
      <ImageMetadataFields block={block} />
      <p className="text-xs text-neutral-500">
        {ui('Informative images need alt text. Mark an image decorative when it adds no meaning. Uploading a replacement does not delete the previous asset.')}
      </p>
    </div>
  );
};
