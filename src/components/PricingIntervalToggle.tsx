import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { type BillingInterval } from '../config/plans';

/** Monthly or annual, with the annual saving stated the way the price actually works. */
export const PricingIntervalToggle: React.FC<{ interval: BillingInterval; onChange: (interval: BillingInterval) => void }> = ({ interval, onChange }) => {
  const { t } = useLanguage();

  return (
    <div className="flex justify-center mb-6">
      <div className="inline-flex items-center gap-1 p-1 bg-neutral-100 border border-neutral-200 rounded-full">
        {(['month', 'year'] as const).map(value => (
          <button
            key={value}
            aria-pressed={interval === value}
            onClick={() => onChange(value)}
            className={`px-5 py-2 min-h-[40px] rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              interval === value
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>{value === 'month' ? t.pricingSection.monthlyShort : t.pricingSection.annualShort}</span>
            {value === 'year' && (
              <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                interval === 'year'
                  ? 'bg-indigo-400 text-neutral-950'
                  : 'bg-indigo-100 text-indigo-800'
              }`}>
                {t.pricingSection.annualBonus}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
