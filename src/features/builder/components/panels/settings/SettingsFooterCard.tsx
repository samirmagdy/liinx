import React from 'react';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useBuilder } from '../../../context/BuilderContext';
import { SettingsCard } from './SettingsCard';
import { SavePageSettingsButton } from './SavePageSettingsButton';
import { UpgradeGate } from './UpgradeGate';
import { planUnlocks } from '../../../config/studioNavigation';

/** The logo shown at the foot of the public page, and where it links. */
export const SettingsFooterCard: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    profile,
    footerLogoUrlInput,
    setFooterLogoUrlInput,
    footerLogoLinkInput,
    setFooterLogoLinkInput,
    footerLogoAltInput,
    setFooterLogoAltInput,
    pageSettingsFeedback
  } = useBuilder();
  const unlocked = planUnlocks(profile.plan, 'footer-branding');

  return (
    <SettingsCard
      title={ui('Footer logo')}
      detail={ui('Your own logo at the foot of the page, with the address it points to.')}
      actions={<UpgradeGate capability="footer-branding" />}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label htmlFor="settings-footer-logo-url" className="text-xs font-semibold text-neutral-800">
          {ui('Footer logo URL')}
          <input
            id="settings-footer-logo-url"
            name="footerLogoUrl"
            type="url"
            dir="ltr"
            disabled={!unlocked}
            value={footerLogoUrlInput}
            onChange={e => setFooterLogoUrlInput(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900 disabled:opacity-50"
            placeholder="https://..."
          />
        </label>
        <label htmlFor="settings-footer-logo-destination" className="text-xs font-semibold text-neutral-800">
          {ui('Footer logo destination')}
          <input
            id="settings-footer-logo-destination"
            name="footerLogoDestination"
            type="url"
            dir="ltr"
            disabled={!unlocked}
            value={footerLogoLinkInput}
            onChange={e => setFooterLogoLinkInput(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900 disabled:opacity-50"
            placeholder="https://..."
          />
        </label>
        <label htmlFor="settings-footer-logo-alt" className="text-xs font-semibold text-neutral-800 sm:col-span-2">
          {ui('Footer logo accessible name')}
          <input
            id="settings-footer-logo-alt"
            name="footerLogoAlt"
            type="text"
            dir="auto"
            disabled={!unlocked}
            value={footerLogoAltInput}
            onChange={e => setFooterLogoAltInput(e.target.value)}
            maxLength={120}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900 disabled:opacity-50"
            placeholder={profile.displayName}
          />
        </label>
      </div>
      {unlocked
        ? <SavePageSettingsButton feedback={pageSettingsFeedback} />
        : <p className="text-xs text-neutral-500">{ui('Footer branding needs a paid plan.')}</p>}
    </SettingsCard>
  );
};
