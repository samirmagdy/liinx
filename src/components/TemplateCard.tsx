import React from 'react';
import { THEMES } from '../config/themes';
import { type CreatorProfile, type TemplateItem } from '../types';
import { ArrowRight } from 'lucide-react';
import { PhonePreview } from './PhonePreview';

interface TemplateCardProps {
  template: TemplateItem;
  loc: { name: string; category: string; description: string };
  isHydrated: boolean;
  isRtl: boolean;
  useTemplateLabel: string;
  onSelectTemplate: (profile: CreatorProfile) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  loc,
  isHydrated,
  isRtl,
  useTemplateLabel,
  onSelectTemplate
}) => {
  return (
    <div
      className="motion-card rounded-3xl border border-neutral-200 bg-neutral-50 overflow-hidden flex flex-col justify-between hover:border-neutral-400 focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-900/10"
    >
      <div className="relative h-[300px] overflow-hidden border-b" aria-label={`${loc.name} illustrative template preview`}>
        <span className="absolute top-3 start-3 z-10 rounded-full border border-white/70 bg-white/90 backdrop-blur-xs px-2.5 py-1 text-[10px] font-semibold text-neutral-800 shadow-sm">
          {isRtl ? 'معاينة توضيحية' : 'Illustrative preview'}
        </span>
        {isHydrated ? (
          <div className="absolute top-4 left-1/2 w-[360px] -translate-x-1/2 origin-top scale-75 pointer-events-none" aria-hidden="true" inert>
            <PhonePreview profile={template.profile} customTheme={THEMES.find(theme => theme.id === template.profile.themeId)} compact interactive={false} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-6 text-center" style={{ backgroundColor: template.previewColor }}>
            <div>
              <div className="w-14 h-14 rounded-full bg-neutral-900/10 mx-auto mb-3" />
              <p className="text-sm font-bold text-neutral-900">{loc.name}</p>
              <p className="text-xs text-neutral-600 mt-1">{isRtl ? 'معاينة القالب' : 'Template preview'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Template Body */}
      <div className="p-6 flex flex-col flex-1 justify-between text-start">
        <div>
          <h3 className="font-brand font-bold text-base text-neutral-900 mb-1 text-balance">
            {loc.name}
          </h3>
          <p className="text-xs text-neutral-600 leading-relaxed mb-6 text-pretty">
            {loc.description}
          </p>
        </div>

        <button
          onClick={() => onSelectTemplate(template.profile)}
          className="w-full py-2.5 px-4 rounded-full bg-neutral-950 border border-neutral-600 hover:border-neutral-500 text-xs font-bold text-neutral-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
        >
          <span>{useTemplateLabel}</span>
          <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
};
