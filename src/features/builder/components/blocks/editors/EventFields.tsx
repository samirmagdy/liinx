import React from 'react';
import { type ProfileBlock } from '../../../../../types';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useAdvancedFields } from './useAdvancedFields';

interface EventFieldsProps {
  block: ProfileBlock;
}

export const EventFields: React.FC<EventFieldsProps> = ({ block }) => {
  const { tr: ui } = useUiLanguage();
  const { advanced, updateAdvanced } = useAdvancedFields(block);

  return (
    <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2">
      <label className="block text-xs font-semibold text-neutral-500">
        {ui('Event description')}
        <textarea
          id={`block-event-desc-${block.id}`}
          name="eventDescription"
          value={advanced.description || ''}
          onChange={e => updateAdvanced('description', e.target.value)}
          maxLength={1000}
          className="mt-1 min-h-20 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
        />
      </label>
      <label className="block text-xs font-semibold text-neutral-500">
        {ui('Artwork URL')}
        <input
          id={`block-event-artwork-${block.id}`}
          name="artworkUrl"
          value={advanced.artworkUrl || ''}
          onChange={e => updateAdvanced('artworkUrl', e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
        />
      </label>
      <label className="block text-xs font-semibold text-neutral-500">
        {ui('Date')}
        <input
          id={`block-event-date-${block.id}`}
          name="eventDate"
          value={advanced.date || ''}
          onChange={e => updateAdvanced('date', e.target.value)}
          maxLength={100}
          placeholder={ui('e.g. 12 October 2026')}
          className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
        />
      </label>
      <label className="block text-xs font-semibold text-neutral-500">
        {ui('Time')}
        <input
          id={`block-event-time-${block.id}`}
          name="eventTime"
          value={advanced.time || ''}
          onChange={e => updateAdvanced('time', e.target.value)}
          maxLength={50}
          placeholder={ui('e.g. 7:00 PM')}
          className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
        />
      </label>
      <label className="block text-xs font-semibold text-neutral-500">
        {ui('Timezone')}
        <input
          id={`block-event-timezone-${block.id}`}
          name="eventTimezone"
          value={advanced.timezone || ''}
          onChange={e => updateAdvanced('timezone', e.target.value)}
          maxLength={80}
          placeholder={ui('e.g. AST or UTC+3')}
          className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
        />
      </label>
      <label className="block text-xs font-semibold text-neutral-500">
        {ui('Location')}
        <input
          id={`block-event-location-${block.id}`}
          name="eventLocation"
          value={advanced.location || ''}
          onChange={e => updateAdvanced('location', e.target.value)}
          maxLength={300}
          className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
        />
      </label>
      <p className="text-xs font-normal text-neutral-500 sm:col-span-2">
        {ui('Date and time are displayed exactly as entered. Include the event timezone; RALOA does not convert times for visitors.')}
      </p>
    </div>
  );
};
