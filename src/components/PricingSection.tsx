import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { paidPlans, type BillingInterval } from '../config/plans';
import { Sparkles, Zap, Crown } from 'lucide-react';
import { Reveal } from './motion/Reveal';
import { PricingCard, type PricingPlanItem } from './PricingCard';

export function PricingSection({ onSelectPlan, headingLevel = 2 }: { onSelectPlan: (plan: string, interval: BillingInterval) => void | Promise<void>; headingLevel?: 1 | 2 }) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [interval, setInterval] = useState<BillingInterval>(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('interval') === 'year' ? 'year' : 'month');
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const currency = (cents: number) => new Intl.NumberFormat(lang, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);

  const plans: PricingPlanItem[] = [
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
      audience: ar ? 'للوكالات وفرق الإنتاج' : 'For design studios, labels & teams',
      icon: <Crown className="w-5 h-5 text-amber-500" />,
      tagline: ar ? 'أقصى قدرات ليينكس للمشاريع المتعددة وإدارة العملاء.' : 'Maximum capacity for multiple client profiles & brands.',
      price: paidPlans.studio[interval],
      features: ar
        ? [
            'كل ما تتضمنه خطة برو',
            'حتى 25 ملفاً شخصياً وموقعاً مصغراً',
            'نطاقات مخصصة غير محدودة',
            'تصدير كود نظيف وتضمين خارجي',
            'إمكانية إضافة أعضاء للفريق',
            'تصدير مباشر لبيانات المشتركين (CSV)',
            'أولوية الدعم عبر البريد الإلكتروني'
          ]
        : [
            'Everything in Pro',
            'Up to 25 profiles / mini-sites under 1 account',
            'Unlimited custom domains',
            'Clean HTML export & embed mode',
            'Team collaboration & shared access',
            'Instant CSV subscriber data export',
            'Dedicated priority support'
          ],
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="marketing-section py-12 md:py-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <Reveal distance="md" className="text-center max-w-2xl mx-auto mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-mono font-bold mb-3 tracking-wider">
              <span>{ar ? 'أسعار شفافة وبسيطة' : 'Transparent, Simple Pricing'}</span>
            </div>
            <Heading className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 mb-3 text-balance">
              {ar ? 'ابدأ مجاناً. طوّر عند الحاجة.' : 'Start free. Upgrade when ready.'}
            </Heading>
            <p className="text-base text-neutral-600 leading-relaxed text-pretty">
              {ar
                ? 'قارن الميزات المتاحة في كل خطة قبل الترقية.'
                : 'Compare the features included in each plan before upgrading.'}
            </p>
          </div>
        </Reveal>

        {/* Interval Toggle */}
        <Reveal delay={80} distance="sm"><div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-1 p-1 bg-neutral-100 border border-neutral-200 rounded-full">
            {(['month', 'year'] as const).map(value => (
              <button
                key={value}
                aria-pressed={interval === value}
                onClick={() => setInterval(value)}
                className={`px-5 py-2 min-h-[40px] rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
                  interval === value
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <span>{value === 'month' ? (ar ? 'شهري' : 'Monthly') : (ar ? 'سنوي' : 'Annual')}</span>
                {value === 'year' && (
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    interval === 'year'
                      ? 'bg-amber-400 text-neutral-950'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {ar ? 'شهران مجاناً' : '2 months free'}
                  </span>
                )}
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
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              interval={interval}
              ar={ar}
              currency={currency}
              pending={pending}
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
          {ar ? 'تُحصّل الخطط السنوية دفعة واحدة. لا توجد تجربة مدفوعة مجانية. تُدار الاشتراكات والإلغاءات عبر Stripe.' : 'Annual plans are charged once. Paid plans have no free trial. Subscriptions and cancellations are handled through Stripe.'}
        </p>
      </div>
    </section>
  );
}
