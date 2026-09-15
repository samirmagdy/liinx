import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { paidPlans, BillingInterval } from '../config/plans';

export function PricingSection({ onSelectPlan, headingLevel = 2 }: { onSelectPlan: (plan: string, interval: BillingInterval) => void | Promise<void>; headingLevel?: 1 | 2 }) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [interval, setInterval] = useState<BillingInterval>(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('interval') === 'year' ? 'year' : 'month');
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const currency = (cents: number) => new Intl.NumberFormat(lang, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);
  const features = {
    free: ar ? ['صفحة شخصية وروابط ووسائط', 'تخصيص المظهر', 'جمع اشتراكات البريد وإحصاءات الزيارات'] : ['Personal page, links and media', 'Theme customization', 'Email capture and visit analytics'],
    pro: ar ? ['ميزات الخطة المجانية', 'نطاق مخصص بعد التحقق والإعداد', 'إزالة شارة المنصة وتخصيص CSS', 'جدولة الروابط وتتبع الحملات'] : ['Free features included', 'Custom domain after verification and setup', 'Remove platform badge and customize CSS', 'Link scheduling and campaign tracking'],
    studio: ar ? ['ميزات Pro', 'إدارة ملفات متعددة', 'مفاتيح REST API'] : ['Pro features included', 'Multiple profile management', 'REST API keys']
  };
  return <section id="pricing" className="py-16 px-4 border-b border-neutral-200">
    <div className="max-w-6xl mx-auto">
      <Heading className="text-3xl sm:text-5xl font-bold text-center">{ar ? 'اختر خطتك' : 'Choose your plan'}</Heading>
      <p className="text-center mt-4 text-neutral-600">{ar ? 'ابدأ بالخطة المجانية. الاشتراكات المدفوعة تُحصّل عبر Stripe.' : 'Start with the free plan. Paid subscriptions are billed through Stripe.'}</p>
      <div className="flex justify-center gap-2 my-8">
        {(['month', 'year'] as const).map(value => <button key={value} aria-pressed={interval === value} onClick={() => setInterval(value)} className={`rounded-full px-5 min-h-11 border ${interval === value ? 'bg-neutral-900 text-white' : ''}`}>{value === 'month' ? (ar ? 'شهري' : 'Monthly') : (ar ? 'سنوي' : 'Annual')}</button>)}
      </div>
      {error && <p role="alert" className="text-red-700 text-center mb-4">{ar ? 'تعذّر فتح صفحة الدفع. سجّل الدخول وحاول مجدداً. قد تكون خدمة الدفع غير مهيأة.' : 'Could not open checkout. Sign in and retry. Billing may not be configured.'}</p>}
      <div className="grid md:grid-cols-3 gap-6">
        {(['free', 'pro', 'studio'] as const).map(plan => <article key={plan} className="border rounded-3xl p-6 flex flex-col gap-5">
          <h2 className="text-2xl font-bold">{plan === 'free' ? (ar ? 'مجاني' : 'Free') : paidPlans[plan].name}</h2>
          <p className="text-3xl font-bold">{currency(plan === 'free' ? 0 : paidPlans[plan][interval])}<span className="text-sm font-normal"> / {interval === 'month' ? (ar ? 'شهر' : 'month') : (ar ? 'سنة' : 'year')}</span></p>
          <ul className="space-y-3 flex-1">{features[plan].map(feature => <li key={feature}>{feature}</li>)}</ul>
          <button disabled={pending !== null} className="min-h-11 rounded-full bg-neutral-900 text-white px-4 py-3 disabled:opacity-50" onClick={async () => {
            setPending(plan); setError(false);
            try { await onSelectPlan(plan, interval); } catch { setError(true); } finally { setPending(null); }
          }}>{pending === plan ? (ar ? 'جارٍ الفتح…' : 'Opening…') : plan === 'free' ? (ar ? 'ابدأ مجاناً' : 'Start free') : (ar ? 'المتابعة إلى الدفع' : 'Continue to checkout')}</button>
        </article>)}
      </div>
      <p className="mt-8 text-sm text-center text-neutral-600">{ar ? 'تُحصّل الخطة السنوية دفعة واحدة. لا توجد تجربة مدفوعة مجانية. إدارة الاشتراك والإلغاء من بوابة الفوترة.' : 'Annual plans are charged in one payment. No free trial on paid plans. Manage or cancel your subscription in the billing portal.'}</p>
    </div>
  </section>;
}
