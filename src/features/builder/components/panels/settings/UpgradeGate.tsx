import React from 'react';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useBuilder } from '../../../context/BuilderContext';
import { minimumPlanFor, planUnlocks } from '../../../config/studioNavigation';
import { paidPlans, type SubscriptionPlan } from '../../../../../../shared/config/plans';
import { type UpgradeCapability } from '../../../types/builder.types';

export const PLAN_WORDS: Record<SubscriptionPlan, string> = { free: 'Free', pro: 'Pro', studio: 'Studio' };

/**
 * The badge a locked control used to wear. It used to be text nobody could act on; now it
 * is the affordance that opens the dialog explaining the specific capability and its price.
 */
export const UpgradeGate: React.FC<{ capability: UpgradeCapability }> = ({ capability }) => {
  const { tr: ui } = useUiLanguage();
  const { requestUpgrade, profile } = useBuilder();
  const plan = minimumPlanFor(capability);

  if (planUnlocks(profile.plan, capability)) {
    return (
      <span className="whitespace-nowrap text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-md">
        {ui('ACTIVE')}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => requestUpgrade(capability)}
      className="whitespace-nowrap rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-mono font-bold text-amber-800 transition-colors hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
    >
      {`${ui('Needs')} ${PLAN_WORDS[plan]}`}
    </button>
  );
};

/** Real monthly price of the plan that unlocks the capability, from the shared plan table. */
export const planPriceLabel = (plan: SubscriptionPlan): string =>
  plan === 'free' ? '' : `$${paidPlans[plan].month / 100}/mo`;
