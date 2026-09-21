import React from 'react';
import { CheckCircle2, SquareDashed } from 'lucide-react';
import { type SiteTemplate } from '../../../../shared/index.js';
import { THEMES } from '../../../config/themes';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { PhonePreview } from '../../../components/PhonePreview';
import { STARTER_SITE_NAME_PLACEHOLDER, starterSitePreview } from '../../../utils/starterSites';

interface StarterSiteChoicesProps {
  templates: SiteTemplate[];
  /** Localized display names, keyed by catalogue id. */
  names: Record<string, string>;
  selectedId: string | null;
  onSelect: (templateId: string | null) => void;
  isHydrated: boolean;
}

const CARD_WIDTH = 'w-[176px] shrink-0 snap-start';

const cardClass = (selected: boolean) => `overflow-hidden rounded-2xl border bg-white transition-all ${
  selected ? 'border-neutral-900 ring-2 ring-neutral-900 shadow-xs' : 'border-neutral-200 hover:border-neutral-300'
}`;

const themeOf = (template: SiteTemplate) => THEMES.find(item => item.id === template.themeId);

/**
 * The composition a creator is about to get, drawn by the same preview the studio dialog uses. The
 * phone subtree is inert and hidden from assistive tech: it is a picture of the result, and the
 * control underneath it carries the name.
 */
const SitePreviewFrame: React.FC<{ template: SiteTemplate }> = ({ template }) => {
  const { tr: ui } = useUiLanguage();
  return (
    <div className="relative h-[212px] overflow-hidden bg-neutral-100" aria-hidden="true" inert>
      <div className="pointer-events-none absolute inset-x-0 top-0 w-[300px] origin-top-left scale-[0.55]">
        <PhonePreview
          profile={starterSitePreview(template, { displayName: ui(STARTER_SITE_NAME_PLACEHOLDER) })}
          compact
          interactive={false}
        />
      </div>
      <span className="pointer-events-none absolute bottom-2 end-2 z-10 rounded-full bg-white/90 px-1.5 py-0.5 text-[11px] font-bold text-neutral-800">
        {themeOf(template)?.name}
      </span>
    </div>
  );
};

const ChoiceButton: React.FC<{
  label: string;
  detail: string;
  selected: boolean;
  onSelect: () => void;
}> = ({ label, detail, selected, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={selected}
    className="flex w-full items-start gap-1.5 px-2 py-2.5 text-start cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
  >
    <span className="flex-1">
      <span className="block text-xs font-bold leading-tight text-neutral-900">{label}</span>
      <span className="mt-0.5 block text-[11px] font-semibold leading-tight text-neutral-500">{detail}</span>
    </span>
    {selected && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />}
  </button>
);

export const StarterSiteChoices: React.FC<StarterSiteChoicesProps> = ({
  templates,
  names,
  selectedId,
  onSelect,
  isHydrated
}) => {
  const { tr: ui } = useUiLanguage();
  const isEmptySelected = selectedId === null;

  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1">
      <div className={`${CARD_WIDTH} ${cardClass(isEmptySelected)}`}>
        <div className="flex h-[212px] flex-col items-center justify-center gap-2 bg-neutral-50 px-3 text-center" aria-hidden="true">
          <SquareDashed className="h-5 w-5 text-neutral-400" />
          <span className="text-[11px] font-semibold leading-snug text-neutral-500">
            {ui('No starter blocks. You add every link yourself.')}
          </span>
        </div>
        <ChoiceButton
          label={ui('Start with an empty page')}
          detail={ui('Default theme, nothing filled in')}
          selected={isEmptySelected}
          onSelect={() => onSelect(null)}
        />
      </div>

      {templates.map(template => (
        <div key={template.id} className={`${CARD_WIDTH} ${cardClass(selectedId === template.id)}`}>
          {isHydrated ? (
            <SitePreviewFrame template={template} />
          ) : (
            <div className="h-[212px]" style={{ backgroundColor: themeOf(template)?.bgColor }} aria-hidden="true" />
          )}
          <ChoiceButton
            label={names[template.id] || template.name}
            detail={`${1 + (template.pages || []).length} ${ui('pages')} · ${template.blocks.length} ${ui('blocks')}`}
            selected={selectedId === template.id}
            onSelect={() => onSelect(template.id)}
          />
        </div>
      ))}
    </div>
  );
};
