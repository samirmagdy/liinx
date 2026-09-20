import React, { useState } from 'react';
import { 
  Palette,
  Layers,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Calendar,
  Download,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Reveal } from './motion/Reveal';

interface FeaturesSectionProps {
  onOpenStudio: () => void;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ onOpenStudio }) => {
  const { isRtl } = useLanguage();
  const [activePillar, setActivePillar] = useState<'design' | 'publish' | 'grow' | 'own'>('design');

  const pillars = [
    {
      id: 'design' as const,
      tag: '01',
      title: isRtl ? 'تصميم فائق الدقة' : 'Design First',
      desc: isRtl 
        ? 'خطوط متناسقة، مسافات بصرية مدروسة، وتحكم كامل في الألوان والأناقة.'
        : 'Editorial typography pairings, optical balance, custom themes, and bespoke CSS control.',
      icon: Palette,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
      highlights: [
        isRtl ? 'اقتران الخطوط العصرية (Inter، Playfair، JetBrains Mono)' : 'Curated typography pairings with Google Fonts',
        isRtl ? 'تحكم كامل في هوامش البطاقات وزوايا التدوير' : 'Micro-layout adjustments (radii, borders, glass effects)',
        isRtl ? 'دعم كود CSS المخصص للمصممين المحترفين' : 'Custom CSS injection for bespoke branding',
        isRtl ? 'سمات متكيفة مع الوضع الداكن والفاتح تلقائياً' : 'Automatic contrast validation for web accessibility'
      ]
    },
    {
      id: 'publish' as const,
      tag: '02',
      title: isRtl ? 'نشر متعدد الوسائط' : 'Publish Anything',
      desc: isRtl 
        ? 'ليست مجرد روابط؛ صفحة تفاعلية حية تضم مشغلات صوت، فيديوهات، وحجوزات.'
        : 'A living publication with multi-page subpages, playable audio, video embeds, and booking.',
      icon: Layers,
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-200',
      highlights: [
        isRtl ? 'مجلدات قابلة للطي لتنظيم الروابط المتعددة' : 'Collapsible accordion folders to declutter your page',
        isRtl ? 'مشغلات مدمجة لـ Spotify و YouTube و SoundCloud' : 'Inline audio and video players with no external redirects',
        isRtl ? 'دمج مباشر لتقويم Calendly لحجز المواعيد' : 'Seamless Calendly integration for instant client calls',
        isRtl ? 'صفحات فرعية متعددة (Multi-page routing)' : 'Multi-page routing with unique shareable URLs'
      ]
    },
    {
      id: 'grow' as const,
      tag: '03',
      title: isRtl ? 'تنمية الجمهور' : 'Grow Audience',
      desc: isRtl 
        ? 'احصل على تحليل زيارات فوري يحترم الخصوصية واجمع المشتركين في نشرتك.'
        : 'Page analytics, UTM attribution, and newsletter signup collection.',
      icon: TrendingUp,
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
      highlights: [
        isRtl ? 'إحصاءات زيارات ونقرات دقيقة بدون كوكيز متطفلة' : 'Cookie-free real-time analytics for visits and clicks',
        isRtl ? 'تتبع مصادر الزيارات وحملات UTM بدقة' : 'Full UTM campaign tracking and referrer breakdowns',
        isRtl ? 'نموذج جمع مشتركين في النشرة البريدية بدون وسيط' : 'Embedded email newsletter subscriber collection',
        isRtl ? 'لا تعالج ليينكس مدفوعات المبيعات' : 'Liinx does not process sales payments'
      ]
    },
    {
      id: 'own' as const,
      tag: '04',
      title: isRtl ? 'بياناتك وهويتك الرقمية' : 'Your Data & Digital Identity',
      desc: isRtl 
        ? 'اربط نطاقاً مؤهلاً، وصدّر بيانات حسابك ومشتركيك وردود النماذج، واستخدم REST API.'
        : 'Connect a custom domain on an eligible plan, export your account data and CSV records, and use the REST API.',
      icon: ShieldCheck,
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-200',
      highlights: [
        isRtl ? 'ربط نطاق خاص (links.yourname.com) مع توجيه DNS وتشفير HTTPS بعد إعداد الاستضافة' : 'Custom domain support with secure HTTPS after hosting configuration',
        isRtl ? 'تصدير المشتركين وردود النماذج إلى CSV بنقرة واحدة' : 'Export subscribers and form responses to CSV',
        isRtl ? 'تصدير JSON لبيانات الحساب والملفات والصفحات والعناصر والمشتركين والردود، دون ملفات وسائط أو سجل تحليلات خام' : 'JSON export of account details, profiles, pages, blocks, subscribers, and form responses; excludes uploads and raw analytics',
        isRtl ? 'واجهة REST API v1 لقراءة بيانات الملف وإدارة كتل الروابط' : 'REST API v1 to read profile data and manage link blocks',
      ]
    }
  ];

  return (
    <section id="features" className="marketing-section py-12 md:py-16 bg-neutral-50/50 border-t border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <Reveal distance="md" className="max-w-3xl mb-8 text-start">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-mono font-bold mb-4 tracking-wider">
              <span>{isRtl ? 'الأعمدة الأربعة لنظام لينكس' : 'THE 4 PILLARS OF LIINX'}</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.04em] text-neutral-900 mb-4 text-balance">
              {isRtl ? 'مبني للمبدعين الذين يرفضون القوائم التقليدية.' : 'Engineered for creators who outgrew basic link lists.'}
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl text-pretty">
              {isRtl 
                ? 'نظام متكامل يجمع بين رقي التصميم المعماري، حرية التحرير، وقوة الاستقلال البرمجي التام.'
                : 'Every layer of Liinx is built to give your online presence the gravitas of an architectural portfolio, with the engineering freedom of an open platform.'}
            </p>
          </div>
        </Reveal>

        {/* 4 Pillars Interactive Tabs / Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {pillars.map((p) => {
            const Icon = p.icon;
            const isSelected = activePillar === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePillar(p.id)}
                className={`p-4 sm:p-5 rounded-2xl border text-start transition-all duration-200 cursor-pointer ${
                  isSelected 
                    ? 'bg-white border-neutral-900 shadow-md ring-1 ring-neutral-900/10' 
                    : 'bg-white/60 border-neutral-200/80 hover:bg-white hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-bold text-neutral-400">{p.tag}</span>
                </div>
                <div className="font-brand font-bold text-sm sm:text-base text-neutral-900 mb-1">
                  {p.title}
                </div>
                <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                  {p.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Active Pillar Deep Dive Showcase */}
        {(() => {
          const current = pillars.find(p => p.id === activePillar) || pillars[0];
          const CurrentIcon = current.icon;

          return (
            <div className="mb-10 rounded-3xl bg-white border border-neutral-200/80 p-6 sm:p-8 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                
                <div className="lg:col-span-7 space-y-6 text-start">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold border bg-neutral-50 border-neutral-200 text-neutral-800">
                    <CurrentIcon className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pillar {current.tag} • {current.title}</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                    {current.desc}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                    {current.highlights.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-700 leading-relaxed bg-neutral-50/80 p-3 rounded-xl border border-neutral-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="font-medium">{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={onOpenStudio}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      <span>{isRtl ? 'جرب هذا في الاستوديو' : 'Test this capability in Studio'}</span>
                      <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Visual Demonstration of the Pillar */}
                <div className="lg:col-span-5 bg-neutral-900 rounded-2xl p-6 text-white text-start font-mono text-xs border border-neutral-800">
                  {current.id === 'design' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-neutral-800 text-neutral-400">
                        <span>theme_config.json</span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">Active</span>
                      </div>
                      <div className="text-[11px] leading-relaxed text-neutral-300">
                        <p className="text-neutral-500">{'// Optical balance & typography'}</p>
                        <p><span className="text-amber-400">"fontFamily"</span>: <span className="text-emerald-400">"Playfair Display"</span>,</p>
                        <p><span className="text-amber-400">"cardRadius"</span>: <span className="text-blue-400">"16px"</span>,</p>
                        <p><span className="text-amber-400">"glassmorphism"</span>: <span className="text-purple-400">true</span>,</p>
                        <p><span className="text-amber-400">"contrastRatio"</span>: <span className="text-emerald-400">"14.2:1 (AAA)"</span></p>
                      </div>
                      <div className="p-3 bg-neutral-800/80 rounded-xl text-[11px] text-neutral-300 font-sans flex items-center justify-between">
                        <span>Elena Rostova • Portfolio Theme</span>
                        <span className="text-[10px] text-amber-400 font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">{isRtl ? 'ملف تجريبي' : 'Demo Profile'}</span>
                      </div>
                    </div>
                  )}

                  {current.id === 'publish' && (
                    <div className="space-y-3 font-sans">
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-800 font-mono text-[11px] text-neutral-400">
                        <span>interactive_blocks</span>
                        <span className="text-emerald-400 text-[10px]">4 Ready</span>
                      </div>
                      <div className="p-3 bg-neutral-800/90 rounded-xl flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">▶</div>
                        <div className="text-xs">
                          <p className="font-bold text-white">Midnight Transmission</p>
                          <p className="text-[10px] text-neutral-400 font-mono">Spotify Audio • In-page play</p>
                        </div>
                      </div>
                      <div className="p-3 bg-neutral-800/90 rounded-xl flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                          <Calendar className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="text-xs">
                          <p className="font-bold text-white">Book 30-min Strategy Session</p>
                          <p className="text-[10px] text-neutral-400 font-mono">Calendly Embed • 0 redirect</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {current.id === 'grow' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-neutral-400 font-mono text-[11px]">
                        <div className="flex items-center gap-2">
                          <span>traffic_intel</span>
                          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                            {isRtl ? 'بيانات توضيحية' : 'Sample data'}
                          </span>
                        </div>
                        <span className="text-emerald-400 text-[10px]">{isRtl ? 'تحليلات الطرف الأول' : 'First-Party Only'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-neutral-800/90 rounded-xl">
                          <p className="text-[10px] text-neutral-400">Total Visits (7d)</p>
                          <p className="text-lg font-bold text-white font-mono mt-0.5">14,820</p>
                          <p className="text-[10px] text-emerald-400 font-mono mt-1">+18.4% vs last week</p>
                        </div>
                        <div className="p-3 bg-neutral-800/90 rounded-xl">
                          <p className="text-[10px] text-neutral-400">Payment handling</p>
                          <p className="text-sm font-bold text-amber-400 mt-1">External provider</p>
                          <p className="text-[10px] text-neutral-400 font-mono mt-1">Liinx does not process payments</p>
                        </div>
                      </div>
                      <div className="p-2.5 bg-neutral-800/60 rounded-xl text-[10px] text-neutral-400 font-mono space-y-1">
                        <p>{isRtl ? 'تحليلات Liinx للطرف الأول خالية تماماً من ملفات تعريف الارتباط' : 'Liinx first-party analytics are cookie-free'}</p>
                        <p className="text-neutral-500">{isRtl ? 'يمكن لصاحب الصفحة تفعيل تحليلات اختيارية من أطراف ثالثة مثل GA4 و Meta Pixel' : 'Optional third-party analytics such as GA4 and Meta Pixel can be enabled by the creator.'}</p>
                      </div>
                    </div>
                  )}

                  {current.id === 'own' && (
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-neutral-400 text-[11px]">
                        <span>portability_engine</span>
                        <span className="text-emerald-400 text-[10px]">JSON + CSV exports</span>
                      </div>
                      <div className="p-2.5 bg-neutral-800 rounded-xl text-[11px] text-neutral-300">
                        <span className="text-amber-400">GET</span> /api/v1/profiles/me
                      </div>
                      <div className="p-2.5 bg-neutral-800 rounded-xl text-[11px] text-neutral-300">
                        <span className="text-blue-400">CNAME</span> links → cname.liinx.app
                      </div>
                      <div className="p-2.5 bg-neutral-800 rounded-xl text-[11px] text-neutral-300 flex items-center justify-between">
                        <span>export_subscribers.csv</span>
                        <Download className="w-3.5 h-3.5 text-neutral-400" />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })()}

        {/* 3 Steps: From account to published page */}
        <div className="mb-10 rounded-3xl border border-neutral-200 bg-white p-5 sm:p-6">
          <div className="mb-6 text-start">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-amber-700">{isRtl ? 'كيف تبدأ' : 'Fast onboarding'}</p>
            <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold text-neutral-900">{isRtl ? 'من الحساب إلى الصفحة المنشورة في ثلاث خطوات.' : 'From account to published mini website in three steps.'}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-start">
            {[
              { n: '01', title: isRtl ? 'احجز اسمك' : 'Claim your handle', text: isRtl ? 'أنشئ حساباً مجانياً واحصل على رابط liinx.app/@اسمك.' : 'Create a free account and lock your liinx.app/@yourname handle.' },
              { n: '02', title: isRtl ? 'أضف المحتوى والألوان' : 'Add blocks & styling', text: isRtl ? 'أضف الروابط والوسائط والنشرة أو رابط Calendly.' : 'Select an editorial theme, add links, media players, and booking blocks.' },
              { n: '03', title: isRtl ? 'انشر وعاين أو اربط نطاقك' : 'Publish & connect domain', text: isRtl ? 'عاين صفحتك في الاستوديو ثم شاركها، وأضف نطاقاً مخصصاً على خطة مدفوعة.' : 'Publish instantly and share your page, and attach your custom domain whenever ready.' }
            ].map(step => (
              <div key={step.n} className="rounded-2xl border border-neutral-100 bg-neutral-50/70 p-5">
                <span className="font-mono text-xs font-bold text-amber-700">{step.n}</span>
                <h4 className="mt-3 font-bold text-base text-neutral-900">{step.title}</h4>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA bar */}
        <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 text-start">
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-balance">
              {isRtl ? 'جاهز لامتلاك واجهتك الرقمية الحقيقية؟' : 'Ready to upgrade from a plain link list?'}
            </h3>
            <p className="text-sm text-neutral-400">
              {isRtl ? 'ابدأ مجاناً اليوم، وانشر صفحتك خلال دقائق معدودة.' : 'Create your design-first mini website in minutes. Zero credit card required.'}
            </p>
          </div>
          <button
            onClick={onOpenStudio}
            className="px-6 py-3.5 rounded-full bg-neutral-100 text-neutral-900 text-sm font-bold hover:bg-neutral-200 transition-colors active:scale-95 shrink-0 flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-2"
          >
            <span>{isRtl ? 'ابدأ في الاستوديو' : 'Open Studio'}</span>
            <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        </div>

      </div>
    </section>
  );
};
