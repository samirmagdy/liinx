import React from 'react';
import { type ProfileBlock } from '../../../../../types';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useAdvancedFields } from './useAdvancedFields';
import { ContactTargetField } from './ContactTargetField';

interface PhoneFieldsProps {
  block: ProfileBlock;
}

export const PhoneFields: React.FC<PhoneFieldsProps> = ({ block }) => {
  const { tr: ui } = useUiLanguage();
  const { advanced, updateAdvanced } = useAdvancedFields(block);

  return (
    <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2">
      <label className="block text-xs font-semibold text-neutral-500">
        {ui('Contact action')}
        <select
          id={`block-contact-type-${block.id}`}
          name="contactType"
          value={advanced.contactType || 'phone'}
          onChange={e => updateAdvanced('contactType', e.target.value)}
          className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
        >
          <option value="phone">{ui('Click to call')}</option>
          <option value="email">{ui('Send email')}</option>
        </select>
      </label>
      <ContactTargetField block={block} />
      <label className="block text-xs font-semibold text-neutral-500">
        {ui('Availability')}
        <input
          id={`block-contact-avail-${block.id}`}
          name="contactAvailability"
          value={advanced.availability || ''}
          onChange={e => updateAdvanced('availability', e.target.value)}
          maxLength={200}
          placeholder={ui('Optional availability')}
          className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
        />
      </label>
      <label className="block text-xs font-semibold text-neutral-500">
        {ui('Contact description')}
        <textarea
          id={`block-contact-desc-${block.id}`}
          name="contactDescription"
          value={advanced.description || ''}
          onChange={e => updateAdvanced('description', e.target.value)}
          maxLength={1000}
          className="mt-1 min-h-16 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
        />
      </label>
      {advanced.contactType === 'email' && (
        <>
          <label className="block text-xs font-semibold text-neutral-500">
            {ui('Email subject')}
            <input
              id={`block-contact-subj-${block.id}`}
              name="contactSubject"
              value={advanced.subject || ''}
              onChange={e => updateAdvanced('subject', e.target.value)}
              maxLength={200}
              className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
            />
          </label>
          <label className="block text-xs font-semibold text-neutral-500">
            {ui('Email message')}
            <textarea
              id={`block-contact-body-${block.id}`}
              name="contactBody"
              value={advanced.body || ''}
              onChange={e => updateAdvanced('body', e.target.value)}
              maxLength={1000}
              className="mt-1 min-h-16 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
            />
          </label>
        </>
      )}
      <p className="text-xs font-normal text-neutral-500 sm:col-span-2">
        {ui('This is a creator-published contact action, not a form. Visitors are not asked to submit data to RALOA.')}
      </p>
    </div>
  );
};
