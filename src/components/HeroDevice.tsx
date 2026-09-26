import React, { lazy, Suspense } from 'react';
import { Link } from 'wouter';
import { Palette } from 'lucide-react';
import { PhonePreview } from './PhonePreview';
import { type CreatorProfile, type ThemeConfig } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { HeroPreviewControls } from './HeroPreviewControls';
const CreatorAssemblyScene = lazy(() => import('./CreatorAssemblyScene').then(module => ({ default: module.CreatorAssemblyScene })));

interface HeroDeviceProps {
  currentProfiles: CreatorProfile[];
  selectedProfileIndex: number;
  onSelectProfile: (index: number) => void;
  selectedThemeId: string;
  onSelectTheme: (themeId: string) => void;
  activeTheme: ThemeConfig;
  activeProfile: CreatorProfile;
  isProfileRtl: boolean;
  onOpenStudio: (profile?: CreatorProfile) => void;
}

/** The right column: a real page, rendered by the same component the live page uses. */
export const HeroDevice: React.FC<HeroDeviceProps> = ({
  currentProfiles, selectedProfileIndex, onSelectProfile, selectedThemeId, onSelectTheme,
  activeTheme, activeProfile, isProfileRtl, onOpenStudio
}) => {
  const { t, tr: ui } = useLanguage();
  const theme = activeTheme;

  return (
    <div className="lg:col-span-5 flex flex-col items-center">
      {/* On a phone the device itself is the answer to "can I see one?", so it leads and
          its controls follow; on desktop the selector bar stays above the shell. */}
      <div className="order-2 flex w-full justify-center lg:order-1">
        <HeroPreviewControls
          currentProfiles={currentProfiles}
          selectedProfileIndex={selectedProfileIndex}
          onSelectProfile={onSelectProfile}
          selectedThemeId={selectedThemeId}
          onSelectTheme={onSelectTheme}
          activeTheme={activeTheme}
        />
      </div>

      <div data-hero="visual" className="order-1 mt-2 w-full max-w-[380px] lg:order-2 lg:mt-0">
        <div className="hero-device-meta flex items-center justify-between px-2 mb-2">
          <span className="flex items-center gap-1.5 font-mono text-xs font-medium text-neutral-600">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            {ui('Demo Profile')}
          </span>
          <span className="text-[11px] font-mono text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200">
            {ui('Sample Data')}
          </span>
        </div>
        <div className="hero-device-stage relative">
          <Suspense fallback={<div className="creator-assembly-loading" aria-hidden="true" />}><CreatorAssemblyScene /></Suspense>
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
  );
};
