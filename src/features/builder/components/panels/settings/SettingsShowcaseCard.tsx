import React, { useState } from 'react';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useBuilder } from '../../../context/BuilderContext';
import { api } from '../../../../../services/api';
import { SettingsCard } from './SettingsCard';

/**
 * Whether this page may appear in the public made-with-RALOA gallery. The answer lives on the
 * profile row, so withdrawing it takes the page out of the gallery on the next request.
 */
export const SettingsShowcaseCard: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { profile, setProfile } = useBuilder();
  const [saving, setSaving] = useState(false);
  const optedIn = Boolean(profile.showcaseOptIn);

  const toggle = async () => {
    const next = !optedIn;
    setProfile(prev => ({ ...prev, showcaseOptIn: next }));
    setSaving(true);
    try {
      const saved = await api.studio.setShowcaseOptIn(next);
      setProfile(prev => ({ ...prev, showcaseOptIn: saved.showcaseOptIn }));
    } catch (err) {
      console.error('Failed to save gallery consent', err);
      setProfile(prev => ({ ...prev, showcaseOptIn: !next }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsCard
      title={ui('Made-with-RALOA gallery')}
      detail={ui('Offer your published page to a public gallery of sites people made here.')}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-neutral-600 text-pretty">
          {optedIn
            ? ui('Your published page is eligible. Unpublishing it removes it from the gallery too.')
            : ui('Nothing is listed unless you turn this on, and only published pages qualify.')}
        </p>
        <button
          type="button"
          role="switch"
          aria-checked={optedIn}
          aria-label={ui('Show my page in the gallery')}
          disabled={saving}
          onClick={() => void toggle()}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            saving ? 'cursor-wait opacity-60' : 'cursor-pointer'
          } ${optedIn ? 'bg-emerald-600' : 'bg-neutral-200'}`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-neutral-50 shadow-lg ring-0 transition duration-200 ${
              optedIn ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </SettingsCard>
  );
};
