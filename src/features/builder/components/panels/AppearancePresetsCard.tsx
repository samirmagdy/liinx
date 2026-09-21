import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { THEMES } from '../../../../config/themes';
import { type ThemeConfig } from '../../../../types';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';

export const AppearancePresetsCard: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { customTheme, handleThemeSelect } = useBuilder();

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
  );
};
