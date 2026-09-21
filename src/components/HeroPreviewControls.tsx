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

        {/* Theme switcher: every preset the builder offers, drawn with the palette it actually applies */}
        <div className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs">
          <span className="flex items-center gap-1.5 font-medium text-neutral-600">
            <Palette className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.hero.themeLabel}</span>
            <strong className="text-neutral-900">{ui(activeTheme.name)}</strong>
          </span>

          <div className="mt-1 flex flex-wrap items-center gap-1">
            {THEMES.map((theme) => {
              const selected = selectedThemeId === theme.id;
              return (
                <button
                  key={theme.id}
                  aria-pressed={selected}
                  onClick={() => onSelectTheme(theme.id)}
                  title={ui(theme.name)}
                  aria-label={ui(theme.name)}
                  className={`grid h-11 w-11 cursor-pointer place-items-center rounded-full transition-transform duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    selected ? '' : 'hover:scale-110'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`grid h-6 w-6 place-items-center rounded-full border transition-shadow duration-200 ${
                      selected ? 'ring-2 ring-neutral-900 ring-offset-2 ring-offset-neutral-50' : ''
                    }`}
                    style={{
                      background: theme.bgType === 'gradient' ? theme.bgGradient : theme.bgColor,
                      borderColor: theme.isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.14)'
                    }}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: theme.accentColor,
                        boxShadow: theme.isDark ? '0 0 0 1px rgba(255,255,255,0.35)' : '0 0 0 1px rgba(0,0,0,0.12)'
                      }}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
