import React from 'react';
import { THEMES } from '../../../../config/themes';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';

export const AppearancePanel: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    customTheme,
    handleThemeSelect,
    updateThemeOverride
  } = useBuilder();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-neutral-900">{ui("Curated Visual Presets")}</h3>
        <p className="text-xs text-neutral-500">
          {ui("Choose from carefully crafted aesthetic profiles. Every palette is built with strong contrast and responsive tokens.")}
        </p>
        <p className="text-[11px] text-amber-800" role="note">{ui("Selecting a preset replaces custom appearance overrides.")}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {THEMES.map((th) => (
            <button
              key={th.id}
              onClick={() => handleThemeSelect(th)}
              className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
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
                  <p className="text-[10px] text-neutral-500 font-mono capitalize">{th.fontFamily} {ui("font")}</p>
                </div>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${th.isDark ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-900'}`}>
                {th.isDark ? ui("Dark") : ui("Light")}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Geometry & Radius Control */}
      <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-neutral-900">{ui("Card Geometry & Accent Tint")}</h3>
        
        <div className="grid grid-cols-4 gap-2">
          {(['none', 'md', 'xl', 'full'] as const).map((rad) => (
            <button
              key={rad}
              onClick={() => {
                updateThemeOverride({ cardRadius: rad });
              }}
              className={`py-2 px-3 border rounded-xl text-xs font-semibold capitalize transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
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
          <label className="block text-xs font-semibold text-[#71717A] mb-2">{ui("Brand Accent Color")}</label>
          <div className="flex items-center gap-2.5">
            {['#B45309', '#3B82F6', '#EC4899', '#10B981', '#18181B', '#8B5CF6'].map((col) => (
              <button
                key={col}
                onClick={() => {
                  updateThemeOverride({ accentColor: col });
                }}
                className={`w-8 h-8 rounded-full border transition-transform cursor-pointer ${
                  customTheme.accentColor === col ? 'ring-2 ring-black scale-110' : 'opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: col }}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-neutral-200 pt-3 sm:grid-cols-2">
          <label className="flex items-center justify-between gap-3 text-xs font-semibold text-neutral-700">
            <span>{ui("Card surface")}</span>
            <input
              type="color"
              aria-label={ui("Card surface")}
              value={/^#[\da-f]{6}$/i.test(customTheme.cardBg) ? customTheme.cardBg : '#FFFFFF'}
              onChange={event => updateThemeOverride({ cardBg: event.target.value })}
              className="h-8 w-12 cursor-pointer rounded border border-neutral-300"
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-xs font-semibold text-neutral-700">
            <span>{ui("Card border")}</span>
            <select
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
