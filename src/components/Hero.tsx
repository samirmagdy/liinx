import React, { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { PhonePreview } from './PhonePreview';
import { DEMO_PROFILES, THEMES } from '../data/mockData';
import { CreatorProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useCapabilities } from '../context/CapabilitiesContext';
import { 
  ArrowRight, 
  Palette, 
  Check, 
  Sparkles,
  MousePointer2,
  LayoutTemplate
} from 'lucide-react';

import { useHeroMotion } from '../animations/useHeroMotion';
import { brand } from '../config/brand';


interface HeroProps {
  onClaimUsername: (handle: string) => void;
  onOpenStudio: (profile?: CreatorProfile) => void;
}

export const Hero: React.FC<HeroProps> = ({ onClaimUsername, onOpenStudio }) => {
  const [, setLocation] = useLocation();
  const { t, isRtl, tr } = useLanguage();
  const { hasAnyImporter } = useCapabilities();
  const [handle, setHandle] = useState('');
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const [selectedThemeId, setSelectedThemeId] = useState<string>(DEMO_PROFILES[0].themeId);
  const heroRef = useRef<HTMLElement>(null);
  useHeroMotion(heroRef, isRtl ? 'ar' : 'en', `${selectedProfileIndex}:${selectedThemeId}`);

  const activeProfile = DEMO_PROFILES[selectedProfileIndex];
  const activeTheme = THEMES.find(t => t.id === selectedThemeId) || THEMES[0];

  const isArabicText = (text?: string) => /[\u0600-\u06FF]/.test(text || '');
  const isProfileRtl = isArabicText(activeProfile.displayName) || isArabicText(activeProfile.bio);

  const theme = activeTheme;

  const handleProfileSelect = (index: number) => {
    setSelectedProfileIndex(index);
    setSelectedThemeId(DEMO_PROFILES[index].themeId);
  };

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (handle.trim()) {
      onClaimUsername(handle.trim());
    } else {
      setLocation('/register');
    }
  };

return (
    <section ref={heroRef} className="hero-section marketing-hero py-16 md:py-24 lg:py-32 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Brand Copy & Claimer */}
          <div className="lg:col-span-7 flex flex-col items-start text-start">
            
            {/* Top Badge */}
            <div data-hero="eyebrow" className="inline-flex">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-800 mb-5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.hero.badge}</span>
            </div>
            </div>

            {/* Main Headline */}
            <div><h1 className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-[-0.045em] text-neutral-900 leading-[1.02] mb-6 text-balance">
              {t.hero.headline} <span className="text-neutral-500 font-medium">{t.hero.headlineHighlight}</span>
            </h1></div>

            {/* Subtitle */}
              <div data-hero="copy"><p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-xl mb-5 text-pretty">
                {t.hero.subheadline}
              </p></div>
              <div data-hero="copy"><p className="text-sm text-neutral-500 max-w-xl mb-8 text-pretty">
                {tr('One designed page for links, supported media, newsletter capture, and Calendly bookings — with your own domain on paid plans.')}
              </p></div>

            {/* Claim Handle Hero Form */}
            <div data-hero="action" className="w-full max-w-xl mb-8"><div className="space-y-4">
              <form 
                onSubmit={handleClaim}
                className="p-1.5 bg-neutral-50 rounded-2xl sm:rounded-full border border-neutral-300 shadow-[0_10px_30px_rgba(24,24,23,0.04)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 focus-within:border-neutral-900 transition-colors"
              >
                <div className="flex items-center px-4 py-2 sm:py-0 flex-1" dir="ltr">
                  <span className="text-neutral-500 font-mono text-sm sm:text-base font-semibold select-none">
                    {brand.domain}/@
                  </span>
                  <input
                    id="hero-claim-input"
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder={t.hero.claimPlaceholder}
                    className="w-full pl-1 outline-none font-mono text-sm sm:text-base font-bold text-neutral-900 placeholder-neutral-400 bg-transparent"
                    spellCheck={false}
                    aria-label={`Claim your ${brand.productShortName} handle`}
                  />
                </div>
                
                <button
                  id="hero-claim-btn"
                  type="submit"
                  className="px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-full bg-neutral-900 hover:bg-black text-white text-sm font-bold tracking-tight transition-colors active:scale-[0.985] flex items-center justify-center gap-2 cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                >
                  <span>{t.hero.claimButton}</span>
                  <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                </button>
              </form>

              {/* Secondary CTA & Assurance */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500 px-2">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    <span>{t.hero.noCreditCard}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    <span>{t.hero.customDomainIncluded}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    <span>{t.hero.zeroCommission}</span>
                  </span>
                </div>

                <button
                  onClick={() => setLocation('/templates')}
                  className="text-neutral-900 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{t.hero.exploreTemplates}</span>
                  <ArrowRight className={`w-3 h-3 ${isRtl ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={() => setLocation(hasAnyImporter ? '/register?after=import' : '/register')}
                  className="text-neutral-600 font-semibold hover:text-neutral-900 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{hasAnyImporter ? tr('Moving from Linktree? Import your links') : tr('Moving from Linktree? Easy setup in minutes')}</span>
                  <ArrowRight className={`w-3 h-3 ${isRtl ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div></div>

            {/* Micro-proof indicators */}
            <div className="pt-4 border-t border-neutral-200 w-full flex flex-wrap gap-x-6 gap-y-2 text-xs text-neutral-500"><div>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <MousePointer2 className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.hero.microProof1}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <LayoutTemplate className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.hero.microProof2}</span>
              </span>
            </div></div>

          </div>

          {/* Right Column: Interactive Device & Controls */}
          <div className="lg:col-span-5 flex flex-col items-center">
            
            {/* Interactive Selector Bar */}
            <div data-hero="controls" className="w-full max-w-[380px] mb-6"><div className="space-y-3">
              <p className="text-xs font-semibold text-neutral-600 text-center">{t.hero.previewSubtitle}</p>
              {/* Profile switcher tabs */}
              <div className="flex items-center justify-between gap-1 p-1 bg-neutral-100 border border-neutral-200 rounded-full">
                {DEMO_PROFILES.slice(0, 4).map((prof, idx) => (
                  <button
                    key={prof.id}
                    aria-pressed={selectedProfileIndex === idx}
                    onClick={() => handleProfileSelect(idx)}
                    className={`flex-1 py-1.5 px-2 rounded-full text-[11px] font-semibold transition-colors truncate cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
                      selectedProfileIndex === idx
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    {prof.displayName.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Theme switcher dots */}
              <div className="flex flex-wrap gap-2 items-center justify-between px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs">
                <span className="text-[11px] font-medium text-neutral-500 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  <span>{t.hero.themeLabel}</span>
                  <strong className="text-neutral-900">{activeTheme.name}</strong>
                </span>
                
                <div className="flex items-center gap-1.5">
                  {THEMES.slice(0, 6).map(theme => (
                    <button
                      key={theme.id}
                      aria-pressed={selectedThemeId === theme.id}
                      onClick={() => setSelectedThemeId(theme.id)}
                      title={theme.name}
                      aria-label={`Select ${theme.name} theme`}
                      className={`w-5 h-5 rounded-full border transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 focus-visible:ring-offset-1 ${
                        selectedThemeId === theme.id 
                          ? 'ring-2 ring-neutral-900 ring-offset-1 scale-110' 
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ 
                        backgroundColor: theme.bgColor,
                        borderColor: theme.isDark ? '#555' : '#ccc'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div></div>

            {/* Live Interactive Device Preview with Apple-style motion */}
            <div data-hero="visual" className="w-full max-w-[380px]"><div
              className="phone-shell relative rounded-[44px] p-3 shadow-lg ring-2 ring-black/10 bg-neutral-900 border border-neutral-800"
            >
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-neutral-800 rounded-full z-30" />

              <div 
                dir={isProfileRtl ? 'rtl' : 'ltr'}
                className="relative w-full h-[660px] rounded-[36px] overflow-y-auto no-scrollbar pt-12 pb-8 px-5 transition-colors duration-300"
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
            </div></div>

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
