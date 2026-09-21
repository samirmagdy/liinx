import React from 'react';
import { type ProfileBlock } from '../../../../../types';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useAdvancedFields } from './useAdvancedFields';

interface ProductFieldsProps {
  block: ProfileBlock;
}

export const ProductFields: React.FC<ProductFieldsProps> = ({ block }) => {
  const { tr: ui } = useUiLanguage();
  const { advanced, updateAdvanced } = useAdvancedFields(block);

  return (
    <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2">
      <label className="block text-xs font-semibold text-neutral-500">
        {ui('Product description')}
        <textarea
          id={`block-product-desc-${block.id}`}
          name="productDescription"
          value={advanced.description || ''}
          onChange={e => updateAdvanced('description', e.target.value)}
          maxLength={1000}
          className="mt-1 min-h-20 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
        />
      </label>
      <label className="block text-xs font-semibold text-neutral-500">
        {ui('Product image URL')}
        <input
          id={`block-product-image-${block.id}`}
          name="productImage"
          value={advanced.imageUrl || ''}
          onChange={e => updateAdvanced('imageUrl', e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
        />
      </label>
      <label className="block text-xs font-semibold text-neutral-500">
        {ui('Price amount')}
        <input
          id={`block-product-price-${block.id}`}
          name="priceAmount"
          value={advanced.priceAmount || ''}
          onChange={e => updateAdvanced('priceAmount', e.target.value)}
          inputMode="decimal"
          maxLength={11}
          placeholder={ui('e.g. 29.00')}
          className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
        />
      </label>
      <label className="block text-xs font-semibold text-neutral-500">
        {ui('Currency code')}
        <input
          id={`block-product-currency-${block.id}`}
          name="currency"
          value={advanced.currency || ''}
          onChange={e => updateAdvanced('currency', e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))}
          maxLength={3}
          placeholder={ui('e.g. USD')}
          className="mt-1 w-full uppercase tracking-caps rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
        />
      </label>
      <p className="text-xs font-normal text-neutral-500 sm:col-span-2">
        {ui('Display-only price. RALOA does not process checkout, inventory, taxes, or payments.')}
      </p>
    </div>
  );
};
