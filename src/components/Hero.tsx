import React, { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { PhonePreview } from './PhonePreview';
import { THEMES } from '../config/themes';
import { DEMO_PROFILES } from '../demo/demoProfiles';
import { ARABIC_DEMO_PROFILES } from '../demo/arabicDemoProfiles';
import { type CreatorProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { 
  ArrowRight, 
  Palette, 
  Check, 
  Sparkles
} from 'lucide-react';

import { useHeroMotion } from '../animations/useHeroMotion';
import { brand } from '../config/brand';
import { HeroFeatureShowcase } from './HeroFeatureShowcase';
import { HeroPreviewControls } from './HeroPreviewControls';
import { HeroClaimForm } from './HeroClaimForm';

interface HeroProps {
  onClaimUsername: (handle: string) => void;
  onOpenStudio: (profile?: CreatorProfile) => void;
}

export const Hero: React.FC<HeroProps> = ({ onClaimUsername, onOpenStudio }) => {
  const [, setLocation] = useLocation();
  const { t, isRtl, tr: ui } = useLanguage();
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const [selectedThemeId, setSelectedThemeId] = useState<string>(DEMO_PROFILES[0].themeId);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>('audio');
  const heroRef = useRef<HTMLElement>(null);
  const phoneScrollRef = useRef<HTMLDivElement>(null);
  useHeroMotion(heroRef, isRtl ? 'ar' : 'en', `${selectedProfileIndex}:${selectedThemeId}`);

  const currentProfiles = isRtl ? ARABIC_DEMO_PROFILES : DEMO_PROFILES;
  const activeProfile = currentProfiles[selectedProfileIndex] || currentProfiles[0];
  const activeTheme = THEMES.find(th => th.id === selectedThemeId) || THEMES[0];

  const isArabicText = (text?: string) => /[\u0600-\u06FF]/.test(text || '');
  const isProfileRtl = isArabicText(activeProfile.displayName) || isArabicText(activeProfile.bio);

  const theme = activeTheme;

  const scrollToFeature = (featureId: string) => {
    const scrollContainer = phoneScrollRef.current;
    if (!scrollContainer) return;

    const targetEl = scrollContainer.querySelector(`[data-feature="${featureId}"]`) as HTMLElement | null;
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleProfileSelect = (index: number) => {
    setSelectedProfileIndex(index);
    setSelectedThemeId(currentProfiles[index]?.themeId || DEMO_PROFILES[index].themeId);
    setSelectedFeatureId(null);
  };

  const handleFeatureSelect = (featureId: string, profileIndex: number) => {
    setSelectedFeatureId(featureId);
    if (selectedProfileIndex !== profileIndex) {
      setSelectedProfileIndex(profileIndex);
      setSelectedThemeId(currentProfiles[profileIndex]?.themeId || DEMO_PROFILES[profileIndex].themeId);
      // Wait for re-render with the new profile blocks before scrolling
      setTimeout(() => {
        scrollToFeature(featureId);
      }, 120);
    } else {
      scrollToFeature(featureId);
    }
  };

  return (
    <section ref={heroRef} className="hero-section marketing-hero pt-8 pb-12 md:pt-10 md:pb-14 lg:pt-12 lg:pb-16 border-b border-neutral-200 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(245,158,11,0.05),transparent)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-start">
          
          {/* Left Column: Brand Copy & Claimer */}
          <div className="lg:col-span-7 flex flex-col items-start text-start lg:pt-1">
            
            {/* Top Badge */}
            <div data-hero="eyebrow" className="inline-flex">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-100/90 border border-neutral-200/90 text-xs font-semibold text-neutral-800 mb-3.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{isRtl ? 'موقع مصغر يركز على التصميم، وليس مجرد قائمة روابط' : 'A design-first mini website, not a list of links'}</span>
              </div>
            </div>

            {/* Main Headline */}
            <div>
              <h1 key={isRtl ? 'ar' : 'en'} className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-[-0.045em] text-neutral-900 leading-[1.02] mb-4 text-balance">
                {t.hero.headline} <span className="text-neutral-500 font-medium">{t.hero.headlineHighlight}</span>
              </h1>
            </div>

            {/* Subtitle - One concise benefit statement */}
            <div data-hero="copy">
              <p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-xl lg:max-w-2xl mb-6 text-pretty">
                {isRtl 
                  ? 'أنشئ موقعاً مصغراً فائق الأناقة لكل ما تصنعه وتشاركه وتبيعه. مع مشغلات صوت وفيديو وجدولة مواعيد ونطاق مخصص خاص بك.'
                  : 'Build a high-craft mini website for everything you make, share, and sell. Featuring inline audio players, video embeds, scheduling, and your own custom domain.'}
              </p>
            </div>

            {/* Primary Action: Claim Handle Form */}
            <div data-hero="action" className="w-full max-w-xl lg:max-w-2xl mb-4">
              <HeroClaimForm
                isRtl={isRtl}
                placeholder={t.hero.claimPlaceholder}
                createLabel={isRtl ? 'أنشئ صفحتك' : 'Create your page'}
                onClaimUsername={onClaimUsername}
                onFallbackRedirect={() => setLocation('/register')}
              />

              {/* Secondary CTAs & Concise Guarantees */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs px-2">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setLocation('/@elenarostova')}
                    className="font-bold text-neutral-900 hover:text-amber-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>{isRtl ? 'معاينة صفحة حية ↗' : 'View live example ↗'}</span>
                  </button>
                  <span className="text-neutral-300">•</span>
                  <button
                    type="button"
                    onClick={() => setLocation('/templates')}
                    className="font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>{t.hero.exploreTemplates}</span>
                    <ArrowRight className={`w-3 h-3 ${isRtl ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center gap-3 text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    <span>{t.hero.noCreditCard}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    <span>{t.hero.zeroCommission}</span>
                  </span>
                </div>
              </div>

              {/* Native Building Blocks Showcase - Balances Left Column Whitespace */}
              <HeroFeatureShowcase
                isRtl={isRtl}
                selectedFeatureId={selectedFeatureId}
                onSelectFeature={handleFeatureSelect}
              />
            </div>

          </div>

          {/* Right Column: Interactive Device & Controls */}
          <div className="lg:col-span-5 flex flex-col items-center">
            
            {/* Interactive Selector Bar */}
            <HeroPreviewControls
              currentProfiles={currentProfiles}
              selectedProfileIndex={selectedProfileIndex}
              onSelectProfile={handleProfileSelect}
              selectedThemeId={selectedThemeId}
              onSelectTheme={setSelectedThemeId}
              activeTheme={activeTheme}
            />

            {/* Live Interactive Device Preview with Apple-style motion */}
            <div data-hero="visual" className="w-full max-w-[380px]">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[11px] font-mono font-medium text-neutral-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {isRtl ? 'نموذج توضيحي' : 'Demo Profile'}
                </span>
                <span className="text-[10px] font-mono text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200">
                  {isRtl ? 'بيانات تجريبية' : 'Sample Data'}
                </span>
              </div>
              <div className="phone-shell relative rounded-[44px] p-3 shadow-lg ring-2 ring-black/10 bg-neutral-900 border border-neutral-800">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-neutral-800 rounded-full z-30" />

                <div 
                  ref={phoneScrollRef}
                  id="hero-phone-scroll-container"
                  dir={isProfileRtl ? 'rtl' : 'ltr'}
                  className="relative w-full h-[590px] rounded-[36px] overflow-y-auto no-scrollbar pt-10 pb-6 px-4 sm:px-5 transition-colors duration-300 scroll-smooth"
                  style={{
                    background: theme.bgType === 'gradient' ? theme.bgGradient : theme.bgColor,
                    color: theme.textColor,
                    fontFamily: theme.fontFamily === 'display' ? 'var(--font-display)' : theme.fontFamily === 'mono' ? 'var(--font-mono)' : 'var(--font-sans)'
                  }}>
                  <div data-hero-preview><PhonePreview
                    profile={activeProfile}
                    customTheme={activeTheme}
                    compact
                    interactive={false}
                    highlightedFeatureId={selectedFeatureId}
                  /></div>
                </div>

                {/* Subtle bottom scroll affordance vignette */}
                <div className="pointer-events-none absolute bottom-5 left-5 right-5 h-12 bg-gradient-to-t from-black/25 to-transparent rounded-b-[30px] z-20" />
              </div>
            </div>

            {/* Action below Phone */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => onOpenStudio(activeProfile)}
                className="px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-xs font-semibold text-neutral-900 flex items-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
              >
                <Palette className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.hero.customizeCta(activeProfile.displayName.split(' ')[0])}</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
);
};
