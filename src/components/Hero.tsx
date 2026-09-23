import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { PhonePreview } from './PhonePreview';
import { THEMES } from '../config/themes';
import { DEMO_PROFILES } from '../demo/demoProfiles';
import { ARABIC_DEMO_PROFILES } from '../demo/arabicDemoProfiles';
import { type CreatorProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { ArrowRight, Check, Palette } from 'lucide-react';

import { useHeroMotion } from '../animations/useHeroMotion';
import { HeroPreviewControls } from './HeroPreviewControls';
import { HeroClaimForm } from './HeroClaimForm';

interface HeroProps {
  onClaimUsername: (handle: string) => void;
  onOpenStudio: (profile?: CreatorProfile) => void;
}

export const Hero: React.FC<HeroProps> = ({ onClaimUsername, onOpenStudio }) => {
  const [, setLocation] = useLocation();
  const { t, isRtl } = useLanguage();
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const [selectedThemeId, setSelectedThemeId] = useState<string>(DEMO_PROFILES[0].themeId);
  const heroRef = useRef<HTMLElement>(null);
  useHeroMotion(heroRef, isRtl ? 'ar' : 'en', `${selectedProfileIndex}:${selectedThemeId}`);

  const currentProfiles = isRtl ? ARABIC_DEMO_PROFILES : DEMO_PROFILES;
  const activeProfile = currentProfiles[selectedProfileIndex] || currentProfiles[0];
  const activeTheme = THEMES.find(th => th.id === selectedThemeId) || THEMES[0];

  const isArabicText = (text?: string) => /[\u0600-\u06FF]/.test(text || '');
  const isProfileRtl = isArabicText(activeProfile.displayName) || isArabicText(activeProfile.bio);

  const theme = activeTheme;

  const handleProfileSelect = (index: number) => {
    setSelectedProfileIndex(index);
    setSelectedThemeId(currentProfiles[index]?.themeId || DEMO_PROFILES[index].themeId);
  };

  return (
    <section ref={heroRef} className="hero-section marketing-hero relative overflow-hidden pt-8 pb-12 md:pt-10 md:pb-14 lg:pt-12 lg:pb-16 border-b border-neutral-200">
      <div className="raloa-hero-bg raloa-hero-bg--light opacity-40" aria-hidden="true" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-start">
          
          {/* Left Column: Brand Copy & Claimer */}
          <div className="lg:col-span-7 flex flex-col items-start text-start lg:pt-1">
            
            {/* Top Badge */}
            <div data-hero="eyebrow" className="mb-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">
              {t.hero.badge}
            </div>

            {/* Main Headline */}
            <div>
              <h1 key={isRtl ? 'ar' : 'en'} className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-[-0.045em] text-neutral-900 leading-[1.02] mb-4 text-balance">
                <span className="hero-headline-main">{t.hero.headline}</span>
                <span className="hero-headline-highlight">{t.hero.headlineHighlight}</span>
              </h1>
            </div>

            {/* Subtitle - One concise benefit statement */}
            <div data-hero="copy">
              <p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-xl lg:max-w-2xl mb-6 text-pretty">
                {t.hero.subheadline}
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

              <div className="hero-proof raloa-hero-proof" aria-label={isRtl ? 'مزايا البدء' : 'Getting started benefits'}>
                {[isRtl ? 'مجاني إلى الأبد' : 'Free forever', isRtl ? 'لا تحتاج بطاقة ائتمانية' : 'No credit card required', isRtl ? 'جاهز خلال 60 ثانية' : 'Live in 60 seconds'].map(item => (
                  <span key={item}><Check aria-hidden="true" />{item}</span>
                ))}
              </div>

              {/* Secondary CTAs: deliberately unstyled text, so nothing competes with the claim button. */}
              <div data-hero="secondary" className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 text-xs px-2">
                <Link
                  href="/@elenarostova"
                  className="inline-flex min-h-11 items-center gap-1.5 font-bold text-neutral-900 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <span>{isRtl ? 'شاهد العرض التجريبي ↗' : 'View live demo ↗'}</span>
                </Link>
                <Link
                  href="/templates"
                  className="inline-flex min-h-11 items-center gap-1 font-semibold text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
                >
                  <span>{t.hero.exploreTemplates}</span>
                  <ArrowRight className={`w-3 h-3 ${isRtl ? 'rotate-180' : ''}`} />
                </Link>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Device & Controls */}
          <div className="lg:col-span-5 flex flex-col items-center">

            {/* On a phone the device itself is the answer to "can I see one?", so it leads and
                its controls follow; on desktop the selector bar stays above the shell. */}
            <div className="order-2 flex w-full justify-center lg:order-1">
              <HeroPreviewControls
                currentProfiles={currentProfiles}
                selectedProfileIndex={selectedProfileIndex}
                onSelectProfile={handleProfileSelect}
                selectedThemeId={selectedThemeId}
                onSelectTheme={setSelectedThemeId}
                activeTheme={activeTheme}
              />
            </div>

            {/* Live Interactive Device Preview with Apple-style motion */}
            <div data-hero="visual" className="order-1 mt-2 w-full max-w-[380px] lg:order-2 lg:mt-0">
              <div className="hero-device-meta flex items-center justify-between px-2 mb-2">
                <span className="flex items-center gap-1.5 font-mono text-xs font-medium text-neutral-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {isRtl ? 'نموذج توضيحي' : 'Demo Profile'}
                </span>
                <span className="text-[11px] font-mono text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200">
                  {isRtl ? 'بيانات تجريبية' : 'Sample Data'}
                </span>
              </div>
              <div className="hero-device-stage relative">
                <span className="hero-float hero-float-links">{isRtl ? <>كل روابطك<br />في مكان واحد</> : <>All your links<br />in one place</>} <i aria-hidden="true">↘</i></span>
                <span className="hero-float hero-float-device">{isRtl ? <>يبدو رائعاً<br />على أي جهاز</> : <>Looks amazing<br />on any device</>} <i aria-hidden="true">↙</i></span>
                <span className="hero-float hero-float-templates">{isRtl ? <>قوالب<br />تحوّل</> : <>Templates<br />that convert</>} <i aria-hidden="true">↘</i></span>
                <span className="hero-float hero-float-growth"><strong>↗</strong><b>+300%</b><small>{isRtl ? 'نقرات أكثر' : 'More clicks'}</small></span>
              <div className="phone-shell relative rounded-[44px] p-3 shadow-lg ring-2 ring-black/10 bg-neutral-900 border border-neutral-800">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-neutral-800 rounded-full z-30" />

                <div
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
                  /></div>
                </div>

                {/* Subtle bottom scroll affordance vignette */}
                <div className="pointer-events-none absolute bottom-5 left-5 right-5 h-12 bg-gradient-to-t from-black/25 to-transparent rounded-b-[30px] z-20" />
              </div>
              </div>

              <div className="hero-device-customize mt-3 px-2">
                <Link
                  href="/studio"
                  onClick={event => { event.preventDefault(); onOpenStudio(activeProfile); }}
                  className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:text-neutral-900"
                >
                  <Palette className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{t.hero.customizeCta(activeProfile.displayName.split(' ')[0])}</span>
                </Link>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
);
};
