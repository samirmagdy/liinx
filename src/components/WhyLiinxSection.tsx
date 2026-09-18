import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  Layers, 
  Code2, 
  FileSpreadsheet, 
  Terminal, 
  ShieldCheck, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Reveal } from './motion/Reveal';
import { useLocation } from 'wouter';

export const WhyLiinxSection: React.FC = () => {
  const { lang, isRtl } = useLanguage();
  const ar = lang === 'ar';
  const [, setLocation] = useLocation();

  const engineeringCapabilities = [
    {
      icon: <Layers className="w-6 h-6 text-amber-600" />,
      outcome: ar ? 'موقع مصغر متعدد الصفحات' : 'Multi-Page Architecture',
      feature: ar ? 'صفحات فرعية حقيقية (مثل /about أو /portfolio)' : 'Sub-pages with real routes (e.g. /portfolio, /press)',
      description: ar
        ? 'حوّل الرابط الواحد إلى موقع متكامل منظم بروابط فرعية مستقلة، بدلاً من إجبار زوارك على التمرير اللانهائي.'
        : 'Organize deep content into distinct sub-pages with clean URLs instead of overwhelming visitors with an endless single scroll.'
    },
    {
      icon: <Terminal className="w-6 h-6 text-blue-600" />,
      outcome: ar ? 'واجهة برمجية REST API مفتوحة' : 'Public REST API & Automation',
      feature: ar ? 'مفاتيح API في خطة الاستوديو لتحديث الروابط برمجياً' : 'Headless API access to publish and sync links programmatically',
      description: ar
        ? 'حدّث روابطك وقوائمك تلقائياً من نظام إدارة المحتوى (CMS) الخاص بك أو مسارات العمل المؤتمتة.'
        : 'Automate link updates, sync new products, or integrate your bio directly into your existing CMS and deployment pipeline.'
    },
    {
      icon: <Code2 className="w-6 h-6 text-purple-600" />,
      outcome: ar ? 'سيادة تامة على الهوية البصرية' : 'Custom CSS & Web Fonts',
      feature: ar ? 'تخصيص كامل للألوان والخطوط مع CSS مخصص' : 'Bespoke Google Fonts stylesheet injection & scoped CSS',
      description: ar
        ? 'تحرر من القوالب الجاهزة المحدودة؛ خصص الأزرار والظلال والتدرجات لتطابق علامتك التجارية بدقة البكسل.'
        : 'Break free from generic templates. Inject Google Fonts and write scoped CSS for absolute pixel-perfect brand alignment.'
    },
    {
      icon: <FileSpreadsheet className="w-6 h-6 text-emerald-600" />,
      outcome: ar ? 'ملكية مطلقة لجمهورك' : 'Portable Audience Data (CSV)',
      feature: ar ? 'تصدير المشتركين بنقرة واحدة بدون شروط' : 'Direct subscriber export to CSV with 0% platform cuts',
      description: ar
        ? 'بيانات المشتركين في نشرتك البريدية ملكك وحدك. صدّرها في أي وقت وانقلها لأي مزود بريد تريده.'
        : 'Your newsletter subscribers belong to you. Export CSV files anytime and import them directly into Mailchimp, ConvertKit, or Beehiiv.'
    }
  ];

  return (
    <section id="why-liinx" className="marketing-section py-12 md:py-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-200 bg-white">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <Reveal distance="md" className="text-center max-w-3xl mx-auto mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-mono font-bold text-neutral-800 mb-3 tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{ar ? 'هندسة فائقة الدقة' : 'Engineered for Craft'}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 mb-4 text-balance">
              {ar ? 'لماذا صُمم ليينكس للمبدعين المحترفين؟' : 'Advanced capabilities translated into creator superpowers'}
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed text-pretty">
              {ar
                ? 'خلف التصميم الأنيق محرك تقني صلب يمنحك الاستقلالية والمرونة والتحكم الكامل في حضورك الرقمي.'
                : 'Behind the minimalist interface lies serious engineering designed to give you sovereignty, automation, and complete control.'}
            </p>
          </div>
        </Reveal>

        {/* 4 Pillars Grid */}
        <Reveal stagger>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-8">
            {engineeringCapabilities.map((item, idx) => (
              <div
                key={idx}
                className="motion-card p-6 sm:p-7 rounded-3xl bg-neutral-50/80 border border-neutral-200 hover:border-neutral-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center shadow-xs">
                      {item.icon}
                    </div>
                    <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-neutral-200/60 text-neutral-700">
                      {item.feature}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">
                    {item.outcome}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Ownership Commitment Card (Issue #25) */}
        <div className="rounded-3xl bg-[#111315] text-white p-6 sm:p-8 border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6 text-start">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800 text-amber-400 text-xs font-mono font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{ar ? 'مبدأ السيادة الرقمية' : 'The Ownership Commitment'}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {ar ? 'جمهورك، نطاقك، بياناتك.' : 'Your audience. Your domain. Your data.'}
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              {ar
                ? 'لا قيود على المنصة، لا عمولات خفية على المبيعات، ولا احتجاز لقائمتك البريدية. ليينكس أداة لتمكين استقلاليتك الرقمية.'
                : 'No vendor lock-in, zero transaction cuts on bookings, and instant export of every subscriber. Liinx is built to empower creator sovereignty.'}
            </p>
          </div>
          <button
            onClick={() => setLocation('/register')}
            className="px-6 py-3.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-900 text-xs font-bold transition-colors shrink-0 flex items-center gap-2 cursor-pointer shadow-md"
          >
            <span>{ar ? 'ابدأ الآن مجاناً' : 'Create your page free'}</span>
            <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        </div>

      </div>
    </section>
  );
};
