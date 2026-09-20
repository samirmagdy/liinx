import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Reveal } from './motion/Reveal';

interface FeaturesSectionProps {
  onOpenStudio: () => void;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ onOpenStudio }) => {
  const { isRtl } = useLanguage();

  const groups = isRtl ? [
    {
      title: 'محتوى الصفحة',
      description: 'اجمع روابطك ووسائطك وطرق التواصل في صفحة واحدة.',
      items: ['روابط وملفات تعريف اجتماعية', 'مشغلات صوت وفيديو مدعومة', 'مجلدات ونماذج اشتراك', 'روابط حجز عبر Calendly']
    },
    {
      title: 'المظهر',
      description: 'اختر سمة وعدّل مظهر صفحتك.',
      items: ['سمات جاهزة', 'ألوان وخطوط قابلة للتخصيص', 'CSS وخطوط ويب مخصصة في الخطط المؤهلة']
    },
    {
      title: 'الزيارات والاشتراكات',
      description: 'تابع نشاط صفحتك ونزّل بيانات المشتركين.',
      items: ['مشاهدات الصفحة ونقرات الروابط', 'مصادر الإحالة وحملات UTM', 'تصدير المشتركين بصيغة CSV']
    },
    {
      title: 'النطاق والبيانات',
      description: 'استخدم نطاقاً مخصصاً في الخطط المؤهلة وصدّر بيانات حسابك.',
      items: ['يتطلب النطاق التحقق من DNS وإعداد الاستضافة وTLS', 'تصدير JSON للملفات والصفحات والكتل والسجلات', 'لا يشمل التصدير ملفات الوسائط أو سجل التحليلات الخام']
    }
  ] : [
    {
      title: 'Page content',
      description: 'Bring links, media, and ways to contact you together on one page.',
      items: ['Links and social profiles', 'Supported audio and video embeds', 'Folders and signup forms', 'Calendly booking links']
    },
    {
      title: 'Appearance',
      description: 'Choose a theme and adjust how your page looks.',
      items: ['Theme presets', 'Custom colors and typography', 'Custom CSS and web fonts on eligible plans']
    },
    {
      title: 'Visits and subscribers',
      description: 'Review page activity and download subscriber records.',
      items: ['Page views and link clicks', 'Referrers and UTM campaigns', 'Subscriber CSV export']
    },
    {
      title: 'Domain and data',
      description: 'Use a custom domain on eligible plans and export account data.',
      items: ['Domain setup requires DNS verification, hosting, and TLS', 'JSON export includes profiles, pages, blocks, and records', 'Uploaded media and raw analytics history are not included']
    }
  ];

  return (
    <section id="features" className="marketing-section border-y border-neutral-200 bg-neutral-50 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal distance="md" className="mb-8 max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">
            {isRtl ? 'ميزات المنصة' : 'Platform features'}
          </p>
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            {isRtl ? 'ما يمكنك إنشاؤه باستخدام RALOA' : 'What you can build with RALOA'}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
            {isRtl
              ? 'أنشئ صفحة عامة قابلة للتخصيص، مع أدوات للروابط والوسائط والاشتراكات.'
              : 'Create a customizable public page with tools for links, media, and newsletter signups.'}
          </p>
        </Reveal>

        <Reveal stagger className="grid grid-cols-1 gap-x-12 md:grid-cols-2">
          {groups.map((group, index) => (
            <article key={group.title} className="motion-card border-t border-neutral-300 py-5 text-start">
              <div className="mb-2 flex items-baseline gap-3">
                <span className="font-mono text-xs text-indigo-700">0{index + 1}</span>
                <h3 className="text-base font-semibold text-neutral-900">{group.title}</h3>
              </div>
              <p className="mb-3 text-sm leading-relaxed text-neutral-600">{group.description}</p>
              <ul className="space-y-1.5 text-sm text-neutral-700">
                {group.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          ))}
        </Reveal>

        <Reveal distance="sm" delay={80} className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-neutral-300 pt-5 sm:flex-row sm:items-center">
          <p className="text-sm text-neutral-600">
            {isRtl ? 'ابدأ بحساب مجاني وأنشئ صفحتك من الاستوديو.' : 'Start with a free account and create your page in Studio.'}
          </p>
          <button
            onClick={onOpenStudio}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            <span>{isRtl ? 'افتح الاستوديو' : 'Open Studio'}</span>
            <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        </Reveal>
      </div>
    </section>
  );
};
