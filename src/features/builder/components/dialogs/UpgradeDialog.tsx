import React from 'react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';
import { Modal } from '../../../../components/Modal';
import { UPGRADE_COPY, minimumPlanFor } from '../../config/studioNavigation';
import { PLAN_WORDS, planPriceLabel } from '../panels/settings/UpgradeGate';

/**
 * The one place the product asks for money. It names the capability the creator just
 * reached for, the plan that carries it, and its real price, then hands off to the same
 * Stripe portal/checkout the Billing section uses. No "talk to sales", no dead buttons.
 */
export const UpgradeDialog: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { upgradeFor, closeUpgrade, handleUpgradePlan, billingError } = useBuilder();

  if (!upgradeFor) return null;
  const copy = UPGRADE_COPY[upgradeFor];
  const plan = minimumPlanFor(upgradeFor);
  const price = planPriceLabel(plan);

  return (
    <Modal open onClose={closeUpgrade} label={ui(copy.title)}>
      <div className="space-y-4 p-6">
        <div>
          <h2 className="text-base font-bold text-neutral-900">{ui(copy.title)}</h2>
          <p className="mt-1 text-xs leading-relaxed text-neutral-600">{ui(copy.detail)}</p>
        </div>

        <p className="text-xs text-neutral-700">
          {ui('Available on')}{' '}
          <strong className="font-mono uppercase tracking-caps">{PLAN_WORDS[plan]}</strong>
          {price && <> · <span className="font-mono">{price}</span></>}
        </p>

        {billingError && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {billingError}
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={closeUpgrade}
            className="min-h-11 rounded-xl border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
          >
            {ui('Cancel')}
          </button>
          <button
            type="button"
            onClick={() => { void handleUpgradePlan(plan); }}
            className="min-h-11 rounded-xl bg-neutral-900 px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-black"
          >
            {`${ui('Upgrade to')} ${PLAN_WORDS[plan]}`}
          </button>
        </div>
      </div>
    </Modal>
  );
};
