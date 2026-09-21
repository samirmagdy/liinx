import React from 'react';
import { Globe2 } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useBuilder } from '../../../context/BuilderContext';
import { planUnlocks } from '../../../config/studioNavigation';
import { UpgradeGate } from './UpgradeGate';
import { DomainWizard } from './DomainWizard';

/** The custom-domain card: one address, the record that proves it, and what DNS actually said. */
export const SettingsDomainCard: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { profile } = useBuilder();
  const canUseDomain = planUnlocks(profile.plan, 'custom-domain');

  return (
    <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-neutral-900">{ui('Custom Domain')}</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {ui('Serve your site from an address you own instead of the default RALOA link.')}
            </p>
          </div>
        </div>
        {!canUseDomain && <UpgradeGate capability="custom-domain" />}
      </div>

      {canUseDomain ? (
        <DomainWizard />
      ) : (
        <p className="text-xs leading-relaxed text-neutral-600">
          {ui('Upgrade to Pro or Studio to connect your own domain.')}
        </p>
      )}
    </div>
  );
};
