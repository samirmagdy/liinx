import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Link2, CalendarCheck, Mail, BarChart3, Globe2, Layers, ArrowRight, Download } from 'lucide-react';
import { useLocation } from 'wouter';

export function ComparisonSection() {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [, setLocation] = useLocation();

  const rows = ar ? [
    { icon: <Link2 className="w-4 h-4 text-amber-600" />, name: 'الروابط والوسائط', value: 'أضف روابط ووسائط من مزوّدين مدعومين.' },
    { icon: <CalendarCheck className="w-4 h-4 text-blue-600" />, name: 'الحجز', value: 'ضمّن صفحة مواعيد Calendly. يؤكّد المزوّد الحجز.' },
    { icon: <Mail className="w-4 h-4 text-emerald-600" />, name: 'النشرة البريدية', value: 'اجمع عناوين المشتركين وصدّرها بصيغة CSV.' },
    { icon: <BarChart3 className="w-4 h-4 text-purple-600" />, name: 'الإحصاءات', value: 'اطّلع على الزيارات والنقرات ومصادر الإحالة؛ ليست مقياساً للحجوزات المكتملة.' },
    { icon: <Globe2 className="w-4 h-4 text-rose-600" />, name: 'النطاق المخصص', value: 'يتطلب خطة مدفوعة والتحقق من DNS وإعداد الاستضافة وTLS.' }
  ] : [
    { icon: <Link2 className="w-4 h-4 text-amber-600" />, name: 'Links and media', value: 'Add links and media from supported providers.' },
    { icon: <CalendarCheck className="w-4 h-4 text-blue-600" />, name: 'Booking', value: 'Embed your Calendly scheduling page. The provider confirms appointments.' },
    { icon: <Mail className="w-4 h-4 text-emerald-600" />, name: 'Newsletter', value: 'Collect subscriber email addresses and export CSV.' },
    { icon: <BarChart3 className="w-4 h-4 text-purple-600" />, name: 'Analytics', value: 'View visits, clicks and referrers; these are not completed-booking metrics.' },
    { icon: <Globe2 className="w-4 h-4 text-rose-600" />, name: 'Custom domain', value: 'Requires a paid plan, DNS verification, and hosting/TLS configuration.' }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-200">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-mono font-bold text-neutral-800 mb-3 tracking-wider">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>{ar ? 'نظرة شاملة' : 'Capabilities'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 mb-3 text-balance">
            {ar ? 'ما يمكنك نشره' : 'What you can publish'}
          </h2>
          <p className="text-base text-neutral-600 text-pretty max-w-xl mx-auto">
            {ar ? 'محتوى حقيقي في صفحتك، مع توضيح ما يتطلب مزوّداً خارجياً أو خطة مدفوعة.' : 'Real content for your page, with clear notes about outside providers and paid-plan requirements.'}
          </p>
        </div>

        {/* Feature List */}
        <dl className="divide-y divide-neutral-200 border border-neutral-200 rounded-2xl bg-neutral-50 overflow-hidden shadow-xs">
          {rows.map((row) => (
            <div className="py-5 px-5 sm:px-6 grid sm:grid-cols-[1fr_2fr] gap-3 items-start" key={row.name}>
              <dt className="flex items-center gap-2.5 font-bold text-sm text-neutral-900">
                <div className="w-8 h-8 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-center shrink-0">
                  {row.icon}
                </div>
                {row.name}
              </dt>
              <dd className="text-sm text-neutral-600 leading-relaxed">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-amber-200 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900">{ar ? 'هل تنتقل من Linktree؟' : 'Coming from Linktree or Beacons?'}</h3>
              <p className="text-sm text-neutral-600 leading-relaxed mt-1">{ar ? 'عاين الروابط العامة المدعومة واختر ما تريد استيراده قبل الحفظ.' : 'Preview links from a supported public profile and choose what to import before saving.'}</p>
            </div>
          </div>
          <button onClick={() => setLocation('/register?after=import')} className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-black cursor-pointer">
            {ar ? 'ابدأ الاستيراد' : 'Start importing'}
            <ArrowRight className={`w-3.5 h-3.5 ${ar ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </section>
  );
}
