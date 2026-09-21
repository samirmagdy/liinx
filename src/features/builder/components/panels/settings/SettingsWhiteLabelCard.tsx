import React from 'react';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useBuilder } from '../../../context/BuilderContext';
import { api } from '../../../../../services/api';
import { SettingsCard } from './SettingsCard';
import { UpgradeGate } from './UpgradeGate';
import { planUnlocks } from '../../../config/studioNavigation';

/** Whether the public page carries any RALOA branding. Persisted straight away. */
export const SettingsWhiteLabelCard: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { profile, setProfile } = useBuilder();
  const unlocked = planUnlocks(profile.plan, 'white-label');

  const toggle = async () => {
    const next = !profile.hideBranding;
    setProfile(prev => ({ ...prev, hideBranding: next }));
    try {
      await api.studio.updateProfile({ hideBranding: next });
    } catch (err) {
      console.error('Failed to update white label setting', err);
      setProfile(prev => ({ ...prev, hideBranding: !next }));
    }
  };

  return (
    <SettingsCard title={ui('White-label branding')} detail={ui('Remove the "Made with RALOA" badge from your public page.')}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-neutral-600">
          {unlocked
            ? ui('Your page shows no RALOA branding while this stays off.')
            : ui('Branding stays on the free plan. Upgrade to hide it.')}
        </p>
        {unlocked ? (
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(profile.hideBranding)}
            aria-label={ui('Hide RALOA branding')}
            onClick={() => void toggle()}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              profile.hideBranding ? 'bg-emerald-600' : 'bg-neutral-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-neutral-50 shadow-lg ring-0 transition duration-200 ${
                profile.hideBranding ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        ) : (
          <UpgradeGate capability="white-label" />
        )}
      </div>
    </SettingsCard>
  );
};
