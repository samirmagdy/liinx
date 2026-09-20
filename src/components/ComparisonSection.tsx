import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCapabilities } from '../context/CapabilitiesContext';
import { 
  ArrowRight, 
  Download, 
  ExternalLink, 
  Play, 
  Folder, 
  Calendar, 
  Check, 
  X, 
  Sparkles
} from 'lucide-react';
import { useLocation } from 'wouter';
import { Reveal } from './motion/Reveal';

export function ComparisonSection() {
  const { lang } = useLanguage();
  const { hasAnyImporter } = useCapabilities();
  const ar = lang === 'ar';
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'both' | 'liinx' | 'generic'>('both');

  return (
    <section id="comparison" className="marketing-section py-12 md:py-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-200 bg-neutral-50/50">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <Reveal distance="md" className="text-center max-w-3xl mx-auto mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-mono font-bold text-neutral-800 mb-3 tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{ar ? 'مقارنة بصرية واضحة' : 'The Visual Difference'}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 mb-4 text-balance">
              {ar ? 'موقع مصغر متكامل أم مجرد قائمة روابط؟' : 'A design-first mini website vs. A list of links'}
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed text-pretty">
              {ar
                ? 'شاهد الفرق بين قائمة روابط بسيطة وموقع مصغر مصمم بعناية يعكس هويتك الإبداعية.'
                : 'See the difference between a link list and a design-first mini-site.'}
            </p>
          </div>
        </Reveal>

        {/* Mobile View Toggle */}
        <div className="flex md:hidden justify-center mb-8">
          <div className="inline-flex p-1 rounded-full bg-neutral-200/70 border border-neutral-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('generic')}
              className={`px-4 py-1.5 rounded-full transition-colors ${
                activeTab === 'generic' ? 'bg-white text-neutral-900 shadow-xs font-bold' : 'text-neutral-600'
              }`}
            >
              {ar ? 'قائمة الروابط البسيطة' : 'Basic link list'}
            </button>
            <button
              onClick={() => setActiveTab('liinx')}
              className={`px-4 py-1.5 rounded-full transition-colors ${
                activeTab === 'liinx' ? 'bg-neutral-900 text-white shadow-xs font-bold' : 'text-neutral-600'
              }`}
            >
              {ar ? 'موقع ليينكس' : 'Liinx Mini-Site'}
            </button>
          </div>
        </div>

        {/* Side-by-Side Visual Comparison Grid */}
        <Reveal stagger>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-start mb-8">
            
            {/* Left: Basic Link List */}
            <div
              className={`rounded-3xl border border-neutral-300 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all ${
                activeTab === 'liinx' ? 'hidden md:flex' : 'flex'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-5 border-b border-neutral-200 mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500 text-xs font-bold">
                      ✕
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-neutral-800">
                        {ar ? 'قائمة الروابط البسيطة' : 'Basic link list'}
                      </h3>
                      <p className="text-xs text-neutral-500">
                        {ar ? 'قائمة أزرار مسطحة بصفحة واحدة وتحديث يدوي' : 'Flat button list, single scroll, manual updates'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 text-[11px] font-mono">
                    {ar ? 'بسيط' : 'Basic'}
                  </span>
                </div>

                {/* Mockup Preview: Plain link list style */}
                <div className="rounded-2xl border border-neutral-200 bg-neutral-100/60 p-5 space-y-3 mb-6 max-w-sm mx-auto">
                  <div className="text-center pb-2">
                    <div className="w-14 h-14 rounded-full bg-neutral-300 mx-auto mb-2" />
                    <div className="h-3 w-28 bg-neutral-300 rounded-full mx-auto mb-1.5" />
                    <div className="h-2.5 w-44 bg-neutral-200 rounded-full mx-auto" />
                  </div>

                  <div className="p-3 bg-white border border-neutral-200 rounded-xl text-center text-xs font-medium text-neutral-700 shadow-xs opacity-80">
                    {ar ? 'أزرار توجيه مسطحة' : 'Flat destination buttons'}
                  </div>
                  <div className="p-3 bg-white border border-neutral-200 rounded-xl text-center text-xs font-medium text-neutral-700 shadow-xs opacity-80">
                    {ar ? 'صفحة تمرير واحدة' : 'Single scrolling page'}
                  </div>
                  <div className="p-3 bg-white border border-neutral-200 rounded-xl text-center text-xs font-medium text-neutral-700 shadow-xs opacity-80">
                    {ar ? 'رابط نطاق فرعي للمنصة' : 'Platform URL (subdomain)'}
                  </div>

                  <div className="text-center pt-2">
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {ar ? 'تخصيص بصري أساسي وتحديثات يدوية' : 'Basic visual styling • Manual content updates'}
                    </span>
                  </div>
                </div>

                {/* Characteristics List */}
                <ul className="space-y-2.5 text-xs text-neutral-600">
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                    <span><strong>{ar ? 'أزرار توجيه مسطحة' : 'Flat destination buttons'}:</strong> {ar ? 'روابط نصية تنقل الزائر خارج الصفحة دون تفاعل' : 'Simple text buttons redirecting visitors elsewhere'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                    <span><strong>{ar ? 'صفحة تمرير واحدة' : 'Single scrolling page'}:</strong> {ar ? 'تكدس طولي للروابط بدون صفحات فرعية أو مجلدات' : 'Single continuous scroll with no sub-pages or folder grouping'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                    <span><strong>{ar ? 'رابط المنصة الافتراضي' : 'Platform URL'}:</strong> {ar ? 'الاعتماد على رابط فرعي تابع للمنصة' : 'Runs on standard shared platform link URLs'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                    <span><strong>{ar ? 'تخصيص بصري أساسي' : 'Basic visual customization'}:</strong> {ar ? 'خيارات محدودة لتعديل الألوان والخطوط' : 'Basic preset styling and limited typography controls'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                    <span><strong>{ar ? 'تحديثات محتوى يدوية' : 'Manual content updates'}:</strong> {ar ? 'تعديل يدوي مستمر للروابط دون أتمتة عبر API' : 'Manual block maintenance with no API automation'}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right: Liinx Mini-Website */}
            <div
              className={`rounded-3xl border-2 border-neutral-900 bg-white p-5 sm:p-6 shadow-xl flex flex-col justify-between relative transition-all ${
                activeTab === 'generic' ? 'hidden md:flex' : 'flex'
              }`}
            >
              <div className="absolute -top-3.5 left-8 px-3.5 py-1 rounded-full bg-neutral-900 text-white text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-md">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{ar ? 'تجربة ليينكس الفائقة' : 'Liinx Mini-Website'}</span>
              </div>

              <div>
                <div className="flex items-center justify-between pb-5 border-b border-neutral-200 mb-6 pt-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xs font-bold">
                      ✓
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-neutral-900">
                        {ar ? 'موقعك المصغر على ليينكس' : 'Your Liinx Mini-Website'}
                      </h3>
                      <p className="text-xs text-neutral-500">
                        {ar ? 'تصميم متكامل، وسائط مدمجة، وحرية مطلقة' : 'Rich inline media, folders, scheduling & custom domain'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-mono font-bold border border-emerald-200">
                    {ar ? 'هوية مستقلة' : 'Branded'}
                  </span>
                </div>

                {/* Mockup Preview: Rich Liinx Mini-Site */}
                <div className="rounded-2xl border border-neutral-800 bg-[#17181A] text-white p-5 space-y-3 mb-6 max-w-sm mx-auto shadow-inner">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-neutral-700 overflow-hidden ring-1 ring-amber-400/40">
                        <img 
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" 
                          alt="Elena"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-none">Elena Rostova</p>
                        <p className="text-[10px] text-neutral-400 font-mono mt-0.5">links.elena.design</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                      DNS Verified
                    </span>
                  </div>

                  {/* Playable Audio Card */}
                  <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold truncate">Architecture & Space Vol. 2</p>
                      <p className="text-[9px] text-neutral-400">Playable directly in page</p>
                    </div>
                  </div>

                  {/* Accordion Folder */}
                  <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Folder className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[11px] font-bold">2025 Architectural Portfolio</span>
                    </div>
                    <span className="text-[9px] font-mono text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                      4 links
                    </span>
                  </div>

                  {/* Booking Card */}
                  <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-[11px] font-bold">Book Studio Consultation</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-neutral-400" />
                  </div>
                </div>

                {/* Advantages List */}
                <ul className="space-y-2.5 text-xs text-neutral-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 stroke-[2.5]" />
                    <span><strong>{ar ? 'كتل تفاعلية ثرية' : 'Rich interactive blocks'}:</strong> {ar ? 'تشغيل وسائط مدمجة (Spotify، YouTube)، نماذج حجز، وتجميع مشتركين' : 'Inline audio, video, newsletters, booking embeds, and folders'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 stroke-[2.5]" />
                    <span><strong>{ar ? 'صفحات متعددة ومجلدات' : 'Pages + folders'}:</strong> {ar ? 'تنظيم المشاريع في صفحات فرعية ومجلدات قابلة للتوسيع' : 'Organize deep content into subpages and collapsible accordion folders'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 stroke-[2.5]" />
                    <span><strong>{ar ? 'دعم النطاق الخاص' : 'Custom-domain support'}:</strong> {ar ? 'نشر على نطاقك الخاص (links.yourname.com) مع توجيه DNS وتشفير HTTPS بعد إعداد الاستضافة' : 'Publish on your custom domain with guided DNS verification and secure HTTPS after hosting setup'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 stroke-[2.5]" />
                    <span><strong>{ar ? 'تخصيص معماري متقدم' : 'CSS/fonts/themes'}:</strong> {ar ? 'خطوط عربية ولاتينية منسقة، سمات معمارية دقيقة، وتحكم كامل بالهوية' : 'Curated typography, architectural dark/light themes, and custom layout styling'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 stroke-[2.5]" />
                    <span><strong>REST API v1:</strong> {ar ? 'قراءة بيانات الملف وإنشاء كتل الروابط أو حذفها' : 'Read profile data and create or delete link blocks'}</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </Reveal>

        {/* Switch from Linktree Migration Banner */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-amber-300 flex items-center justify-center shrink-0 shadow-xs">
              <Download className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">
                {ar ? 'هل تنتقل من Linktree أو Beacons؟' : 'Moving from Linktree or Beacons?'}
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed mt-1">
                {hasAnyImporter
                  ? (ar ? 'أدخل اسم حسابك العام واستورد جميع روابطك خلال 60 ثانية بدون إعادة كتابة أي شيء.' : 'Enter your handle to preview and import all your public links in 60 seconds.')
                  : (ar ? 'أنشئ صفحتك في دقائق مع سمات تصميم مخصصة، دون رسوم من Liinx على المبيعات أو الحجوزات التي يدير مزود خارجي مدفوعاتها، وتحكم كامل في علامتك التجارية.' : 'Set up your mini-site in minutes with custom themes, no Liinx fee on sales or bookings handled by external providers, and complete layout control.')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setLocation(hasAnyImporter ? '/register?after=import' : '/register')}
            className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
          >
            <span>{hasAnyImporter ? (ar ? 'استيراد الروابط الآن' : 'Import your links') : (ar ? 'أنشئ صفحتك مجاناً' : 'Create your page')}</span>
            <ArrowRight className={`w-4 h-4 ${ar ? 'rotate-180' : ''}`} />
          </button>
        </div>

      </div>
    </section>
  );
}
