import React from 'react';
import { Palette } from 'lucide-react';
import { type CreatorProfile, type ThemeConfig } from '../types';
import { THEMES } from '../config/themes';
import { useLanguage } from '../context/LanguageContext';

interface HeroPreviewControlsProps {
  currentProfiles: CreatorProfile[];
  selectedProfileIndex: number;
  onSelectProfile: (index: number) => void;
  selectedThemeId: string;
  onSelectTheme: (themeId: string) => void;
  activeTheme: ThemeConfig;
}

export const HeroPreviewControls: React.FC<HeroPreviewControlsProps> = ({
  currentProfiles,
  selectedProfileIndex,
  onSelectProfile,
  selectedThemeId,
  onSelectTheme,
  activeTheme
}) => {
  const { t, tr: ui } = useLanguage();

  return (
    <div data-hero="controls" className="w-full max-w-[380px] mb-3.5">
      <div className="space-y-2.5">
        <p className="text-xs font-semibold text-neutral-600 text-center">{t.hero.previewSubtitle}</p>
        
        {/* Profile switcher tabs */}
        <div className="flex items-center justify-between gap-1 p-1 bg-neutral-100 border border-neutral-200 rounded-full">
          {currentProfiles.slice(0, 4).map((prof, idx) => (
            <button
              key={prof.id}
              aria-pressed={selectedProfileIndex === idx}
              onClick={() => onSelectProfile(idx)}
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
            <strong className="text-neutral-900">{ui(activeTheme.name)}</strong>
          </span>

          <div className="flex items-center gap-1.5">
            {THEMES.slice(0, 6).map((theme) => (
              <button
                key={theme.id}
                aria-pressed={selectedThemeId === theme.id}
                onClick={() => onSelectTheme(theme.id)}
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
    </div>
  );
};
