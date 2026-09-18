import React from 'react';
import { useLocation } from 'wouter';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ComparisonSection } from '../components/ComparisonSection';
import { useLanguage, useLanguage as useUiLanguage } from '../context/LanguageContext';
import { 
  Sparkles, 
  Layers, 
  Globe2, 
  BarChart3, 
  ArrowRight,
  Palette,
  CheckCircle2
} from 'lucide-react';

export function FeaturesPage() {
  const { tr: ui } = useUiLanguage();
  const [, setLocation] = useLocation();
  const { isRtl } = useLanguage();

  const featurePillars = isRtl ? [
    {
      icon: <Layers className="w-6 h-6 text-amber-600" />,
      title: "بنية عناصر قابلة للتوسّع",
      description: "لا تكتفِ بمجرد مشاركة روابط. ابنِ حضوراً تفاعلياً غنياً بوسائط مدعومة، ومجلدات قابلة للطي، ونماذج اشتراك مباشر.",
      bullets: [
        "مشغلات صوتية مع معاينة سبوتيفاي",
        "تشغيل كامل لفيديوهات يوتيوب وفيميو",
        "مجلدات مجمعة وقابلة للطي",
        "نماذج اشتراك مباشر في النشرة البريدية"
      ]
    },
    {
      icon: <Palette className="w-6 h-6 text-amber-600" />,
      title: "نظام تصميم تحريري فاخر",
      description: "صُمم خصيصاً للمبدعين والمصورين والاستوديوهات التي ترفض القوالب المكررة. خطوط متناسقة وألوان معاصرة.",
      bullets: [
        "خطوط راقية تدعم العربية والإنجليزية ببراعة",
        "سمات حجرية وداكنة مصممة بأناقة",
        "دعم كامل لأكواد CSS المخصصة",
        "إمكانية ربط ورفع خطوط ويب خارجية"
      ]
    },
    {
      icon: <Globe2 className="w-6 h-6 text-amber-600" />,
      title: "نطاقات مخصصة",
      description: "اربط links.yourbrand.com أو نطاقاً فرعياً بعد إضافة سجل DNS وإعداد الاستضافة وTLS.",
      bullets: [
        "تحقق تلقائي من سجلات CNAME",
        "إزالة شعار Liinx في الخطط المؤهلة",
        "دعم ملفات متعددة تحت حساب واحد",
        "ربط النطاقات الرئيسية والفرعية"
      ]
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-amber-600" />,
      title: "تحليلات لدعم اتخاذ القرار",
      description: "استبدل الأرقام التقديرية ببيانات حقيقية: اعرف الروابط الأكثر تحويلاً، مصادر الزيارات، وحملات UTM بدقة.",
      bullets: [
        "صفر بيانات وهمية أو أرقام مضخمة",
        "تجميع آمن ومشفر يحفظ خصوصية الزوار",
        "تتبع مصادر وحملات UTM بدقة",
        "مخططات تفاعل يومية للمشاهدات والنقرات لـ ٧ أيام"
      ]
    }
  ] : [
    {
      icon: <Layers className="w-6 h-6 text-amber-600" />,
      title: "Extensible Block Architecture",
      description: "Don't just share links. Build rich interactive pages with supported media embeds, expandable folders, contact forms, and newsletter capture.",
      bullets: ["Audio players with supported provider embeds", "YouTube and Vimeo embeds", "Collapsible multi-item folders", "Newsletter subscription forms"]
    },
    {
      icon: <Palette className="w-6 h-6 text-amber-600" />,
      title: "Editorial Design System",
      description: "Crafted specifically for artists, photographers, and studios who refuse to accept cookie-cutter link buttons. Curated typography pairings and bespoke themes.",
      bullets: ["Syne, Plus Jakarta Sans & JetBrains Mono typography", "Light & dark architectural stone & obsidian themes", "Custom CSS support for pixel-perfect adjustments", "Custom font web-link injection"]
    },
    {
      icon: <Globe2 className="w-6 h-6 text-amber-600" />,
      title: "Custom domains",
      description: "Connect links.yourbrand.com or a subdomain after DNS verification and hosting configuration.",
      bullets: ["DNS CNAME verification", "Remove Liinx branding on eligible plans", "Multiple profiles under one account", "Apex and subdomain mapping"]
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-amber-600" />,
      title: "Decision-Support Analytics",
      description: "Replace vanity numbers with actionable data: understand your top-performing links, traffic sources, UTM campaigns, and click-through rates.",
      bullets: ["Zero data fabrication or inflated counts", "Hashed, privacy-preserving IP aggregation", "UTM source, medium, and campaign tracking", "7-day daily view and click timeline charts"]
    }
  ];

  return (
    <div className="marketing-shell min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar activeView="features" />
      <main className="flex-1">
        {/* Hero Header */}
        <section className="max-w-5xl mx-auto px-6 pt-10 pb-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{isRtl ? 'صفحة واحدة لكل ما تشاركه' : 'One page for everything you share'}</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 max-w-3xl mx-auto leading-tight">
            {isRtl ? (
              <>
                كل ما يستحقه عملك وإبداعك. <br className="hidden sm:inline" />
                <span className="text-neutral-500">مدمج في منصة واحدة.</span>
              </>
            ) : (
              <>
                {ui("Everything your work deserves.")}<br className="hidden sm:inline" />
                <span className="block text-neutral-500">{ui("Built into one platform.")}</span>
              </>
            )}
          </h1>
          <p className="text-base sm:text-lg text-neutral-600 max-w-xl mx-auto leading-relaxed">
            {isRtl 
              ? 'أنشئ صفحة قابلة للتخصيص لروابطك ووسائطك وحجوزاتك وقائمتك البريدية.' 
              : 'Build a customizable page for your links, media, bookings, and newsletter.'}
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={() => setLocation('/register')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-neutral-900 text-white font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isRtl ? 'أنشئ موقعك المصغر' : 'Build your micro-site'}</span>
              <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={() => setLocation('/templates')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-neutral-300 text-neutral-800 font-semibold text-sm hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              {isRtl ? 'استكشف القوالب' : 'Explore Templates'}
            </button>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featurePillars.map((feature, idx) => (
              <div
                key={idx}
                className="p-8 rounded-3xl bg-neutral-50/80 border border-neutral-200 hover:border-neutral-300 transition-all space-y-4 text-start"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center shadow-xs">
                  {feature.icon}
                </div>
                <h2 className="text-xl font-bold text-neutral-900">{feature.title}</h2>
                <p className="text-sm text-neutral-600 leading-relaxed">{feature.description}</p>
                <ul className="space-y-2 pt-2">
                  {feature.bullets.map((b, bIdx) => (
                    <li key={bIdx} className="flex items-center gap-2.5 text-xs font-medium text-neutral-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
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
