import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  ExternalLink, 
  Lock, 
  Coins, 
  FileText
} from 'lucide-react';
import { Reveal } from './motion/Reveal';

export const TrustProofSection: React.FC = () => {
  const { lang } = useLanguage();
  const ar = lang === 'ar';

  const demoProfiles = [
    {
      username: 'elenarostova',
      name: 'Elena Rostova',
      role: ar ? 'مديرة فنية ومصورة معمارية' : 'Art Director & Architectural Photographer',
      theme: 'Editorial Stone',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
      features: ar ? 'معرض صور، مشغل صوتي، حجز استشارات' : 'Photo gallery, audio player, Calendly booking'
    },
    {
      username: 'marcusvance',
      name: 'Marcus Vance',
      role: ar ? 'منتج موسيقى إلكترونية وDJ' : 'Electronic Music Producer & Sound Designer',
      theme: 'Tokyo Neon',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
      features: ar ? 'مشغل سبوتيفاي مدمج، تواريخ الحفلات، متجر' : 'Spotify player embed, tour dates folder, merch'
    },
    {
      username: 'sarahchen',
      name: 'Sarah Chen',
      role: ar ? 'مصممة واجهات ومستشارة علامات تجارية' : 'Product Design Lead & Brand Strategist',
      theme: 'Minimal Monochrome',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300&auto=format&fit=crop',
      features: ar ? 'نطاق مخصص، نشرة بريدية، تصدير المشتركين' : 'Custom domain, newsletter form, case studies'
    }
  ];

  const trustGuarantees = [
    {
      icon: <Coins className="w-5 h-5 text-emerald-600" />,
      title: ar ? 'لا تعالج ليينكس مدفوعاتك' : 'Payments stay with your provider',
      description: ar
        ? 'لا تعالج ليينكس مدفوعات المبيعات أو الحجوزات. تُدار المدفوعات وأي رسوم عبر مزوّد الخدمة الخارجي.'
        : 'Liinx does not process sales or booking payments. Payment handling and any fees belong to the external provider.'
    },
    {
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      title: ar ? 'تصدير مشتركي النشرة' : 'Export newsletter subscribers',
      description: ar
        ? 'يمكنك تنزيل عناوين مشتركي النشرة البريدية بصيغة CSV من لوحة المشتركين.'
        : 'Download newsletter subscriber records as a CSV from the Subscribers panel.'
    },
    {
      icon: <Lock className="w-5 h-5 text-amber-600" />,
      title: ar ? 'إعداد النطاق المخصص' : 'Custom domain setup',
      description: ar
        ? 'تتطلب الخطط المؤهلة التحقق من DNS وإعداد الاستضافة وشهادة TLS.'
        : 'Eligible plans require DNS verification plus hosting and TLS configuration.'
    }
  ];

  return (
    <section id="proof" className="marketing-section py-12 md:py-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-200 bg-neutral-50">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <Reveal distance="md" className="text-center max-w-3xl mx-auto mb-8">
          <div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 mb-4 text-balance">
              {ar ? 'نماذج توضيحية تفاعلية يمكنك استكشافها' : 'Explore interactive sample pages'}
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed text-pretty">
              {ar
                ? 'هذه ملفات تعريف خيالية توضح بعض أنواع الصفحات التي يمكن إنشاؤها باستخدام Liinx؛ وليست حسابات عملاء.'
                : 'These fictional profiles demonstrate examples of pages you can build with Liinx. They are not customer accounts.'}
            </p>
          </div>
        </Reveal>

        {/* Fictional profile demos */}
        <Reveal stagger>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {demoProfiles.map((showcase) => (
              <div
                key={showcase.username}
                className="motion-card rounded-3xl bg-white border border-neutral-200 p-6 flex flex-col justify-between hover:border-neutral-300 shadow-xs transition-all"
              >
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                      {ar ? 'نموذج خيالي' : 'Fictional sample'}
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400">
                      @{showcase.username}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5 mb-4">
                    <img
                      src={showcase.avatar}
                      alt={showcase.name}
                      className="w-13 h-13 rounded-2xl object-cover ring-2 ring-neutral-100"
                    />
                    <div>
                      <h3 className="font-bold text-base text-neutral-900 leading-tight">
                        {showcase.name}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {showcase.role}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 mb-5 text-xs text-neutral-600 space-y-1">
                    <p className="font-mono text-[10px] uppercase text-neutral-400 font-bold">
                      {ar ? 'الميزات المفعلة:' : 'Active Features:'}
                    </p>
                    <p className="font-medium text-neutral-800">{showcase.features}</p>
                  </div>
                </div>

                <a
                  href={`/@${showcase.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-xs font-bold text-neutral-900 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{ar ? 'فتح النموذج' : 'Open sample'}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                </a>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Platform Commitments */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {trustGuarantees.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white border border-neutral-200 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h4 className="font-bold text-sm text-neutral-900 mb-2">
                  {item.title}
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Factual product summary */}
        <div className="rounded-3xl bg-white border border-neutral-200 p-6 sm:p-8 max-w-4xl mx-auto shadow-xs text-start">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold font-mono">
              LX
            </div>
            <div>
              <h4 className="font-bold text-sm text-neutral-900">
                {ar ? 'ما الذي تقدمه Liinx' : 'What Liinx provides'}
              </h4>
              <p className="text-xs text-neutral-500">
                {ar ? 'ملخص للميزات المتاحة' : 'A summary of product capabilities'}
              </p>
            </div>
          </div>
          <p className="text-sm text-neutral-700 leading-relaxed">
            {ar
              ? 'تتيح Liinx إنشاء صفحة عامة قابلة للتخصيص للروابط والوسائط المدعومة واشتراكات النشرة وحجوزات Calendly. وتختلف بعض الميزات حسب الخطة.'
              : 'Liinx lets creators publish a customizable public page with links, supported media, newsletter signups, and Calendly booking links. Feature availability can vary by plan.'}
          </p>
        </div>

      </div>
    </section>
  );
};
