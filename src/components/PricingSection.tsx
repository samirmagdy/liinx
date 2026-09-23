import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { paidPlans, entitlementsFor, type BillingInterval } from '../config/plans';
import { Sparkles, Zap, Crown } from 'lucide-react';
import { Reveal } from './motion/Reveal';
import { PricingCard, type PricingPlanItem } from './PricingCard';
import { ReassuranceNote } from './ReassuranceNote';
import { PricingIntervalToggle } from './PricingIntervalToggle';
import type { PricingPlanTranslation } from '../config/i18n';

function buildPricingPlans(content: Record<'starter' | 'pro' | 'studio', PricingPlanTranslation>, interval: BillingInterval, recommendationLabel: string): PricingPlanItem[] {
  const icons = {
    starter: <Zap className="w-5 h-5 text-neutral-600" />,
    pro: <Sparkles className="w-5 h-5 text-indigo-600" />,
    studio: <Crown className="w-5 h-5 text-indigo-500" />
  };
  return (['starter', 'pro', 'studio'] as const).map(key => ({
    id: key === 'starter' ? 'free' : key,
    name: content[key].name,
    audience: content[key].audience,
    icon: icons[key],
    tagline: content[key].tagline,
    price: key === 'starter' ? 0 : paidPlans[key][interval],
    features: content[key].features.map(feature => feature.replace('{maxProfiles}', String(entitlementsFor(key === 'starter' ? 'free' : key).maxProfiles))),
    highlight: key === 'pro',
    recommendationLabel: key === 'pro' ? recommendationLabel : undefined
  }));
}

export function PricingSection({ onSelectPlan, headingLevel = 2 }: { onSelectPlan: (plan: string, interval: BillingInterval) => void | Promise<void>; headingLevel?: 1 | 2 }) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const { lang, t } = useLanguage();
  const ar = lang === 'ar';
  const [interval, setInterval] = useState<BillingInterval>(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('interval') === 'year' ? 'year' : 'month');
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const currency = (cents: number) => new Intl.NumberFormat(lang, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);

  const plans = buildPricingPlans(t.pricingSection.plans, interval, t.pricingSection.recommended);

  return (
    <section id="pricing" className="marketing-section raloa-pattern-bg py-12 md:py-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <Reveal distance="md" className="text-center max-w-2xl mx-auto mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-mono font-bold mb-3 tracking-wider">
              <span>{t.pricingSection.badge}</span>
            </div>
            <Heading className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 mb-3 text-balance">
              {t.pricingSection.title}
            </Heading>
            <p className="text-base text-neutral-600 leading-relaxed text-pretty">
              {t.pricingSection.subtitle}
            </p>
          </div>
        </Reveal>

        <Reveal delay={80} distance="sm"><PricingIntervalToggle interval={interval} onChange={setInterval} /></Reveal>

        {error && (
          <p role="alert" className="text-sm text-red-700 text-center mb-6 p-3 rounded-xl bg-red-50 border border-red-200 max-w-md mx-auto">
            {t.pricingSection.checkoutUnavailable}
          </p>
        )}

        {/* Plans Grid */}
        <Reveal stagger><div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              interval={interval}
              ar={ar}
              currency={currency}
              pending={pending}
              titleTag={headingLevel === 1 ? 'h2' : 'h3'}
              onSelectPlan={async (planId) => {
                setPending(planId);
                setError(false);
                try {
                  await onSelectPlan(planId, interval);
                } catch {
                  setError(true);
                } finally {
                  setPending(null);
                }
              }}
            />
          ))}
        </div></Reveal>

        {/* Disclaimer */}
        <p className="mt-6 text-xs text-center text-neutral-600 max-w-lg mx-auto">
          {t.pricingSection.disclaimer}
        </p>

        <Reveal distance="sm" delay={60}>
          <ReassuranceNote className="mt-3 justify-center" />
        </Reveal>
      </div>
    </section>
  );
}
