import React from 'react';
import { type ProfileBlock } from '../../../../../types';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useAdvancedFields } from './useAdvancedFields';

interface ContactTargetFieldProps {
  block: ProfileBlock;
}

export const ContactTargetField: React.FC<ContactTargetFieldProps> = ({ block }) => {
  const { tr: ui } = useUiLanguage();
  const { advanced, updateAdvanced } = useAdvancedFields(block);

  if (advanced.contactType === 'email') {
    return (
      <label className="block text-xs font-semibold text-neutral-500">
        {ui('Email address')}
        <input
          id={`block-contact-email-${block.id}`}
          name="contactEmail"
          value={advanced.email || ''}
          onChange={e => updateAdvanced('email', e.target.value)}
          type="email"
          autoComplete="email"
          dir="ltr"
          placeholder="hello@example.com"
          className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
        />
      </label>
    );
  }

  return (
    <label className="block text-xs font-semibold text-neutral-500">
      {ui('Phone number')}
      <input
        id={`block-contact-phone-${block.id}`}
        name="contactPhone"
        value={advanced.phone || ''}
        onChange={e => updateAdvanced('phone', e.target.value)}
        dir="ltr"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+966 50 123 4567"
        className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
      />
      <span className="mt-1 block text-xs font-normal text-neutral-500">
        {ui('Include country code; spaces, parentheses, and hyphens are allowed.')}
      </span>
    </label>
  );
};
