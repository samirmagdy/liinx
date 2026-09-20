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
        : 'RALOA does not process sales or booking payments. Payment handling and any fees belong to the external provider.'
    },
    {
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      title: ar ? 'تصدير مشتركي النشرة' : 'Export newsletter subscribers',
      description: ar
        ? 'يمكنك تنزيل عناوين مشتركي النشرة البريدية بصيغة CSV من لوحة المشتركين.'
        : 'Download newsletter subscriber records as a CSV from the Subscribers panel.'
    },
    {
      icon: <Lock className="w-5 h-5 text-indigo-600" />,
      title: ar ? 'إعداد النطاق المخصص' : 'Custom domain setup',
      description: ar
        ? 'تتطلب الخطط المؤهلة التحقق من DNS وإعداد الاستضافة وشهادة TLS.'
        : 'Eligible plans require DNS verification plus hosting and TLS configuration.'
    }
  ];

  return (
    <section id="proof" className="marketing-section py-12 md:py-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-200 bg-white">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <Reveal distance="md" className="max-w-3xl mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 mb-3 text-balance">
              {ar ? 'نماذج توضيحية تفاعلية يمكنك استكشافها' : 'Explore interactive sample pages'}
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed text-pretty">
              {ar
                ? 'هذه ملفات تعريف خيالية توضح بعض أنواع الصفحات التي يمكن إنشاؤها باستخدام RALOA؛ وليست حسابات عملاء.'
                : 'These fictional profiles demonstrate examples of pages you can build with RALOA. They are not customer accounts.'}
            </p>
          </div>
        </Reveal>

        {/* Fictional profile demos */}
        <Reveal stagger>
          <div className="mb-10 border-t border-neutral-200">
            {demoProfiles.map((showcase) => (
              <article key={showcase.username} className="grid grid-cols-1 sm:grid-cols-[minmax(13rem,1fr)_minmax(0,2fr)_auto] items-center gap-3 sm:gap-6 py-5 border-b border-neutral-200">
                  <div className="flex items-center gap-3">
                    <img
                      src={showcase.avatar}
                      alt={showcase.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-neutral-900 leading-tight">
                        {showcase.name}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-1">@{showcase.username}</p>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-neutral-800">{showcase.role}</p>
                    <p className="text-xs text-neutral-500 mt-1">{showcase.features}</p>
                  </div>
                  <a
                    href={`/@${showcase.username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="justify-self-start sm:justify-self-end py-2 text-sm font-semibold text-neutral-800 hover:text-indigo-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>{ar ? 'فتح النموذج' : 'Open sample'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
              </article>
            ))}
          </div>
        </Reveal>

        {/* Platform Commitments */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 border-t border-neutral-200 pt-6">
          {trustGuarantees.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">{item.icon}</div>
              <div>
                <h4 className="font-semibold text-sm text-neutral-900 mb-1.5">{item.title}</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
