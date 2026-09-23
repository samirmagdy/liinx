import React, { useState, useRef } from 'react';
import { THEMES } from '../config/themes';
import { DEMO_PROFILES } from '../demo/demoProfiles';
import { ARABIC_DEMO_PROFILES } from '../demo/arabicDemoProfiles';
import { type CreatorProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useHeroMotion } from '../animations/useHeroMotion';
import { HeroCopy } from './HeroCopy';
import { HeroDevice } from './HeroDevice';

interface HeroProps {
  onClaimUsername: (handle: string) => void;
  onOpenStudio: (profile?: CreatorProfile) => void;
}

export const Hero: React.FC<HeroProps> = ({ onClaimUsername, onOpenStudio }) => {
  const { isRtl } = useLanguage();
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const [selectedThemeId, setSelectedThemeId] = useState<string>(DEMO_PROFILES[0].themeId);
  const heroRef = useRef<HTMLElement>(null);
  useHeroMotion(heroRef, isRtl ? 'ar' : 'en', `${selectedProfileIndex}:${selectedThemeId}`);

  const currentProfiles = isRtl ? ARABIC_DEMO_PROFILES : DEMO_PROFILES;
  const activeProfile = currentProfiles[selectedProfileIndex] || currentProfiles[0];
  const activeTheme = THEMES.find(th => th.id === selectedThemeId) || THEMES[0];

  const isArabicText = (text?: string) => /[\u0600-\u06FF]/.test(text || '');
  const isProfileRtl = isArabicText(activeProfile.displayName) || isArabicText(activeProfile.bio);

  const handleProfileSelect = (index: number) => {
    setSelectedProfileIndex(index);
    setSelectedThemeId(currentProfiles[index]?.themeId || DEMO_PROFILES[index].themeId);
  };

  return (
    <section ref={heroRef} className="hero-section marketing-hero relative overflow-hidden pt-8 pb-12 md:pt-10 md:pb-14 lg:pt-12 lg:pb-16 border-b border-neutral-200">
      <div className="raloa-hero-bg raloa-hero-bg--light opacity-40" aria-hidden="true" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-start">
          <HeroCopy onClaimUsername={onClaimUsername} />
          <HeroDevice
            currentProfiles={currentProfiles}
            selectedProfileIndex={selectedProfileIndex}
            onSelectProfile={handleProfileSelect}
            selectedThemeId={selectedThemeId}
            onSelectTheme={setSelectedThemeId}
            activeTheme={activeTheme}
            activeProfile={activeProfile}
            isProfileRtl={isProfileRtl}
            onOpenStudio={onOpenStudio}
          />
        </div>
      </div>
    </section>
  );
};
