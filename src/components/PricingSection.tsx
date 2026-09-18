import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { paidPlans, type BillingInterval } from '../config/plans';
import { CheckCircle2, Sparkles, ArrowRight, Zap, Crown } from 'lucide-react';
import { Reveal } from './motion/Reveal';

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
      audience: ar ? 'للمبدعين في بداية طريقهم' : 'For creators just getting started',
      icon: <Zap className="w-5 h-5 text-neutral-600" />,
      tagline: ar ? 'صفحة مصغرة أساسية لنشر روابطك ووسائطك.' : 'A focused mini-site to publish your links and media.',
      price: 0,
      features: ar
        ? [
            'ملف شخصي واحد (liinx.app/@اسمك)',
            'روابط ووسائط متعددة وأيقونات تواصل',
            'تخصيص القوالب والألوان',
            'نموذج اشتراك في النشرة البريدية',
            'إحصاءات أساسية للزيارات والنقرات ومصادر الإحالة'
          ]
        : [
            '1 published profile (liinx.app/@username)',
            'Links, social icons and rich media blocks',
            'Theme and aesthetic customization',
            'Built-in newsletter capture form',
            'Visits, clicks, and referrer analytics'
          ],
      highlight: false,
    },
    {
      id: 'pro' as const,
      name: paidPlans.pro.name,
      audience: ar ? 'للمحترفين والمبدعين المستقلين' : 'For serious creators & visual artists',
      icon: <Sparkles className="w-5 h-5 text-amber-600" />,
      tagline: ar ? 'نطاق خاص وتحكم كامل بدون أي شارات للمنصة.' : 'Custom domain, advanced styling, and zero branding.',
      price: paidPlans.pro[interval],
      features: ar
        ? [
            'كل ما تتضمنه الخطة المجانية',
            'حتى 5 ملفات شخصية ومواقع مصغرة',
            'دعم النطاق المخصص مع تشفير HTTPS بعد إعداد الاستضافة',
            'إزالة شارة ليينكس بالكامل',
            'تخصيص CSS وخطوط ويب إضافية',
            'جدولة الروابط وتتبع حملات UTM',
            'ربط Google Analytics وبيكسل ميتا'
          ]
        : [
            'Everything in Free',
            'Up to 5 profiles / mini-sites under 1 account',
            'Custom domain support with secure HTTPS after hosting configuration',
            'Remove all Liinx branding',
            'Custom CSS styling & web font injection',
            'Link scheduling & UTM campaign tracking',
            'Google Analytics 4 & Meta Pixel integration'
          ],
      highlight: true,
    },
    {
      id: 'studio' as const,
      name: paidPlans.studio.name,
      audience: ar ? 'للوكالات والاستوديوهات والفرق' : 'For agencies, studios & multi-brand managers',
      icon: <Crown className="w-5 h-5 text-purple-600" />,
      tagline: ar ? 'لإدارة حتى 25 صفحة مع واجهة برمجية كاملة.' : 'Scale across 25 micro-sites with public REST API.',
      price: paidPlans.studio[interval],
      features: ar
        ? [
            'كل ميزات خطة Pro',
            'إدارة حتى 25 ملفاً شخصياً وموقعاً مصغراً',
            'الوصول الكامل لواجهة REST API v1',
            'إدارة مفاتيح API',
            'دعم النطاق المخصص لكل ملف',
            'تصدير بيانات المشتركين (CSV)',
            'تصدير ردود النماذج (CSV)'
          ]
        : [
            'Everything in Pro',
            'Up to 25 profiles & mini-sites',
            'REST API v1 access',
            'API-key management',
            'Custom domain support per profile',
            'Subscriber CSV export',
            'Form-response CSV export'
          ],
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="marketing-section py-12 md:py-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-200">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <Reveal distance="md" className="text-center mb-6"><div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-mono font-bold text-neutral-800 mb-3 tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{ar ? 'الأسعار' : 'Pricing'}</span>
          </div>
          <Heading className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 mb-3 text-balance">
            {ar ? 'اختر خطتك المناسبة' : 'Transparent pricing for every scale'}
          </Heading>
          <p className="text-base text-neutral-600 max-w-lg mx-auto text-pretty">
            {ar ? 'ابدأ مجاناً وقم بالترقية عند الحاجة. لا توجد عمولات خفية على مبيعاتك.' : 'Start free and scale as your brand grows. Zero transaction commissions.'}
          </p>
        </div></Reveal>

        {/* Interval Toggle */}
        <Reveal delay={80} distance="sm"><div className="flex justify-center mb-6">
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
        </div></Reveal>

        {error && (
          <p role="alert" className="text-sm text-red-700 text-center mb-6 p-3 rounded-xl bg-red-50 border border-red-200 max-w-md mx-auto">
            {ar ? 'خدمة الدفع غير متاحة مؤقتاً. يُرجى تسجيل الدخول والمحاولة لاحقاً أو التواصل مع الدعم.' : 'Checkout is temporarily unavailable. Please try again or contact support.'}
          </p>
        )}

        {/* Plans Grid */}
        <Reveal stagger><div className="grid md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <article
              key={plan.id}
              className={`motion-card rounded-3xl p-7 flex flex-col gap-6 ${
                plan.highlight
                  ? 'bg-neutral-900 text-white border-2 border-neutral-800 shadow-lg relative'
                  : 'bg-neutral-50 border border-neutral-200 hover:border-neutral-300'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-400 text-neutral-900 text-[10px] font-bold uppercase tracking-wider shadow-xs">
                  {ar ? 'موصى به' : 'Recommended'}
                </div>
              )}

              {/* Plan Header */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.highlight ? 'bg-neutral-100/5' : 'bg-neutral-100 border border-neutral-200'}`}>
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
                className={`w-full min-h-[44px] rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
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
        </div></Reveal>

        {/* Disclaimer */}
        <p className="mt-6 text-xs text-center text-neutral-600 max-w-lg mx-auto">
          {ar ? 'تُحصّل الخطط السنوية دفعة واحدة. لا توجد تجربة مدفوعة مجانية. تُدار الاشتراكات والإلغاءات عبر Stripe.' : 'Annual plans are charged once. Paid plans have no free trial. Subscriptions and cancellations are handled through Stripe.'}
        </p>
      </div>
    </section>
  );
}
