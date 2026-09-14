import React, { useState } from 'react';
import { PRICING_PLANS } from '../data/mockData';
import { Check, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface PricingSectionProps {
  onSelectPlan: (planId: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan }) => {
  const [isAnnual, setIsAnnual] = useState(true);
  const { t, isRtl } = useLanguage();

  return (
    <section id="pricing" className="py-20 md:py-28 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-xs font-mono font-bold text-neutral-800 mb-3 tracking-wider">
            <span>{t.pricingSection.badge}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 mb-4 text-balance">
            {t.pricingSection.title}
          </h2>
          <p className="text-base text-neutral-600 text-pretty">
            {t.pricingSection.subtitle}
          </p>

          {/* Monthly / Annual Billing Toggle */}
          <div className="mt-8 inline-flex items-center p-1 bg-neutral-100 border border-neutral-200 rounded-full">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
                !isAnnual
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {t.pricingSection.monthly}
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
                isAnnual
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <span>{t.pricingSection.yearly}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-extrabold tracking-wider">
                {t.pricingSection.yearlySave}
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {PRICING_PLANS.map((plan) => {
            const price = isAnnual ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-colors duration-200 ${
                  plan.popular
                    ? 'bg-neutral-50/50 border-2 border-neutral-900 shadow-md'
                    : 'bg-white border border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-neutral-900 text-white text-[11px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                    <span>{t.pricingSection.popular}</span>
                  </div>
                )}

                <div>
                  <div className="mb-6">
                    <h3 className="font-brand font-bold text-xl text-neutral-900">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1 h-8 text-pretty">
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Price display */}
                  <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-neutral-200">
                    <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 tabular-nums">
                      ${price}
                    </span>
                    <span className="text-xs font-semibold text-neutral-500">
                      {t.pricingSection.perMonth} {isAnnual && <span className="block text-[11px] text-neutral-400 tabular-nums">billed ${plan.yearlyPrice}/yr</span>}
                    </span>
                  </div>

                  {/* Feature list */}
                  <ul className="space-y-3 mb-8 text-xs text-neutral-600">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5] mt-0.5" />
                        <span className="leading-relaxed">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => onSelectPlan(plan.id)}
                  className={`w-full py-3.5 px-4 rounded-full text-xs font-bold transition-colors active:scale-95 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
                    plan.popular
                      ? 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm'
                      : 'bg-neutral-100 border border-neutral-200 hover:bg-neutral-200 text-neutral-900'
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Guarantee Banner */}
        <div className="mt-12 text-center text-xs text-neutral-500">
          <p>
            All plans include a 14-day free trial. Cancel anytime with a single click. Zero lock-in.
          </p>
        </div>

      </div>
    </section>
  );
};
