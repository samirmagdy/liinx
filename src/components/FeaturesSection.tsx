import React from 'react';
import { motion } from 'framer-motion';
import { 
  FolderPlus, 
  Music, 
  Globe2, 
  BarChart2, 
  ArrowRight,
  Instagram
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface FeaturesSectionProps {
  onOpenStudio: () => void;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ onOpenStudio }) => {
  const { t, isRtl } = useLanguage();
  const b = t.builderSection;

  // Stagger variants for Apple-style entrance
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section id="features" className="marketing-section py-24 md:py-36">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16 text-start">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-mono font-bold mb-4 tracking-wider">
            <span>{b.badge}</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.04em] text-neutral-900 mb-4 text-balance">
            {b.title}
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl text-pretty">
            {b.subtitle}
          </p>
        </div>

        {/* Feature Cards Grid with staggered animation */}
<motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
          variants={cardVariants}
          animate="visible"
          transition={{
            type: "tween",
            ease: "cubic-bezier(0.4, 0, 0.2, 1)",
            staggerChildren: 0.1,
            delayChildren: 0.2,
          }}
        >
          
          {/* Feature 1: Accordion Folders */}
          <div animate="visible" className="md:col-span-2 p-8 rounded-3xl bg-neutral-50 border border-neutral-200 hover:border-neutral-400 hover:scale-[1.02] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] text-start">
            <div className="mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mb-4">
                <FolderPlus className="w-6 h-6 text-amber-800" />
              </div>
              <h3 className="font-brand font-bold text-xl sm:text-2xl text-neutral-900 mb-2 text-balance">
                {b.feature1Title}
              </h3>
              <p className="text-base text-neutral-600 max-w-xl text-pretty">
                {b.feature1Desc}
              </p>
            </div>

            {/* Illustrative example of folder content */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2 text-start">
              <div className="p-3 bg-neutral-50 rounded-xl flex items-center justify-between font-medium text-xs text-neutral-900">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-bold">
                    {isRtl ? 'مثال: جولة الحفلات الفنية' : 'Example: 2025 Tour Dates'}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-neutral-500 bg-neutral-100 dark:bg-neutral-900/10 px-2 py-0.5 rounded-full border border-neutral-200">
                  {isRtl ? 'محتوى توضيحي' : 'Example content'}
                </span>
              </div>
              <div className="px-3 py-1 space-y-1 text-xs text-neutral-600">
                <div className="flex justify-between py-1 border-b border-neutral-200">
                  <span>{isRtl ? 'برلين • مسرح كرافتفيرك' : 'Berlin • Kraftwerk Studio'}</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {isRtl ? 'عنصر داخل المجلد' : 'Folder item'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span>{isRtl ? 'طوكيو • ميوزيم فيجن' : 'Tokyo • Sound Museum Vision'}</span>
                  <span className="font-mono font-bold text-amber-800">
                    {isRtl ? 'عنصر داخل المجلد' : 'Folder item'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Custom Domains */}
          <div animate="visible" className="p-8 rounded-3xl bg-neutral-50 border border-neutral-200 hover:border-neutral-400 hover:scale-[1.02] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] text-start">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center mb-4">
                <Globe2 className="w-6 h-6 text-blue-800" />
              </div>
              <h3 className="font-brand font-bold text-xl text-neutral-900 mb-2">
                {b.feature2Title}
              </h3>
              <p className="text-base text-neutral-600">
                {b.feature2Desc}
              </p>
            </div>
            <div className="mt-6 p-3 bg-neutral-50 border border-neutral-200 rounded-xl font-mono text-xs text-center text-neutral-900 font-bold" dir="ltr">
              links.yourdomain.com
            </div>
          </div>

          {/* Feature 3: Playable Media Embeds */}
          <div animate="visible" className="p-8 rounded-3xl bg-neutral-50 border border-neutral-200 hover:border-neutral-400 hover:scale-[1.02] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] text-start">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center mb-4">
                <Music className="w-6 h-6 text-emerald-800" />
              </div>
              <h3 className="font-brand font-bold text-xl text-neutral-900 mb-2">
                {b.feature3Title}
              </h3>
              <p className="text-base text-neutral-600">
                {b.feature3Desc}
              </p>
            </div>
            <div className="mt-6 p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold shrink-0">
                ▶
              </div>
              <div className="text-xs">
                <p className="font-bold text-neutral-900">
                  {isRtl ? 'إصدار منتصف الليل' : 'Midnight Transmission'}
                </p>
                <p className="text-[11px] text-neutral-500">
                  {isRtl ? 'مشغل مقطع صوتي سبوتيفاي' : 'Spotify Audio Player'}
                </p>
              </div>
            </div>
          </div>

          {/* Feature 4: Instagram Caption Sync */}
          <div animate="visible" className="p-8 rounded-3xl bg-neutral-50 border border-neutral-200 hover:border-neutral-400 hover:scale-[1.02] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] text-start">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-900 flex items-center justify-center mb-4">
                <Instagram className="w-6 h-6 text-rose-800" />
              </div>
              <h3 className="font-brand font-bold text-xl text-neutral-900 mb-2 text-balance">
                {b.feature4Title}
              </h3>
              <p className="text-base text-neutral-600 text-pretty">
                {b.feature4Desc}
              </p>
            </div>
            <div className="mt-6 text-xs font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-900/10 p-2.5 rounded-xl border border-neutral-200">
              {isRtl ? 'المزامنة: ' : 'Sync status: '}
              <span className="text-neutral-700 font-bold">
                {isRtl ? 'تتطلب ربط الحساب والصلاحيات' : 'Requires account connection and permissions'}
              </span>
            </div>
          </div>

          {/* Feature 5: Privacy-Friendly Analytics */}
          <div animate="visible" className="p-8 rounded-3xl bg-neutral-50 border border-neutral-400 hover:border-neutral-400 hover:scale-[1.02] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] text-start">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center mb-4">
                <BarChart2 className="w-6 h-6 text-purple-800" />
              </div>
              <h3 className="font-brand font-bold text-xl text-neutral-900 mb-2">
                {b.feature5Title}
              </h3>
              <p className="text-base text-neutral-600">
                {b.feature5Desc}
              </p>
            </div>
            <div className="mt-6 text-xs font-mono bg-neutral-100 dark:bg-neutral-900/10 p-2.5 rounded-xl border border-neutral-200">
              <span className="font-bold text-neutral-700">
                {isRtl ? 'تظهر البيانات الحقيقية في الاستوديو بعد الزيارات والنقرات' : 'Real data appears in Studio after visits and clicks'}
              </span>
            </div>
          </div>

        </motion.div>

        <div className="mb-16 rounded-3xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
          <div className="mb-6">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-amber-700">{isRtl ? 'كيف تبدأ' : 'How it works'}</p>
            <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold text-neutral-900">{isRtl ? 'من الحساب إلى الصفحة المنشورة في ثلاث خطوات.' : 'From account to published page in three steps.'}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { n: '01', title: isRtl ? 'احجز اسمك' : 'Claim your handle', text: isRtl ? 'أنشئ حساباً مجانياً واحصل على رابط liinx.app/@اسمك.' : 'Create a free account and get a liinx.app/@yourname link.' },
              { n: '02', title: isRtl ? 'أضف المحتوى' : 'Add your content', text: isRtl ? 'أضف الروابط والوسائط والنشرة أو رابط Calendly.' : 'Add links, supported media, a newsletter form, or a Calendly link.' },
              { n: '03', title: isRtl ? 'انشر وعاين' : 'Publish and preview', text: isRtl ? 'عاين صفحتك في الاستوديو ثم شاركها، وأضف نطاقاً مخصصاً على خطة مدفوعة.' : 'Preview in Studio, share your page, and add a custom domain on a paid plan.' }
            ].map(step => (
              <div key={step.n} className="rounded-2xl border border-neutral-200 bg-white p-5">
                <span className="font-mono text-xs font-bold text-amber-700">{step.n}</span>
                <h4 className="mt-3 font-bold text-base text-neutral-900">{step.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA bar */}
        <div className="p-8 sm:p-12 rounded-3xl bg-neutral-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 text-start">
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-balance">
              {b.ctaBarTitle}
            </h3>
            <p className="text-sm text-neutral-400">
              {b.ctaBarDesc}
            </p>
          </div>
          <button
            onClick={onOpenStudio}
            className="px-6 py-3.5 rounded-full bg-neutral-100 text-neutral-900 text-sm font-bold hover:bg-neutral-200 transition-colors active:scale-95 shrink-0 flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-2"
          >
            <span>{b.cta}</span>
            <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        </div>

      </div>
    </section>
  );
};
