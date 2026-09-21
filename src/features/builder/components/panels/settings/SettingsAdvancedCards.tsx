import React from 'react';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useBuilder } from '../../../context/BuilderContext';
import { SettingsCard } from './SettingsCard';
import { SavePageSettingsButton } from './SavePageSettingsButton';
import { UpgradeGate } from './UpgradeGate';
import { planUnlocks } from '../../../config/studioNavigation';

/** Raw CSS and a Google Fonts import, both scoped and validated server-side. */
export const SettingsStylingCard: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    profile,
    customFontUrlInput,
    setCustomFontUrlInput,
    customCssInput,
    setCustomCssInput,
    isSavingStyling,
    stylingSavedFeedback,
    stylingError,
    handleSaveCustomStyling
  } = useBuilder();
  const unlocked = planUnlocks(profile.plan, 'custom-css');

  return (
    <SettingsCard
      title={ui('Custom CSS and webfonts')}
      detail={ui('Custom styles are limited to the public page; font stylesheets must use Google Fonts.')}
      actions={<UpgradeGate capability="custom-css" />}
    >
      <label htmlFor="settings-custom-font-url" className="block text-xs font-semibold text-neutral-800">
        {ui('Google Fonts / Webfont Stylesheet URL')}
        <input
          id="settings-custom-font-url"
          name="customFontUrl"
          type="url"
          dir="ltr"
          disabled={!unlocked}
          value={customFontUrlInput}
          onChange={e => setCustomFontUrlInput(e.target.value)}
          placeholder="https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap"
          className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 font-mono text-xs font-normal text-neutral-900 disabled:opacity-50"
        />
      </label>
      <p className="text-xs text-neutral-500">
        {ui('Unsupported imports, external URLs, and rules that can hide or cover controls are rejected.')}
      </p>

      <label htmlFor="settings-custom-css" className="block text-xs font-semibold text-neutral-800">
        {ui('Custom CSS Overrides')}
        <span className="ms-2 font-normal text-neutral-600">{ui('Scoped to #public-bio-view')}</span>
        <textarea
          id="settings-custom-css"
          name="customCss"
          dir="ltr"
          rows={4}
          disabled={!unlocked}
          value={customCssInput}
          onChange={e => setCustomCssInput(e.target.value)}
          placeholder={ui('/* Custom CSS overrides */\n#public-bio-view .custom-card { border-width: 2px; }')}
          className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-3 font-mono text-xs font-normal text-neutral-900 disabled:opacity-50"
        />
      </label>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium">
          {stylingSavedFeedback && <span className="text-emerald-600">{ui('✓ Custom styling saved!')}</span>}
          {stylingError && <span role="alert" className="text-rose-600">{stylingError}</span>}
        </span>
        <button
          type="button"
          disabled={isSavingStyling || !unlocked}
          onClick={handleSaveCustomStyling}
          className="min-h-11 rounded-xl bg-neutral-900 px-4 text-xs font-bold text-white transition-colors hover:bg-black disabled:opacity-50"
        >
          {isSavingStyling ? ui('Saving...') : ui('Save Custom CSS & Fonts')}
        </button>
      </div>
    </SettingsCard>
  );
};

/** Send visitors elsewhere for a while, with an expiry so it stops on its own. */
export const SettingsRedirectCard: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    pageRedirectUrlInput,
    setPageRedirectUrlInput,
    pageRedirectUntilInput,
    setPageRedirectUntilInput,
    pageSettingsFeedback
  } = useBuilder();

  return (
    <SettingsCard title={ui('Temporary redirect')} detail={ui('Send visitors somewhere else for a while, then stop automatically.')}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label htmlFor="settings-page-redirect-url" className="text-xs font-semibold text-neutral-800">
          {ui('Temporary page redirect')}
          <input
            id="settings-page-redirect-url"
            name="pageRedirectUrl"
            type="url"
            dir="ltr"
            value={pageRedirectUrlInput}
            onChange={e => setPageRedirectUrlInput(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900"
            placeholder="https://..."
          />
        </label>
        <label htmlFor="settings-page-redirect-until" className="text-xs font-semibold text-neutral-800">
          {ui('Redirect ends')}
          <input
            id="settings-page-redirect-until"
            name="pageRedirectUntil"
            type="datetime-local"
            dir="ltr"
            value={pageRedirectUntilInput}
            onChange={e => setPageRedirectUntilInput(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900"
          />
          <span className="mt-1 block text-xs font-normal text-neutral-500">
            {ui('Times use this browser timezone and are saved as UTC instants. The redirect expires at the selected time.')}
          </span>
        </label>
      </div>
      <SavePageSettingsButton feedback={pageSettingsFeedback} />
    </SettingsCard>
  );
};
