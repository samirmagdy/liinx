import React from 'react';
import { type LinkBlock } from '../../../../../types';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useBuilder } from '../../../context/BuilderContext';
import { LinkScheduleFields } from './LinkScheduleFields';

interface LinkFieldsProps {
  block: LinkBlock;
}

export const LinkFields: React.FC<LinkFieldsProps> = ({ block }) => {
  const { tr: ui } = useUiLanguage();
  const { handleUpdateBlockField, handleUpdateBlockExtra } = useBuilder();

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        <div>
          <label htmlFor={`block-subtitle-${block.id}`} className="block text-xs font-semibold text-neutral-500 mb-1">{ui("Subtitle Note")}</label>
          <input
            id={`block-subtitle-${block.id}`}
            name="blockSubtitle"
            aria-label={ui("Subtitle Note")}
            type="text"
            value={block.subtitle || ''}
            onChange={(e) => handleUpdateBlockField(block.id, 'subtitle', e.target.value)}
            placeholder={ui("Supporting text...")}
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
          />
        </div>
        <div>
          <label htmlFor={`block-icon-${block.id}`} className="block text-xs font-semibold text-neutral-500 mb-1">{ui("Icon or emoji")}</label>
          <input
            id={`block-icon-${block.id}`}
            name="blockIcon"
            aria-label={ui("Icon or emoji")}
            type="text"
            value={block.icon || ''}
            onChange={(e) => handleUpdateBlockField(block.id, 'icon', e.target.value || null)}
            placeholder={ui("Optional")}
            maxLength={50}
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
          />
        </div>
        <div>
          <label htmlFor={`block-badge-${block.id}`} className="block text-xs font-semibold text-neutral-500 mb-1">{ui("Badge Tag")}</label>
          <input
            id={`block-badge-${block.id}`}
            name="blockBadge"
            aria-label={ui("Badge Tag")}
            type="text"
            value={block.badge || ''}
            onChange={(e) => handleUpdateBlockField(block.id, 'badge', e.target.value)}
            placeholder={ui("e.g. NEW, SALE, LISTEN")}
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-neutral-100 text-xs">
        <label className="text-xs font-semibold text-neutral-600">
          {ui('Link layout')}
          <select
            id={`block-layout-${block.id}`}
            name="blockLayout"
            value={block.layout || 'list'}
            onChange={e => handleUpdateBlockExtra(block.id, { layout: e.target.value })}
            className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-900"
          >
            <option value="list">{ui('List')}</option>
            <option value="grid">{ui('Grid card')}</option>
            <option value="featured">{ui('Featured')}</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-neutral-600">
          {ui('Link animation')}
          <select
            id={`block-animation-${block.id}`}
            name="blockAnimation"
            value={block.animation || 'none'}
            onChange={e => handleUpdateBlockExtra(block.id, { animation: e.target.value })}
            className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-900"
          >
            <option value="none">{ui('None')}</option>
            <option value="fade">{ui('Fade in')}</option>
            <option value="lift">{ui('Lift on hover')}</option>
            <option value="pulse">{ui('Subtle pulse')}</option>
          </select>
        </label>
      </div>

      <LinkScheduleFields block={block} />
    </>
  );
};
