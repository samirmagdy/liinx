import React, { useState } from 'react';
import { PRICING_PLANS } from '../data/mockData';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

interface PricingSectionProps {
  onSelectPlan: (planId: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan }) => {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className="py-20 md:py-28 bg-[#FAF9F6] border-b border-[#E8E6DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181B]/5 text-xs font-mono font-bold text-[#18181B] mb-3">
            <span>TRANSPARENT PRICING</span>
            <span>•</span>
            <span className="text-emerald-700">14-DAY FREE TRIAL</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#111315] mb-4">
            Simple, honest pricing for serious creators
          </h2>
          <p className="text-base text-[#52525B]">
            Build your entire page for free. Upgrade when you’re ready to connect your custom domain and remove all badges.
          </p>

          {/* Monthly / Annual Billing Toggle */}
          <div className="mt-8 inline-flex items-center p-1 bg-white border border-[#E2DFD8] rounded-full shadow-xs">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                !isAnnual
                  ? 'bg-[#18181B] text-white shadow-xs'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isAnnual
                  ? 'bg-[#18181B] text-white shadow-xs'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-extrabold">
                2 MONTHS FREE
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
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                  plan.popular
                    ? 'bg-white border-2 border-[#18181B] shadow-xl ring-4 ring-amber-400/20'
                    : 'bg-white border border-[#E2DFD8] shadow-xs hover:border-[#CDC7BC]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#18181B] text-white text-[11px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Most Popular</span>
                  </div>
                )}

                <div>
                  <div className="mb-6">
                    <h3 className="font-brand font-bold text-xl text-[#111315]">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-[#71717A] mt-1 h-8">
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Price display */}
                  <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-[#F0EEE8]">
                    <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#111315]">
                      ${price}
                    </span>
                    <span className="text-xs font-semibold text-[#71717A]">
                      / month {isAnnual && <span className="block text-[11px] text-[#A1A1AA]">billed ${plan.yearlyPrice}/yr</span>}
                    </span>
                  </div>

                  {/* Feature list */}
                  <ul className="space-y-3 mb-8 text-xs text-[#52525B]">
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
                  className={`w-full py-3.5 px-4 rounded-full text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                    plan.popular
                      ? 'bg-[#18181B] hover:bg-black text-white shadow-md'
                      : 'bg-[#FAF9F6] border border-[#E2DFD8] hover:border-black text-[#18181B]'
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Guarantee Banner */}
        <div className="mt-12 text-center text-xs text-[#71717A]">
          <p>
            All plans include a 14-day free trial. Cancel anytime with a single click. Zero lock-in.
          </p>
        </div>

      </div>
    </section>
  );
};
