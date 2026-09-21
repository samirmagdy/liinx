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
  const { t, tr: ui, isRtl } = useLanguage();
  const visibleProfileCount = Math.max(1, Math.min(currentProfiles.length, 4));

  return (
    <div data-hero="controls" className="w-full max-w-[380px] mb-3.5">
      <div className="space-y-2.5">
        <p className="text-xs font-semibold text-neutral-600 text-center">{t.hero.previewSubtitle}</p>
        
        {/* Profile switcher tabs */}
        <div className="relative isolate flex items-center justify-between gap-1 p-1 bg-neutral-100 border border-neutral-200 rounded-full">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1 bottom-1 rounded-full bg-neutral-900"
            style={{
              insetInlineStart: '4px',
              width: `calc((100% - 8px) / ${visibleProfileCount})`,
              transform: `translateX(${selectedProfileIndex * (isRtl ? -100 : 100)}%)`,
              transition: 'transform 260ms var(--motion-ease-out)',
            }}
          />
          {currentProfiles.slice(0, 4).map((prof, idx) => (
            <button
              key={prof.id}
              aria-pressed={selectedProfileIndex === idx}
              onClick={() => onSelectProfile(idx)}
              className={`relative z-10 flex-1 py-1.5 px-2 rounded-full text-[11px] font-semibold transition-colors duration-200 truncate cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                selectedProfileIndex === idx
                  ? 'text-white'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {prof.displayName.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Theme switcher dots */}
        <div className="flex flex-wrap gap-2 items-center justify-between px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs">
          <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-600">
            <Palette className="w-3.5 h-3.5" />
            <span>{t.hero.themeLabel}</span>
            <strong className="text-neutral-900">{ui(activeTheme.name)}</strong>
          </span>

          <div className="flex items-center gap-0.5">
            {THEMES.slice(0, 6).map((theme) => (
              <button
                key={theme.id}
                aria-pressed={selectedThemeId === theme.id}
                onClick={() => onSelectTheme(theme.id)}
                title={theme.name}
                aria-label={`Select ${theme.name} theme`}
                className={`grid h-11 w-11 cursor-pointer place-items-center rounded-full transition-transform duration-200 active:scale-95 ${
                  selectedThemeId === theme.id ? 'scale-100' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-5 w-5 rounded-full border transition-shadow duration-200 ${
                    selectedThemeId === theme.id ? 'ring-2 ring-neutral-900 ring-offset-1' : ''
                  }`}
                  style={{
                    backgroundColor: theme.bgColor,
                    borderColor: theme.isDark ? '#555' : '#ccc'
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
