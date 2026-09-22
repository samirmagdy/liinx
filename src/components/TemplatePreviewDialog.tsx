import React, { useState } from 'react';
import { ArrowRight, Layers, X } from 'lucide-react';
import { Modal } from './Modal';
import { PhonePreview } from './PhonePreview';
import { useLanguage as useUiLanguage } from '../context/LanguageContext';
import { HOME_PAGE_SLUG, starterSiteBlocks, starterSitePages, starterSitePreview } from '../utils/starterSites';
import { type SiteTemplate } from '../../shared/index.js';

interface TemplatePreviewDialogProps {
  template: SiteTemplate;
  loc: { name: string; category: string; description: string };
  useLabel: string;
  isRtl: boolean;
  onClose: () => void;
  onUse: () => void;
}

/**
 * The card thumbnail is a scaled picture; this is the same composition at full size with the
 * page tabs live. It needs no account, because a visitor decides with their eyes first.
 */
export const TemplatePreviewDialog: React.FC<TemplatePreviewDialogProps> = ({
  template,
  loc,
  useLabel,
  isRtl,
  onClose,
  onUse
}) => {
  const { tr: ui } = useUiLanguage();
  const [pageSlug, setPageSlug] = useState(HOME_PAGE_SLUG);
  const pages = starterSitePages(template, ui('Add your name'));
  const active = pages.some(page => page.slug === pageSlug) ? pageSlug : pages[0].slug;
  const preview = starterSitePreview(template, { pageSlug: active, homeTitle: pages[0].title });
  const blockCount = starterSiteBlocks(template, active).length;

  return (
    <Modal open onClose={onClose} label={`${ui('Full-screen preview')}: ${loc.name}`} wide>
      <div className="space-y-4 bg-white p-5 text-neutral-900 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-balance">{loc.name}</h2>
            <p className="mt-1 text-sm text-neutral-600 text-pretty">{loc.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={ui('Close preview')}
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-full border border-neutral-300 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {pages.map(page => (
            <button
              key={page.slug}
              type="button"
              onClick={() => setPageSlug(page.slug)}
              aria-pressed={page.slug === active}
              className={`min-h-11 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                page.slug === active
                  ? 'border-neutral-900 bg-neutral-100 font-bold text-neutral-900'
                  : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {page.title}
            </button>
          ))}
        </div>

        <div className="max-h-[46vh] overflow-y-auto rounded-2xl bg-neutral-100 p-3">
          {/* Interactive, but incapable of writing: the phone preview only notices newsletter
              intent, and /api/forms/submit needs a stored block on a real profile. */}
          <PhonePreview profile={preview} compact interactive />
        </div>

        <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
          <Layers className="h-3.5 w-3.5" aria-hidden="true" />
          {`${blockCount} ${ui('blocks')} · ${pages.length} ${ui('pages')}`}
        </p>

        <button
          type="button"
          onClick={onUse}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-bold text-white transition-colors hover:bg-black"
        >
          <span>{useLabel}</span>
          <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        <p className="text-center text-xs text-neutral-500">
          {ui('Nothing is created yet — this opens the sign-up with this page already chosen.')}
        </p>
      </div>
    </Modal>
  );
};
