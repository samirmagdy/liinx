import React, { useState } from 'react';
import { Check, Layers, Replace, Sparkles } from 'lucide-react';
import { Modal } from '../../../../components/Modal';
import { PhonePreview } from '../../../../components/PhonePreview';
import { THEMES } from '../../../../config/themes';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { HOME_PAGE_SLUG, starterSitePages, starterSitePreview } from '../../../../utils/starterSites';
import type { CreatorProfile, SiteTemplate } from '../../../../../shared/index.js';

interface StarterSitePaneProps {
  starterSite: SiteTemplate;
  profile: CreatorProfile;
}

/** The pages a starter site will create, shown through the same renderer the live page uses. */
const StarterSitePreviewPane: React.FC<StarterSitePaneProps> = ({ starterSite, profile }) => {
  const { tr: ui } = useUiLanguage();
  const [pageSlug, setPageSlug] = useState(HOME_PAGE_SLUG);
  const homeTitle = profile.pages?.find(page => page.isHome)?.title || profile.displayName || ui('Add your name');
  const templatePages = starterSitePages(starterSite, homeTitle);
  const slug = templatePages.some(page => page.slug === pageSlug) ? pageSlug : templatePages[0].slug;
  const preview = starterSitePreview(starterSite, {
    pageSlug: slug,
    homeTitle,
    bio: profile.bio,
    username: profile.username,
    displayName: profile.displayName || undefined,
    socials: profile.socials
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {templatePages.map(page => (
          <button
            key={page.slug}
            type="button"
            onClick={() => setPageSlug(page.slug)}
            aria-pressed={page.slug === slug}
            className={`min-h-11 rounded-xl border px-3 py-1.5 text-xs font-semibold ${page.slug === slug ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100'}`}
          >
            {page.title}
          </button>
        ))}
      </div>

      <div className="max-h-[42vh] overflow-y-auto rounded-2xl bg-neutral-100 p-3">
        <PhonePreview profile={preview} compact interactive={false} />
      </div>

      <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
        <Layers className="h-3.5 w-3.5" aria-hidden />
        {`${starterSite.blocks.length} ${ui('blocks')} · ${templatePages.length} ${ui('pages')}`}
      </p>
    </>
  );
};

interface StarterSiteDialogProps {
  starterSite: SiteTemplate;
  profile: CreatorProfile;
  error: string | null;
  busy: boolean;
  onApply: (mode: 'append' | 'replace') => void;
  onDismiss: () => void;
}

export const StarterSiteDialog: React.FC<StarterSiteDialogProps> = ({
  starterSite,
  profile,
  error,
  busy,
  onApply,
  onDismiss,
}) => {
  const { tr: ui } = useUiLanguage();
  const [replaceArmed, setReplaceArmed] = useState(false);
  const themeName = THEMES.find(theme => theme.id === starterSite.themeId)?.name || starterSite.themeId;

  return (
    <Modal open onClose={onDismiss} label={ui('Starter site preview')} wide>
      <div className="space-y-4 bg-white p-6 text-neutral-900">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-700">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {ui('Starter site')}
          </div>
          <h2 className="mt-2 text-lg font-bold">{starterSite.name}</h2>
          <p className="mt-1 text-sm text-neutral-600">{starterSite.description}</p>
        </div>

        <StarterSitePreviewPane starterSite={starterSite} profile={profile} />

        <p className="text-sm text-neutral-600">
          {ui('Your theme changes to')} {themeName}. {replaceArmed
            ? ui('Replace deletes your other pages and all of their blocks. Your profile details and social links stay.')
            : ui('Adding keeps your existing pages and blocks. These pages are added below what you already have.')}
        </p>

        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onDismiss} className="min-h-11 rounded-xl border border-neutral-300 px-4 py-2 text-xs font-semibold">
            {ui('Cancel')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (replaceArmed) {
                setReplaceArmed(false);
                onApply('replace');
                return;
              }
              setReplaceArmed(true);
            }}
            className={`min-h-11 rounded-xl border px-4 py-2 text-xs font-bold transition-colors disabled:opacity-50 ${replaceArmed ? 'border-rose-600 bg-rose-600 text-white' : 'border-rose-300 text-rose-700 hover:bg-rose-50'}`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Replace className="h-3.5 w-3.5" aria-hidden />
              {replaceArmed ? ui('Tap again to replace everything') : ui('Replace my content')}
            </span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setReplaceArmed(false);
              onApply('append');
            }}
            className="min-h-11 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" aria-hidden />
              {busy ? ui('Adding...') : ui('Add to my page')}
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
