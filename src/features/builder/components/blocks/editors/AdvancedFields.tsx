import React from 'react';
import { type ProfileBlock } from '../../../../../types';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useBuilder } from '../../../context/BuilderContext';
import { type StructuredEditorKind } from '../../../types/builder.types';
import { StructuredItemsEditor } from '../StructuredItemsEditor';
import { useAdvancedFields } from './useAdvancedFields';
import { RichTextField } from './RichTextField';
import { ImageFields } from './ImageFields';
import { DestinationUrlField } from './DestinationUrlField';
import { EventFields } from './EventFields';
import { PresaveFields } from './PresaveFields';
import { ProductFields } from './ProductFields';
import { TipsFields } from './TipsFields';
import { MapFields } from './MapFields';
import { PhoneFields } from './PhoneFields';
import { FormConsentField } from './FormConsentField';
import { SpacerField } from './SpacerField';
import { ContentGateField } from './ContentGateField';

const ADVANCED_TYPES = [
  'rich_text', 'image', 'gallery', 'carousel', 'spacer', 'form', 'download', 'map',
  'faq', 'testimonials', 'event', 'presave', 'phone', 'product', 'tips', 'content_gate'
];
const BODY_TYPES = ['rich_text', 'form', 'download', 'map', 'content_gate'];
const URL_TYPES = ['download', 'event', 'presave', 'product', 'tips'];
const STRUCTURED_TYPES = ['gallery', 'carousel', 'faq', 'testimonials', 'form'];

interface AdvancedFieldsProps {
  block: ProfileBlock;
}

export const AdvancedFields: React.FC<AdvancedFieldsProps> = ({ block }) => {
  const { tr: ui } = useUiLanguage();
  const { handleBlockImageUpload } = useBuilder();
  const { advanced, updateAdvanced } = useAdvancedFields(block);

  if (!ADVANCED_TYPES.includes(block.type)) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-neutral-100 text-xs">
      {BODY_TYPES.includes(block.type) && <RichTextField block={block} />}
      {block.type === 'image' && <ImageFields block={block} />}
      {URL_TYPES.includes(block.type) && <DestinationUrlField block={block} />}
      {block.type === 'event' && <EventFields block={block} />}
      {block.type === 'presave' && <PresaveFields block={block} />}
      {block.type === 'product' && <ProductFields block={block} />}
      {block.type === 'tips' && <TipsFields block={block} />}
      {block.type === 'map' && <MapFields block={block} />}
      {block.type === 'phone' && <PhoneFields block={block} />}
      {block.type === 'form' && <FormConsentField block={block} />}
      {STRUCTURED_TYPES.includes(block.type) && (
        <StructuredItemsEditor
          kind={block.type as StructuredEditorKind}
          value={advanced.items || advanced.fields || []}
          onChange={items => updateAdvanced(block.type === 'form' ? 'fields' : 'items', items)}
          onUpload={(file, _index, itemId) => void handleBlockImageUpload(block.id, file, 'imageUrl', undefined, itemId)}
          ui={ui}
        />
      )}
      {block.type === 'spacer' && <SpacerField block={block} />}
      {block.type === 'content_gate' && <ContentGateField block={block} />}
    </div>
  );
};
