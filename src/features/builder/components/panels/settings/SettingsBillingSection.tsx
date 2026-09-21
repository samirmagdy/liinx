import React from 'react';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useBuilder } from '../../../context/BuilderContext';
import { paidPlans, PLAN_ENTITLEMENTS } from '../../../../../../shared/config/plans';
import { SettingsCard } from './SettingsCard';

const ENTITLEMENT_LABELS: { key: keyof (typeof PLAN_ENTITLEMENTS)['free']; label: string }[] = [
  { key: 'maxProfiles', label: 'Sites' },
  { key: 'customDomain', label: 'Custom domain' },
  { key: 'paidCustomization', label: 'Custom CSS, branding and pixels' },
  { key: 'scheduling', label: 'Scheduled blocks' },
  { key: 'apiAccess', label: 'REST API keys' }
];

const yesNo = (value: boolean | number, ui: (key: string) => string) =>
  typeof value === 'number' ? String(value) : value ? ui('yes') : ui('no');

/**
 * The editor is not a shop window. What used to be three side-by-side plan cards is one
 * row that states the plan you are on, what it actually includes, and how to change it.
 */
export const SettingsBillingSection: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { profile, handleUpgradePlan, billingError } = useBuilder();
  const plan = profile.plan && profile.plan !== 'free' ? profile.plan : 'free';
  const entitlements = PLAN_ENTITLEMENTS[plan];

  return (
    <SettingsCard title={ui('Plan')} detail={ui('What your account includes today.')}>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
        <p className="text-xs text-neutral-700">
          {ui('Current plan:')}{' '}
          <strong className="font-mono uppercase tracking-caps text-neutral-900">{plan}</strong>
        </p>
        {plan === 'free' ? (
          <div className="flex flex-wrap gap-2">
            {(['pro', 'studio'] as const).map(target => (
              <button
                key={target}
                type="button"
                onClick={() => void handleUpgradePlan(target)}
                className="min-h-11 rounded-xl border border-neutral-900 px-3 py-2 text-xs font-bold text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white"
              >
                {`${ui('Upgrade to')} ${ui(target === 'pro' ? 'Pro' : 'Studio')} · $${paidPlans[target].month / 100}/mo`}
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void handleUpgradePlan(plan)}
            className="min-h-11 rounded-xl border border-neutral-300 px-4 py-2 text-xs font-bold text-neutral-900 transition-colors hover:border-neutral-900"
          >
            {ui('Manage subscription')}
          </button>
        )}
      </div>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
        {ENTITLEMENT_LABELS.map(row => (
          <div key={row.key} className="flex items-center justify-between gap-3 border-b border-neutral-100 py-1.5">
            <dt className="text-neutral-600">{ui(row.label)}</dt>
            <dd className="font-mono text-neutral-900">{yesNo(entitlements[row.key], ui)}</dd>
          </div>
        ))}
      </dl>

      {billingError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {billingError}
        </p>
      )}
    </SettingsCard>
  );
};
