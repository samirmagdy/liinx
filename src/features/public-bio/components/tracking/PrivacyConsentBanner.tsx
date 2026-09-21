import React from 'react';
import { type CreatorProfile } from '../../../../types';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';

interface PrivacyConsentBannerProps {
  profile: CreatorProfile | null;
  analyticsConsent: 'granted' | 'denied' | null;
  previewOnly?: boolean;
  onConsentChange: (value: 'granted' | 'denied') => void;
}

export const PrivacyConsentBanner: React.FC<PrivacyConsentBannerProps> = ({
  profile,
  analyticsConsent,
  previewOnly = false,
  onConsentChange
}) => {
  const { tr: ui } = useUiLanguage();

  if (previewOnly || analyticsConsent !== null || !profile || (!profile.gaMeasurementId && !profile.metaPixelId)) {
    return null;
  }

  return (
    <aside
      className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-lg rounded-2xl border border-neutral-200 bg-white p-4 text-neutral-900 shadow-2xl"
      role="dialog"
      aria-label={ui('Privacy controls')}
    >
      <p className="text-xs leading-relaxed text-neutral-600" dir="auto">
        {ui('This page uses optional analytics and advertising pixels configured by the creator. Choose whether to allow them.')}
      </p>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => onConsentChange('denied')}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-900/30"
        >
          {ui('Reject optional analytics')}
        </button>
        <button
          type="button"
          onClick={() => onConsentChange('granted')}
          className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:bg-black focus-visible:ring-2 focus-visible:ring-neutral-900/30"
        >
          {ui('Allow optional analytics')}
        </button>
      </div>
    </aside>
  );
};
