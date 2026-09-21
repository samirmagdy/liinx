import React from 'react';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useBuilder } from '../../../context/BuilderContext';
import { IntegrationsPanel } from '../IntegrationsPanel';
import { SettingsCard } from './SettingsCard';
import { UpgradeGate } from './UpgradeGate';
import { planUnlocks } from '../../../config/studioNavigation';

/** Third parties the creator's own tools feed: measurement pixels, the API, Instagram. */
export const SettingsIntegrationsSection: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    profile,
    gaInput,
    setGaInput,
    metaPixelInput,
    setMetaPixelInput,
    isSavingPixels,
    pixelsSavedFeedback,
    pixelsError,
    handleSavePixels
  } = useBuilder();
  const paid = planUnlocks(profile.plan, 'tracking-pixels');

  return (
    <div className="space-y-6">
      <SettingsCard
        title={ui('Analytics and retargeting pixels')}
        detail={ui('Connect a Google Analytics 4 measurement ID and a Meta Pixel to your published page.')}
        actions={<UpgradeGate capability="tracking-pixels" />}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label htmlFor="settings-ga-id" className="text-xs font-semibold text-neutral-800">
            {ui('Google Analytics 4 Measurement ID')}
            <input
              id="settings-ga-id"
              name="googleAnalyticsId"
              dir="ltr"
              disabled={!paid}
              value={gaInput}
              onChange={e => setGaInput(e.target.value)}
              placeholder={ui('G-XXXXXXXXXX')}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 font-mono text-xs font-normal text-neutral-900"
            />
            <span className="mt-1 block text-xs font-normal text-neutral-600">
              {ui('Found in GA4 Admin > Data Streams > Measurement ID')}
            </span>
          </label>
          <label htmlFor="settings-meta-pixel-id" className="text-xs font-semibold text-neutral-800">
            {ui('Meta (Facebook) Pixel ID')}
            <input
              id="settings-meta-pixel-id"
              name="metaPixelId"
              dir="ltr"
              disabled={!paid}
              value={metaPixelInput}
              onChange={e => setMetaPixelInput(e.target.value)}
              placeholder={ui('e.g. 123456789012345')}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 font-mono text-xs font-normal text-neutral-900"
            />
            <span className="mt-1 block text-xs font-normal text-neutral-600">
              {ui('Found in Meta Events Manager > Data Sources')}
            </span>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium">
            {pixelsSavedFeedback && <span className="text-emerald-600">{ui('✓ Pixel settings saved!')}</span>}
            {pixelsError && <span role="alert" className="text-rose-600">{pixelsError}</span>}
          </span>
          <button
            type="button"
            disabled={isSavingPixels || !paid}
            onClick={handleSavePixels}
            className="min-h-11 rounded-xl bg-neutral-900 px-4 text-xs font-bold text-white transition-colors hover:bg-black disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {isSavingPixels ? ui('Saving...') : ui('Save Tracking IDs')}
          </button>
        </div>
      </SettingsCard>

      <IntegrationsPanel />
    </div>
  );
};
