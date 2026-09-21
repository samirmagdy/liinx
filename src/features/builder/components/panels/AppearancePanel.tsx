import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { THEMES } from '../../../../config/themes';
import { type ThemeConfig } from '../../../../types';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';

const ACCENT_COLORS = [
  { hex: '#B45309', name: 'Amber' },
  { hex: '#3B82F6', name: 'Blue' },
  { hex: '#EC4899', name: 'Pink' },
  { hex: '#10B981', name: 'Emerald' },
  { hex: '#0F172A', name: 'Navy ink' },
  { hex: '#8B5CF6', name: 'Violet' },
];

export const AppearancePanel: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    customTheme,
    handleThemeSelect,
    updateThemeOverride
  } = useBuilder();

  const [previousCustomTheme, setPreviousCustomTheme] = useState<ThemeConfig | null>(null);

  const onSelectPreset = (th: ThemeConfig) => {
    if (!previousCustomTheme) {
      setPreviousCustomTheme({ ...customTheme });
    }
    handleThemeSelect(th);
  };

  const handleRevertTheme = () => {
    if (previousCustomTheme) {
      handleThemeSelect(previousCustomTheme);
      setPreviousCustomTheme(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-neutral-900">{ui("Curated Visual Presets")}</h2>
          {previousCustomTheme && (
            <button
              type="button"
              onClick={handleRevertTheme}
              className="text-xs font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{ui("Undo preset change")}</span>
            </button>
          )}
        </div>
        <p className="text-xs text-neutral-500">
          {ui("Choose from carefully crafted aesthetic profiles. Every palette is built with strong contrast and responsive tokens.")}
        </p>
        <p className="text-xs text-amber-800" role="note">{ui("Selecting a preset replaces custom appearance overrides.")}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {THEMES.map((th) => (
            <button
              key={th.id}
              onClick={() => onSelectPreset(th)}
              className={`p-3.5 rounded-xl border text-start flex items-center justify-between transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                customTheme.id === th.id 
                  ? 'border-neutral-900 ring-2 ring-neutral-900/10 shadow-sm bg-neutral-50' 
                  : 'border-neutral-200 hover:border-neutral-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-7 h-7 rounded-full shadow-inner border border-black/10 shrink-0" 
                  style={{ background: th.bgType === 'gradient' ? th.bgGradient : th.bgColor }}
                />
                <div>
                  <p className="font-bold text-xs text-neutral-900">{th.name}</p>
                  <p className="text-xs text-neutral-500 font-mono capitalize">{th.fontFamily} {ui("font")}</p>
                </div>
              </div>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${th.isDark ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-900'}`}>
                {th.isDark ? ui("Dark") : ui("Light")}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Geometry & Radius Control */}
      <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <h2 className="font-bold text-sm text-neutral-900">{ui("Card Geometry & Accent Tint")}</h2>
        
        <div className="grid grid-cols-4 gap-2">
          {(['none', 'md', 'xl', 'full'] as const).map((rad) => (
            <button
              key={rad}
              onClick={() => {
                updateThemeOverride({ cardRadius: rad });
              }}
              className={`py-2 px-3 border rounded-xl text-xs font-semibold capitalize transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                customTheme.cardRadius === rad 
                  ? 'border-neutral-900 bg-neutral-900 text-white' 
                  : 'border-neutral-200 bg-neutral-50 text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              {rad === 'none' ? ui("Square") : rad === 'full' ? ui("Pill") : rad}
            </button>
          ))}
        </div>

        <div className="pt-2">
          <span className="block text-xs font-semibold text-neutral-600 mb-2">{ui("Brand Accent Color")}</span>
          <div className="flex items-center gap-0.5">
            {ACCENT_COLORS.map(({ hex, name }) => (
              <button
                key={hex}
                type="button"
                aria-pressed={customTheme.accentColor === hex}
                title={name}
                aria-label={name}
                onClick={() => {
                  updateThemeOverride({ accentColor: hex });
                }}
                className={`grid h-11 w-11 cursor-pointer place-items-center rounded-full transition-transform ${
                  customTheme.accentColor === hex ? 'scale-100' : 'opacity-80 hover:opacity-100'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-8 w-8 rounded-full border border-neutral-300 ${
                    customTheme.accentColor === hex ? 'ring-2 ring-neutral-900 ring-offset-1' : ''
                  }`}
                  style={{ backgroundColor: hex }}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-neutral-200 pt-3 sm:grid-cols-2">
          <label htmlFor="appearance-card-surface" className="flex items-center justify-between gap-3 text-xs font-semibold text-neutral-700">
            <span>{ui("Card surface")}</span>
            <input
              id="appearance-card-surface"
              name="cardSurface"
              type="color"
              aria-label={ui("Card surface")}
              value={/^#[\da-f]{6}$/i.test(customTheme.cardBg) ? customTheme.cardBg : '#FFFFFF'}
              onChange={event => updateThemeOverride({ cardBg: event.target.value })}
              className="h-8 w-12 cursor-pointer rounded border border-neutral-300"
            />
          </label>
          <label htmlFor="appearance-card-border" className="flex items-center justify-between gap-3 text-xs font-semibold text-neutral-700">
            <span>{ui("Card border")}</span>
            <select
              id="appearance-card-border"
              name="cardBorder"
              aria-label={ui("Card border")}
              value={customTheme.cardBorder}
              onChange={event => updateThemeOverride({ cardBorder: event.target.value })}
              className="max-w-40 rounded-lg border border-neutral-300 px-2 py-1.5 text-xs font-normal"
            >
              <option value="1px solid #E5E5E0">{ui("Subtle")}</option>
              <option value="1px solid #A3A3A3">{ui("Strong")}</option>
              <option value="0px none #000000">{ui("None")}</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
};
