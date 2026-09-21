import React from 'react';
import { type ProfileBlock } from '../../../../../types';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useAdvancedFields } from './useAdvancedFields';

interface ImageMetadataFieldsProps {
  block: ProfileBlock;
}

export const ImageMetadataFields: React.FC<ImageMetadataFieldsProps> = ({ block }) => {
  const { tr: ui } = useUiLanguage();
  const { advanced, updateAdvanced } = useAdvancedFields(block);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <label className="block text-xs font-semibold text-neutral-500">
        {ui('Alt text')}
        <input
          id={`image-alt-${block.id}`}
          name="imageAlt"
          value={advanced.alt || ''}
          onChange={e => updateAdvanced('alt', e.target.value)}
          maxLength={300}
          placeholder={ui('Describe the image')}
          className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
        />
      </label>
      <label className="flex items-end gap-2 pb-1 text-xs font-semibold text-neutral-500">
        <input
          id={`image-decorative-${block.id}`}
          name="imageDecorative"
          type="checkbox"
          checked={Boolean(advanced.decorative)}
          onChange={e => updateAdvanced('decorative', e.target.checked)}
        />
        {ui('Decorative image')}
      </label>
      <label className="block text-xs font-semibold text-neutral-500">
        {ui('Caption')}
        <input
          id={`image-caption-${block.id}`}
          name="imageCaption"
          value={advanced.caption || ''}
          onChange={e => updateAdvanced('caption', e.target.value)}
          maxLength={500}
          placeholder={ui('Optional caption')}
          className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
        />
      </label>
      <label className="block text-xs font-semibold text-neutral-500">
        {ui('Destination URL')}
        <input
          id={`image-link-url-${block.id}`}
          name="imageLinkUrl"
          value={advanced.linkUrl || ''}
          onChange={e => updateAdvanced('linkUrl', e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
        />
      </label>
      <label className="block text-xs font-semibold text-neutral-500">
        {ui('Image fit')}
        <select
          id={`image-fit-${block.id}`}
          name="imageFit"
          value={advanced.fit || 'cover'}
          onChange={e => updateAdvanced('fit', e.target.value)}
          className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
        >
          <option value="cover">{ui('Crop to fill')}</option>
          <option value="contain">{ui('Show full image')}</option>
        </select>
      </label>
      <label className="block text-xs font-semibold text-neutral-500">
        {ui('Image shape')}
        <select
          id={`image-aspect-${block.id}`}
          name="imageAspect"
          value={advanced.aspect || 'auto'}
          onChange={e => updateAdvanced('aspect', e.target.value)}
          className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
        >
          <option value="auto">{ui('Natural')}</option>
          <option value="square">{ui('Square')}</option>
          <option value="portrait">{ui('Portrait')}</option>
          <option value="landscape">{ui('Landscape')}</option>
        </select>
      </label>
      <label className="block text-xs font-semibold text-neutral-500">
        {ui('Crop position')}
        <select
          id={`image-crop-${block.id}`}
          name="imageCropPosition"
          value={advanced.cropPosition || 'center'}
          onChange={e => updateAdvanced('cropPosition', e.target.value)}
          className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
        >
          <option value="center">{ui('Center')}</option>
          <option value="top">{ui('Top')}</option>
          <option value="bottom">{ui('Bottom')}</option>
          <option value="left">{ui('Left')}</option>
          <option value="right">{ui('Right')}</option>
        </select>
      </label>
    </div>
  );
};
