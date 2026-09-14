import React, { useState } from 'react';
import { PhonePreview } from './PhonePreview';
import { DEMO_PROFILES, THEMES } from '../data/mockData';
import { CreatorProfile, ThemeConfig } from '../types';
import { 
  ArrowRight, 
  ShieldCheck, 
  Palette, 
  Check, 
  Zap,
  MousePointer2,
  LayoutTemplate
} from 'lucide-react';
import { brand } from '../config/brand';

interface HeroProps {
  onClaimUsername: (handle: string) => void;
  onOpenStudio: (profile?: CreatorProfile) => void;
}

export const Hero: React.FC<HeroProps> = ({ onClaimUsername, onOpenStudio }) => {
  const [handle, setHandle] = useState('');
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const [selectedThemeId, setSelectedThemeId] = useState<string>(DEMO_PROFILES[0].themeId);

  const activeProfile = DEMO_PROFILES[selectedProfileIndex];
  const activeTheme = THEMES.find(t => t.id === selectedThemeId) || THEMES[0];

  const handleProfileSelect = (index: number) => {
    setSelectedProfileIndex(index);
    setSelectedThemeId(DEMO_PROFILES[index].themeId);
  };

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (handle.trim()) {
      onClaimUsername(handle.trim());
    } else {
      onOpenStudio(activeProfile);
    }
  };

  return (
    <section className="py-20 md:py-28 lg:py-32 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Brand Copy & Claimer */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-neutral-900 leading-[1.08] mb-6 text-balance">
              Your entire world. <span className="hero-accent">Designed your way.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-neutral-600 leading-relaxed max-w-xl mb-8 text-pretty">
              Create a beautiful mini-site for everything you make, sell and share. No code, no cookie-cutter templates.
            </p>

            {/* Claim Handle Hero Form */}
            <div className="w-full max-w-lg mb-8">
              <form 
                onSubmit={handleClaim}
                className="p-1.5 bg-white rounded-full border border-neutral-300 shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 focus-within:border-neutral-900 transition-colors"
              >
                <div className="flex items-center pl-4 py-2 sm:py-0 flex-1">
                  <span className="text-neutral-500 font-mono text-sm sm:text-base font-semibold select-none">
                    {brand.domain}/@
                  </span>
                  <input
                    id="hero-claim-input"
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="yourname"
                    className="w-full pl-1 outline-none font-mono text-sm sm:text-base font-bold text-neutral-900 placeholder-neutral-400 bg-transparent"
                    spellCheck={false}
                    aria-label={`Claim your ${brand.productShortName} handle`}
                  />
                </div>
                
                <button
                  id="hero-claim-btn"
                  type="submit"
                  className="px-6 py-3 sm:py-3.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-bold tracking-tight transition-colors active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-2"
                >
                  <span>Claim My Link</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500 pl-2">
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span>Free to start</span>
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span>No credit card needed</span>
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span>Publish in minutes</span>
                </span>
              </div>
            </div>

            {/* Social Proof & Metrics row */}
            <div className="hero-proof pt-4 border-t border-neutral-200 w-full flex flex-wrap gap-x-5 gap-y-2 text-xs text-neutral-500">
              <span className="inline-flex items-center gap-1.5"><MousePointer2 className="w-3.5 h-3.5 text-amber-600" />Live preview while you build</span>
              <span className="inline-flex items-center gap-1.5"><LayoutTemplate className="w-3.5 h-3.5 text-amber-600" />Distinct templates, not skins</span>
            </div>

          </div>

          {/* Right Column: Interactive Device & Controls */}
          <div className="lg:col-span-5 flex flex-col items-center">
            
            {/* Interactive Selector Bar */}
            <div className="w-full max-w-[380px] mb-6 space-y-3">
              {/* Profile switcher tabs */}
              <div className="flex items-center justify-between gap-1 p-1 bg-neutral-100 border border-neutral-200 rounded-full">
                {DEMO_PROFILES.map((prof, idx) => (
                  <button
                    key={prof.id}
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
              <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs">
                <span className="text-[11px] font-medium text-neutral-500 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  <span>Theme:</span>
                  <strong className="text-neutral-900">{activeTheme.name}</strong>
                </span>
                
                <div className="flex items-center gap-1.5">
                  {THEMES.map(theme => (
                    <button
                      key={theme.id}
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
            </div>

            {/* Live Interactive Device Preview (compact mode) */}
            <PhonePreview 
              profile={activeProfile}
              customTheme={activeTheme}
              interactive={true}
              compact={true}
            />

            {/* Quick Action below Phone */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => onOpenStudio(activeProfile)}
                className="px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-xs font-semibold text-neutral-900 flex items-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
              >
                <Palette className="w-3.5 h-3.5 text-amber-600" />
                <span>Customize {activeProfile.displayName.split(' ')[0]}'s Page</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
