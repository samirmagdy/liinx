import React from 'react';
import { useLanguage } from '../context/LanguageContext';
export function ComparisonSection() {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const rows = ar ? [
    ['الروابط والوسائط', 'أضف روابط ووسائط من مزوّدين مدعومين.'],
    ['الحجز', 'ضمّن صفحة مواعيد Calendly. يؤكّد المزوّد الحجز.'],
    ['النشرة البريدية', 'اجمع عناوين المشتركين وصدّرها بصيغة CSV.'],
    ['الإحصاءات', 'اطّلع على الزيارات والنقرات ومصادر الإحالة؛ ليست مقياساً للحجوزات المكتملة.'],
    ['النطاق المخصص', 'يتطلب خطة مدفوعة والتحقق من DNS وإعداد الاستضافة وTLS.']
  ] : [
    ['Links and media', 'Add links and media from supported providers.'],
    ['Booking', 'Embed your Calendly scheduling page. The provider confirms appointments.'],
    ['Newsletter', 'Collect subscriber email addresses and export CSV.'],
    ['Analytics', 'View visits, clicks and referrers; these are not completed-booking metrics.'],
    ['Custom domain', 'Requires a paid plan, DNS verification, and hosting/TLS configuration.']
  ];
  return <section className="py-16 px-4 border-b border-neutral-200">
    <div className="max-w-4xl mx-auto"><h2 className="text-3xl font-bold mb-8">{ar ? 'الميزات ومتطلباتها' : 'Features and requirements'}</h2>
      <dl className="divide-y border rounded-2xl px-5">{rows.map(([name, value]) => <div className="py-5 grid sm:grid-cols-[1fr_2fr] gap-2" key={name}><dt className="font-bold">{name}</dt><dd className="text-neutral-600 leading-7">{value}</dd></div>)}</dl>
    </div>
  </section>;
}
