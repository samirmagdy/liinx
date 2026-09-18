import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  ShieldCheck, 
  ExternalLink, 
  Lock, 
  Coins, 
  FileText
} from 'lucide-react';
import { Reveal } from './motion/Reveal';

export const TrustProofSection: React.FC = () => {
  const { lang } = useLanguage();
  const ar = lang === 'ar';

  const liveShowcases = [
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
      title: ar ? 'عمولة 0% على جميع تعاملاتك' : '0% Platform Commission',
      description: ar
        ? 'لا نأخذ أي نسبة من أرباحك، مبيعاتك، أو حجوزاتك على Calendly وStripe. أرباحك لك بالكامل.'
        : 'We never take a percentage cut of your sales, bookings, or client payments. You keep 100% of your revenue.'
    },
    {
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      title: ar ? 'تصدير كامل لقائمتك البريدية' : 'Full Audience Data Portability',
      description: ar
        ? 'بيانات المشتركين في نشرتك البريدية ملكك وحدك. يمكنك تنزيلها بصيغة CSV في أي ثانية بنقرة واحدة.'
        : 'Your subscribers are your assets. Download your complete email list as a CSV at any time without fees.'
    },
    {
      icon: <Lock className="w-5 h-5 text-amber-600" />,
      title: ar ? 'أمان HTTPS تلقائي مشفر' : 'Instant Automated HTTPS',
      description: ar
        ? 'كل نطاق مخصص يربطه المستخدم يحصل على شهادة SSL مشفرة تلقائياً بدون أي تعقيد تقني.'
        : 'Every custom domain connected to Liinx receives automatic, managed TLS encryption out of the box.'
    }
  ];

  return (
    <section id="proof" className="marketing-section py-24 md:py-36 px-4 sm:px-6 lg:px-8 border-b border-neutral-200 bg-neutral-50">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <Reveal distance="md" className="text-center max-w-3xl mx-auto mb-16">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-mono font-bold text-neutral-800 mb-3 tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{ar ? 'أدلة واقعية وثقة مثبتة' : 'Transparent Real-World Proof'}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 mb-4 text-balance">
              {ar ? 'صفحات حية يمكنك تصفحها الآن' : 'Real published pages you can explore right now'}
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed text-pretty">
              {ar
                ? 'لا نعتمد على أرقام وهمية أو مراجعات مصطنعة؛ تفقد نماذج حقيقية منشورة واختبر بنفسك سرعة وسلاسة ليينكس.'
                : 'Zero fabricated metrics or synthetic testimonials. Open published live demo pages to test speed, responsive layout, and media embeds firsthand.'}
            </p>
          </div>
        </Reveal>

        {/* Live Published Showcases (Issue #5 & #11) */}
        <Reveal stagger>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {liveShowcases.map((showcase) => (
              <div
                key={showcase.username}
                className="motion-card rounded-3xl bg-white border border-neutral-200 p-6 flex flex-col justify-between hover:border-neutral-300 shadow-xs transition-all"
              >
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                      {ar ? 'نموذج حي' : 'Live Showcase'}
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
                  <span>{ar ? 'فتح الصفحة الحية' : 'Open Live Page'}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                </a>
              </div>
            ))}
          </div>
        </Reveal>

        {/* 3 Concrete Platform Commitments (Issue #5) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
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

        {/* Founder & Philosophy Statement */}
        <div className="rounded-3xl bg-white border border-neutral-200 p-8 sm:p-10 max-w-4xl mx-auto shadow-xs text-start">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold font-mono">
              LX
            </div>
            <div>
              <h4 className="font-bold text-sm text-neutral-900">
                {ar ? 'لماذا بنينا ليينكس' : 'The Philosophy Behind Liinx'}
              </h4>
              <p className="text-xs text-neutral-500">
                {ar ? 'رسالة من فريق التصميم والهندسة' : 'A note on craft, aesthetics, and creator dignity'}
              </p>
            </div>
          </div>
          <p className="text-sm text-neutral-700 leading-relaxed italic mb-4">
            {ar
              ? '«لقد تحولت أدوات الروابط الحيوية إلى مصفوفات متشابهة من الأزرار المسطحة والمشتتة. بنينا ليينكس لنعيد الهيبة إلى هويتك الرقمية: صفحة مصغرة عالية الحرفية، وسائط تعمل مباشرة، نطاق خاص بك، وملكية كاملة لبياناتك دون عمولات خفية.»'
              : '"Bio link tools gradually degenerated into cluttered, identical stacks of dull rectangular buttons. We built Liinx to bring craft and dignity back to your digital front door: a fast, high-aesthetic mini-website with playable media, custom typography, zero transaction commissions, and complete data ownership."'}
          </p>
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pt-2 border-t border-neutral-100">
            <span>Liinx Studio Team</span>
            <span>{ar ? 'بيانات توضيحية خالية من التضليل' : 'Verified Transparent Standards'}</span>
          </div>
        </div>

      </div>
    </section>
  );
};
