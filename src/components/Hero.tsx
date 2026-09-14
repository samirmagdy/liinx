import React, { useState } from 'react';
import { PhonePreview } from './PhonePreview';
import { DEMO_PROFILES, THEMES } from '../data/mockData';
import { CreatorProfile, ThemeConfig } from '../types';
import { 
  ArrowRight, 
  ShieldCheck, 
  Palette, 
  Sliders, 
  Check, 
  Globe2, 
  Zap, 
  Eye, 
  LayoutGrid, 
  ExternalLink 
} from 'lucide-react';

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
    <section className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24 border-b border-[#ECE8DF]">
      {/* Background architectural grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#d5d1c8_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Brand Copy & Claimer */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18181B]/5 border border-[#18181B]/10 text-xs font-semibold text-[#18181B] mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIINX 2.0 Studio is Live</span>
              <span className="text-[#71717A]">•</span>
              <span className="text-amber-700 font-mono text-[11px]">Free 14-Day Pro Trial</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-[#111315] leading-[1.08] mb-6">
              The design-first link in bio for <span className="underline decoration-amber-400 decoration-wavy decoration-2">creators</span> & modern brands.
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-[#52525B] leading-relaxed max-w-2xl mb-8">
              No generic buttons, no corporate clutter, and no cookie-cutter templates. 
              Embed playable music, rich media, accordion folders, and connect your own custom domain.
            </p>

            {/* Claim Handle Hero Form */}
            <div className="w-full max-w-lg mb-8">
              <form 
                onSubmit={handleClaim}
                className="p-1.5 bg-white rounded-2xl sm:rounded-full border-2 border-[#18181B] shadow-[0_10px_30px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
              >
                <div className="flex items-center pl-4 py-2 sm:py-0 flex-1">
                  <span className="text-[#71717A] font-mono text-sm sm:text-base font-semibold select-none">
                    liinx.co/@
                  </span>
                  <input
                    id="hero-claim-input"
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="yourname"
                    className="w-full pl-1 outline-none font-mono text-sm sm:text-base font-bold text-[#18181B] placeholder-[#A1A1AA] bg-transparent"
                  />
                </div>
                
                <button
                  id="hero-claim-btn"
                  type="submit"
                  className="px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-full bg-[#18181B] hover:bg-black text-white text-sm font-bold tracking-tight transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <span>Claim My Link</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              <div className="flex items-center gap-4 mt-3 text-xs text-[#71717A] pl-2">
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span>Always free to build</span>
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span>No credit card needed</span>
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span>Custom domain ready</span>
                </span>
              </div>
            </div>

            {/* Social Proof & Metrics row */}
            <div className="pt-4 border-t border-[#E8E6DF] w-full grid grid-cols-3 gap-4">
              <div>
                <p className="font-brand font-bold text-2xl text-[#111315]">150K+</p>
                <p className="text-xs text-[#71717A]">Curated Profiles</p>
              </div>
              <div>
                <p className="font-brand font-bold text-2xl text-[#111315]">&lt; 85ms</p>
                <p className="text-xs text-[#71717A]">Edge Page Speed</p>
              </div>
              <div>
                <p className="font-brand font-bold text-2xl text-[#111315]">0%</p>
                <p className="text-xs text-[#71717A]">Commission Taken</p>
              </div>
            </div>

          </div>

          {/* Right Column: Live Interactive Device & Showcase Controls */}
          <div className="lg:col-span-5 flex flex-col items-center">
            
            {/* Interactive Selector Bar */}
            <div className="w-full max-w-[380px] mb-4 space-y-2.5">
              {/* Profile switcher tabs */}
              <div className="flex items-center justify-between gap-1 p-1 bg-white/80 backdrop-blur-sm border border-[#E2DFD8] rounded-2xl shadow-xs">
                {DEMO_PROFILES.map((prof, idx) => (
                  <button
                    key={prof.id}
                    onClick={() => handleProfileSelect(idx)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all truncate cursor-pointer ${
                      selectedProfileIndex === idx
                        ? 'bg-[#18181B] text-white shadow-xs'
                        : 'text-[#71717A] hover:text-[#18181B] hover:bg-black/5'
                    }`}
                  >
                    {prof.displayName.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Theme switcher dots */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-white/60 border border-[#E2DFD8] rounded-xl text-xs">
                <span className="text-[11px] font-medium text-[#71717A] flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  <span>Theme:</span>
                  <strong className="text-[#18181B]">{activeTheme.name}</strong>
                </span>
                
                <div className="flex items-center gap-1.5">
                  {THEMES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedThemeId(theme.id)}
                      title={theme.name}
                      className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                        selectedThemeId === theme.id 
                          ? 'ring-2 ring-[#18181B] ring-offset-1 scale-110' 
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ 
                        backgroundColor: theme.bgColor,
                        borderColor: theme.isDark ? '#4B5563' : '#D1D5DB'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Real Interactive Phone Simulator */}
            <PhonePreview 
              profile={activeProfile}
              customTheme={activeTheme}
              interactive={true}
            />

            {/* Quick Action below Phone */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => onOpenStudio(activeProfile)}
                className="px-4 py-2 rounded-full bg-white border border-[#DCD8CF] hover:border-black text-xs font-semibold text-[#18181B] shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                <span>Customize {activeProfile.displayName.split(' ')[0]}'s Page in Studio</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
