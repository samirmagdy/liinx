import React from 'react';
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

const RADIUS_OPTIONS = ['none', 'md', 'xl', 'full'] as const;

export const ThemeGeometryCard: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { customTheme, updateThemeOverride } = useBuilder();

  return (
    <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
      <h2 className="font-bold text-sm text-neutral-900">{ui("Card Geometry & Accent Tint")}</h2>

      <div className="grid grid-cols-4 gap-2">
        {RADIUS_OPTIONS.map((rad) => (
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
  );
};
