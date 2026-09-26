import React from 'react';
import { useLocation } from 'wouter';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ComparisonSection } from '../components/ComparisonSection';
import { useLanguage, useLanguage as useUiLanguage } from '../context/LanguageContext';
import { 
  Layers, 
  Globe2, 
  BarChart3, 
  ArrowRight,
  Palette,
  CheckCircle2,
  Download
} from 'lucide-react';

function getFeaturePillars(isRtl: boolean) {
  return isRtl ? [
    {
      icon: <Layers className="w-6 h-6 text-indigo-600" />,
      title: "انشر",
      description: "أضف روابط ووسائط مدعومة ومجلدات ونماذج اشتراك إلى صفحتك.",
      bullets: [
        "مشغلات صوتية مع معاينة سبوتيفاي",
        "تشغيل كامل لفيديوهات يوتيوب وفيميو",
        "مجلدات مجمعة وقابلة للطي",
        "نماذج اشتراك مباشر في النشرة البريدية"
      ]
    },
    {
      icon: <Palette className="w-6 h-6 text-indigo-600" />,
      title: "قدّم عملك",
      description: "اختر سمة وعدّل مظهر صفحتك، مع CSS وخطوط ويب مخصصة في الخطط المؤهلة.",
      bullets: [
        "سمات جاهزة",
        "CSS مخصص في الخطط المؤهلة",
        "روابط لخطوط ويب مخصصة"
      ]
    },
    {
      icon: <Globe2 className="w-6 h-6 text-indigo-600" />,
      title: "امتلك وجهتك",
      description: "اربط نطاقاً فرعياً بعد التحقق من DNS وإعداد الاستضافة وTLS.",
      bullets: [
        "التحقق من DNS",
        "إزالة شعار RALOA في الخطط المؤهلة",
        "نطاق مخصص لكل ملف مؤهل"
      ]
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-indigo-600" />,
      title: "قس ما يهم",
      description: "راجع زيارات الصفحة ونقرات الروابط ومصادر الإحالة وبيانات حملات UTM.",
      bullets: [
        "مشاهدات الصفحة ونقرات الروابط اليومية",
        "تقارير مصادر الإحالة وUTM",
        "مخططات نشاط لسبعة أيام"
      ]
    },
    {
      icon: <Download className="w-6 h-6 text-indigo-600" />,
      title: "احفظ جمهورك",
      description: "نزّل ملف JSON يتضمن بيانات الحساب والملفات الشخصية والصفحات والعناصر ومشتركي النشرة وردود النماذج. لا يتضمن ملفات الوسائط نفسها أو سجل التحليلات الخام.",
      bullets: ["بيانات الحساب والملفات والصفحات والعناصر", "سجلات المشتركين وردود النماذج", "ملفات الوسائط وسجل التحليلات الخام غير مضمنين"]
    }
  ] : [
    {
      icon: <Layers className="w-6 h-6 text-indigo-600" />,
      title: "Publish",
      description: "Add links, supported media embeds, folders, and newsletter signup forms to your page.",
      bullets: ["Audio players with supported provider embeds", "YouTube and Vimeo embeds", "Collapsible multi-item folders", "Newsletter subscription forms"]
    },
    {
      icon: <Palette className="w-6 h-6 text-indigo-600" />,
      title: "Present your work",
      description: "Choose a theme and adjust the typography and appearance of your public page.",
      bullets: ["Theme presets", "Custom CSS on eligible plans", "Custom web font links"]
    },
    {
      icon: <Globe2 className="w-6 h-6 text-indigo-600" />,
      title: "Own the destination",
      description: "Connect a subdomain after DNS verification and hosting and TLS configuration.",
      bullets: ["DNS verification", "Remove RALOA branding on eligible plans", "Custom domain support per eligible profile"]
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-indigo-600" />,
      title: "Measure what matters",
      description: "Review page visits, link clicks, referral sources, and UTM campaign data.",
      bullets: ["Daily page views and link clicks", "Referrer and UTM reporting", "Seven-day activity charts"]
    },
    {
      icon: <Download className="w-6 h-6 text-indigo-600" />,
      title: "Keep your audience",
      description: "Download a JSON file with account metadata, profiles, pages, blocks, newsletter subscribers, and form submissions. Uploaded file binaries and raw analytics history are not included.",
      bullets: ["Account metadata, profiles, pages, and blocks", "Newsletter subscribers and form submissions", "Uploaded files and raw analytics history are not included"]
    }
  ];
}

export function FeaturesPage() {
  const { tr: ui } = useUiLanguage();
  const [, setLocation] = useLocation();
  const { isRtl } = useLanguage();

  const featurePillars = getFeaturePillars(isRtl);

  return (
    <div className="marketing-shell marketing-features-page min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar activeView="features" />
      <main id="main-content" tabIndex={-1} className="flex-1">
        {/* Hero Header */}
        <section className="raloa-editorial-hero max-w-6xl mx-auto px-6 pt-16 pb-12 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">{ui('Platform features')}</p>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-neutral-900 max-w-3xl leading-[1.02]">
            <>
              {ui('Create one page for your work.')}<br className="hidden sm:inline" />
              <span className="block text-neutral-500">{ui('Links, media, and bookings.')}</span>
            </>
          </h1>
          <p className="text-base text-neutral-600 max-w-2xl leading-relaxed">
            {ui('Build a customizable page for your links, media, bookings, and newsletter.')}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 items-start">
            <button
              onClick={() => setLocation('/register')}
              className="w-full sm:w-auto px-5 py-3 rounded-lg bg-neutral-900 text-white font-semibold text-sm hover:bg-black transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{ui('Build your site')}</span>
              <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={() => setLocation('/templates')}
              className="w-full sm:w-auto px-5 py-3 rounded-lg border border-neutral-300 text-neutral-800 font-semibold text-sm hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              {ui('Explore templates')}
            </button>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="raloa-feature-journeys max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
            {featurePillars.map((feature, idx) => (
              <div
                key={idx}
                className="py-6 border-t border-neutral-200 space-y-3 text-start"
              >
                <div className="flex items-center gap-3">
                  <span className="text-indigo-700">{feature.icon}</span>
                  <h2 className="text-lg font-semibold text-neutral-900">{feature.title}</h2>
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed">{feature.description}</p>
                <ul className="space-y-2 pt-2">
                  {feature.bullets.map((b, bIdx) => (
                    <li key={bIdx} className="flex items-center gap-2.5 text-sm text-neutral-700">
                      <CheckCircle2 className="w-4 h-4 text-indigo-700 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Direct Comparison Matrix */}
        <ComparisonSection />
      </main>
      <Footer onSelectView={(v) => {
        if (v === 'home') setLocation('/');
        else if (v === 'builder') setLocation('/studio');
        else if (v === 'templates') setLocation('/templates');
        else if (v === 'pricing') setLocation('/pricing');
      }} />
    </div>
  );
}
