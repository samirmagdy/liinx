import React, { useState } from 'react';
import { THEMES } from '../config/themes';
import { type SiteTemplate } from '../../shared/index.js';
import { ArrowRight, Maximize2 } from 'lucide-react';
import { PhonePreview } from './PhonePreview';
import { TemplatePreviewDialog } from './TemplatePreviewDialog';
import { starterSitePreview } from '../utils/starterSites';
import { useLanguage as useUiLanguage } from '../context/LanguageContext';

const TEMPLATE_IMAGES: Record<string, string> = {
  'Design & Art': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=500&auto=format&fit=crop',
  Musicians: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=500&auto=format&fit=crop',
  Brands: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?q=80&w=500&auto=format&fit=crop',
  Creators: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=500&auto=format&fit=crop',
  Wellness: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=500&auto=format&fit=crop',
  Podcasts: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=500&auto=format&fit=crop',
  Travel: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?q=80&w=500&auto=format&fit=crop',
  Food: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=500&auto=format&fit=crop',
  Personal: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=500&auto=format&fit=crop'
};

interface TemplateCardProps {
  template: SiteTemplate;
  loc: { name: string; category: string; description: string };
  isHydrated: boolean;
  isRtl: boolean;
  useTemplateLabel: string;
  onSelectTemplate: (templateId: string) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  loc,
  isHydrated,
  isRtl,
  useTemplateLabel,
  onSelectTemplate
}) => {
  const { tr: ui } = useUiLanguage();
  const [previewing, setPreviewing] = useState(false);
  const theme = THEMES.find(item => item.id === template.themeId);
  const pageCount = 1 + (template.pages || []).length;

  return (
    <div
      className="motion-card rounded-3xl border border-neutral-200 bg-neutral-50 overflow-hidden flex flex-col justify-between hover:border-neutral-400 focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-900/10"
    >
      <div className="template-card-preview relative h-[300px] overflow-hidden border-b" aria-label={ui('Starter site preview')}>
        <span className="template-preview-badge absolute top-3 start-3 z-10 rounded-full border border-white/70 bg-white/90 backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-neutral-800 shadow-sm">
          {ui('Starter site preview')}
        </span>
        <img
          className="template-card-image absolute inset-0 h-full w-full object-cover"
          src={TEMPLATE_IMAGES[template.category] || TEMPLATE_IMAGES.Creators}
          alt=""
          loading="lazy"
          decoding="async"
        />
        <div className="template-card-image-wash absolute inset-0" aria-hidden="true" />
        {isHydrated ? (
          <div className="template-preview-render absolute top-4 left-1/2 w-[360px] -translate-x-1/2 origin-top scale-75 pointer-events-none" aria-hidden="true" inert>
            <PhonePreview profile={starterSitePreview(template)} compact interactive={false} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-6 text-center" style={{ backgroundColor: theme?.bgColor }}>
            <div>
              <div className="w-14 h-14 rounded-full bg-neutral-900/10 mx-auto mb-3" />
              <p className="text-sm font-bold text-neutral-900">{loc.name}</p>
              <p className="text-xs text-neutral-600 mt-1">{isRtl ? 'معاينة القالب' : 'Template preview'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Template Body */}
      <div className="template-card-body p-6 flex flex-col flex-1 justify-between text-start">
        <div>
          <h3 className="font-brand font-bold text-base text-neutral-900 mb-1 text-balance">
            {loc.name}
          </h3>
          <p className="text-xs text-neutral-600 leading-relaxed mb-3 text-pretty">
            {loc.description}
          </p>
          <p className="text-xs font-semibold text-neutral-500">
            {pageCount} {ui('pages')} · {template.blocks.length} {ui('blocks')}
          </p>
        </div>

        <div className="template-card-actions flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewing(true)}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-neutral-300 px-3.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{ui('Preview')}</span>
          </button>
          <button
            onClick={() => onSelectTemplate(template.id)}
            className="flex-1 py-2.5 px-4 rounded-full bg-neutral-950 border border-neutral-600 hover:border-neutral-500 text-xs font-bold text-neutral-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <span>{useTemplateLabel}</span>
            <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {previewing && (
        <TemplatePreviewDialog
          template={template}
          loc={loc}
          useLabel={useTemplateLabel}
          isRtl={isRtl}
          onClose={() => setPreviewing(false)}
          onUse={() => { setPreviewing(false); onSelectTemplate(template.id); }}
        />
      )}
    </div>
  );
};
