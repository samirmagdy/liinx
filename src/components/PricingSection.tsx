import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { paidPlans, BillingInterval } from '../config/plans';
import { CheckCircle2, Sparkles, ArrowRight, Zap, Crown } from 'lucide-react';

export function PricingSection({ onSelectPlan, headingLevel = 2 }: { onSelectPlan: (plan: string, interval: BillingInterval) => void | Promise<void>; headingLevel?: 1 | 2 }) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [interval, setInterval] = useState<BillingInterval>(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('interval') === 'year' ? 'year' : 'month');
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const currency = (cents: number) => new Intl.NumberFormat(lang, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);

  const plans = [
    {
      id: 'free' as const,
      name: ar ? 'مجاني' : 'Free',
      icon: <Zap className="w-5 h-5 text-neutral-600" />,
      tagline: ar ? 'مكان بسيط لنشر صفحتك وروابطك.' : 'A simple place to publish your page and links.',
      price: 0,
      features: ar
        ? ['صفحة شخصية وروابط ووسائط', 'تخصيص المظهر', 'جمع اشتراكات البريد وإحصاءات الزيارات']
        : ['Published liinx.app/@username page', 'Links, social icons and supported media blocks', 'Theme customization', 'Newsletter capture form', 'Views, clicks and referrer analytics'],
      highlight: false,
    },
    {
      id: 'pro' as const,
      name: paidPlans.pro.name,
      icon: <Sparkles className="w-5 h-5 text-amber-600" />,
      tagline: ar ? 'تحكم أكبر مع نمو حضورك.' : 'More control as your creator presence grows.',
      price: paidPlans.pro[interval],
      features: ar
        ? ['ميزات الخطة المجانية', 'نطاق مخصص بعد التحقق والإعداد', 'إزالة شارة المنصة وتخصيص CSS', 'جدولة الروابط وتتبع الحملات']
        : ['Everything in Free', 'Custom domain after DNS verification and hosting/TLS setup', 'Custom CSS and custom font URL settings', 'Link scheduling and UTM campaign tracking', 'Google Analytics and Meta Pixel settings', 'Remove Liinx branding'],
      highlight: true,
    },
    {
      id: 'studio' as const,
      name: paidPlans.studio.name,
      icon: <Crown className="w-5 h-5 text-purple-600" />,
      tagline: ar ? 'لإدارة عدة صفحات من حساب واحد.' : 'Manage multiple pages from one account.',
      price: paidPlans.studio[interval],
      features: ar
        ? ['ميزات Pro', 'إدارة ملفات متعددة', 'مفاتيح REST API']
        : ['Everything in Pro', 'Multiple profile management', 'REST API keys'],
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 border-b border-neutral-200">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-mono font-bold text-neutral-800 mb-3 tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{ar ? 'الأسعار' : 'Pricing'}</span>
          </div>
          <Heading className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 mb-3 text-balance">
            {ar ? 'اختر خطتك' : 'Choose your plan'}
          </Heading>
          <p className="text-base text-neutral-600 max-w-lg mx-auto text-pretty">
            {ar ? 'ابدأ بالخطة المجانية. الاشتراكات المدفوعة تُحصّل عبر Stripe.' : 'Start with the free plan. Paid subscriptions are billed through Stripe.'}
          </p>
        </div>

        {/* Interval Toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 p-1 bg-neutral-100 border border-neutral-200 rounded-full">
            {(['month', 'year'] as const).map(value => (
              <button
                key={value}
                aria-pressed={interval === value}
                onClick={() => setInterval(value)}
                className={`px-5 py-2 min-h-[40px] rounded-full text-xs font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
                  interval === value
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {value === 'month' ? (ar ? 'شهري' : 'Monthly') : (ar ? 'سنوي' : 'Annual')}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-700 text-center mb-6 p-3 rounded-xl bg-red-50 border border-red-200 max-w-md mx-auto">
            {ar ? 'تعذّر فتح صفحة الدفع. سجّل الدخول وحاول مجدداً. قد تكون خدمة الدفع غير مهيأة.' : 'Could not open checkout. Sign in and retry. Billing may not be configured.'}
          </p>
        )}

{/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <article
              key={plan.id}
              className={`rounded-3xl p-7 flex flex-col gap-6 transition-all hover:scale-[1.02] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                plan.highlight
                  ? 'bg-neutral-900 text-white border-2 border-neutral-800 shadow-lg relative'
                  : 'bg-neutral-50 border border-neutral-200 hover:border-neutral-300'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-400 text-neutral-900 text-[10px] font-bold uppercase tracking-wider">
                  {ar ? 'الأكثر شعبية' : 'Most Popular'}
                </div>
              )}

              {/* Plan Header */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.highlight ? 'bg-neutral-100/5' : 'bg-neutral-100 border border-neutral-200'}`}>
                  {plan.icon}
                </div>
                <h2 className={`text-xl font-bold ${plan.highlight ? 'text-white' : 'text-neutral-900'}`}>
                  {plan.name}
                </h2>
              </div>
              <p className={`text-sm leading-relaxed -mt-3 ${plan.highlight ? 'text-neutral-300' : 'text-neutral-600'}`}>{plan.tagline}</p>

              {/* Price */}
              <div>
                <span className={`text-4xl font-extrabold tracking-tight ${plan.highlight ? 'text-white' : 'text-neutral-900'}`}>
                  {currency(plan.price)}
                </span>
                <span className={`text-sm font-normal ${plan.highlight ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  {' '}/ {interval === 'month' ? (ar ? 'شهر' : 'month') : (ar ? 'سنة، تُحصّل دفعة واحدة' : 'year, billed once')}
                </span>
                {interval === 'year' && plan.price > 0 && (
                  <p className={`text-xs mt-2 ${plan.highlight ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    {ar ? `ما يعادل ${currency(plan.price / 12)} شهرياً` : `Equivalent to ${currency(plan.price / 12)}/month`}
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 flex-1">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <span className={plan.highlight ? 'text-neutral-200' : 'text-neutral-700'}>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                disabled={pending !== null}
                className={`w-full min-h-[44px] rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  plan.highlight
                    ? 'bg-neutral-50 text-neutral-900 hover:bg-neutral-100 focus-visible:ring-neutral-900/20'
                    : 'bg-neutral-900 text-white hover:bg-black focus-visible:ring-neutral-900/20'
                }`}
                onClick={async () => {
                  setPending(plan.id); setError(false);
                  try { await onSelectPlan(plan.id, interval); } catch { setError(true); } finally { setPending(null); }
                }}
              >
                <span>
                  {pending === plan.id
                    ? (ar ? 'جارٍ الفتح…' : 'Opening…')
                    : plan.id === 'free'
                      ? (ar ? 'ابدأ مجاناً' : 'Start free')
                      : (ar ? 'المتابعة إلى الدفع' : 'Continue to checkout')
                  }
                </span>
                {pending !== plan.id && <ArrowRight className={`w-4 h-4 ${ar ? 'rotate-180' : ''}`} />}
              </button>
            </article>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="mt-8 text-xs text-center text-neutral-600 max-w-lg mx-auto">
          {ar ? 'تُحصّل الخطط السنوية دفعة واحدة. لا توجد تجربة مدفوعة مجانية. تُدار الاشتراكات والإلغاءات عبر Stripe.' : 'Annual plans are charged once. Paid plans have no free trial. Subscriptions and cancellations are handled through Stripe.'}
        </p>
      </div>
    </section>
  );
}
