import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { type BillingInterval } from '../config/plans';

export interface PricingPlanItem {
  id: 'free' | 'pro' | 'studio';
  name: string;
  audience: string;
  icon: React.ReactNode;
  tagline: string;
  price: number;
  features: string[];
  highlight: boolean;
}

interface PricingCardProps {
  plan: PricingPlanItem;
  interval: BillingInterval;
  ar: boolean;
  currency: (cents: number) => string;
  pending: string | null;
  onSelectPlan: (planId: string) => void;
}

function PlanPrice({
  price,
  interval,
  ar,
  highlight,
  currency
}: {
  price: number;
  interval: BillingInterval;
  ar: boolean;
  highlight: boolean;
  currency: (cents: number) => string;
}) {
  const periodLabel = interval === 'month'
    ? (ar ? 'شهر' : 'month')
    : (ar ? 'سنة، تُحصّل دفعة واحدة' : 'year, billed once');

  return (
    <div>
      <span className={`text-4xl font-extrabold tracking-tight ${highlight ? 'text-white' : 'text-neutral-900'}`}>
        {currency(price)}
      </span>
      <span className={`text-sm font-normal ${highlight ? 'text-neutral-400' : 'text-neutral-500'}`}>
        {' '}/ {periodLabel}
      </span>
      {interval === 'year' && price > 0 && (
        <p className={`text-xs mt-2 ${highlight ? 'text-neutral-400' : 'text-neutral-500'}`}>
          {ar ? `ما يعادل ${currency(price / 12)} شهرياً` : `Equivalent to ${currency(price / 12)}/month`}
        </p>
      )}
    </div>
  );
}

function PlanCtaButton({
  planId,
  highlight,
  pending,
  ar,
  onClick
}: {
  planId: string;
  highlight: boolean;
  pending: boolean;
  ar: boolean;
  onClick: () => void;
}) {
  const label = pending
    ? (ar ? 'جارٍ الفتح…' : 'Opening…')
    : planId === 'free'
      ? (ar ? 'ابدأ مجاناً' : 'Start free')
      : (ar ? 'المتابعة إلى الدفع' : 'Continue to checkout');

  const btnClasses = highlight
    ? 'bg-neutral-50 text-neutral-900 hover:bg-neutral-100 focus-visible:ring-neutral-900/20'
    : 'bg-neutral-900 text-white hover:bg-black focus-visible:ring-neutral-900/20';

  return (
    <button
      disabled={pending}
      className={`w-full min-h-[44px] rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${btnClasses}`}
      onClick={onClick}
    >
      <span>{label}</span>
      {!pending && <ArrowRight className={`w-4 h-4 ${ar ? 'rotate-180' : ''}`} />}
    </button>
  );
}

export const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  interval,
  ar,
  currency,
  pending,
  onSelectPlan
}) => {
  return (
    <article
      className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all relative ${
        plan.highlight
          ? 'bg-neutral-900 text-white shadow-xl ring-2 ring-amber-500/20'
          : 'bg-white border border-neutral-200 text-neutral-900 shadow-xs'
      }`}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-400 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider shadow-xs">
          {ar ? 'الأكثر طلباً' : 'Most Popular'}
        </span>
      )}

      {/* Plan Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              plan.highlight ? 'bg-neutral-100/5' : 'bg-neutral-100 border border-neutral-200'
            }`}
          >
            {plan.icon}
          </div>
          <h3 className={`text-xl font-bold ${plan.highlight ? 'text-white' : 'text-neutral-900'}`}>
            {plan.name}
          </h3>
        </div>
        <div className="space-y-1 -mt-3">
          <p className={`text-xs font-semibold ${plan.highlight ? 'text-amber-400' : 'text-amber-700'}`}>
            {plan.audience}
          </p>
          <p className={`text-sm leading-relaxed ${plan.highlight ? 'text-neutral-300' : 'text-neutral-600'}`}>
            {plan.tagline}
          </p>
        </div>

        <PlanPrice
          price={plan.price}
          interval={interval}
          ar={ar}
          highlight={plan.highlight}
          currency={currency}
        />

        {/* Features */}
        <ul className="space-y-3 flex-1">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm">
              <CheckCircle2
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  plan.highlight ? 'text-emerald-400' : 'text-emerald-600'
                }`}
              />
              <span className={plan.highlight ? 'text-neutral-200' : 'text-neutral-700'}>{feature}</span>
            </li>
          ))}
        </ul>

        <PlanCtaButton
          planId={plan.id}
          highlight={plan.highlight}
          pending={pending === plan.id}
          ar={ar}
          onClick={() => onSelectPlan(plan.id)}
        />
      </div>
    </article>
  );
};
