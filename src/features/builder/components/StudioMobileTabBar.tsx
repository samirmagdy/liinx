import React, { useState } from 'react';
import { Layers, Palette, Users, BarChart3, Settings, MoreHorizontal } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { useBuilder } from '../context/BuilderContext';
import { STUDIO_TABS } from '../config/studioNavigation';
import { type BuilderTab } from '../types/builder.types';

const BAR_ICONS: Record<BuilderTab, typeof Layers> = {
  content: Layers,
  design: Palette,
  audience: Users,
  analytics: BarChart3,
  settings: Settings
};

/**
 * On a phone there is no room for five full labels, so the bar carries the three tabs a
 * creator reaches for while building and folds Audience and Settings into "More".
 */
const PRIMARY: BuilderTab[] = ['content', 'design', 'analytics'];
const SECONDARY: BuilderTab[] = ['audience', 'settings'];

export const StudioMobileTabBar: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { activeTab, setActiveTab } = useBuilder();
  const [moreOpen, setMoreOpen] = useState(false);
  const inMore = SECONDARY.includes(activeTab);
  const labelFor = (id: BuilderTab) => STUDIO_TABS.find(tab => tab.id === id)?.shortLabel ?? id;

  const pick = (tab: BuilderTab) => {
    setActiveTab(tab);
    setMoreOpen(false);
  };

  return (
    <nav
      className="studio-mobile-tabs lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur-sm"
      aria-label={ui('Studio sections')}
    >
      {moreOpen && (
        <div className="absolute bottom-full inset-x-0 m-2 space-y-1 rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl">
          {SECONDARY.map(tab => {
            const Icon = BAR_ICONS[tab];
            return (
              <button
                key={tab}
                type="button"
                onClick={() => pick(tab)}
                className={`flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-[13px] font-semibold ${
                  activeTab === tab ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {ui(STUDIO_TABS.find(item => item.id === tab)?.label ?? tab)}
              </button>
            );
          })}
        </div>
      )}

      <div className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {PRIMARY.map(tab => {
          const Icon = BAR_ICONS[tab];
          const selected = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              aria-current={selected ? 'page' : undefined}
              onClick={() => pick(tab)}
              className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[13px] font-bold ${
                selected ? 'text-neutral-900' : 'text-neutral-500'
              }`}
            >
              <Icon className={`w-5 h-5 ${selected ? 'text-neutral-900' : 'text-neutral-400'}`} aria-hidden="true" />
              <span>{ui(labelFor(tab))}</span>
            </button>
          );
        })}
        <button
          type="button"
          aria-expanded={moreOpen}
          aria-current={inMore ? 'page' : undefined}
          onClick={() => setMoreOpen(open => !open)}
          className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[13px] font-bold ${
            inMore || moreOpen ? 'text-neutral-900' : 'text-neutral-500'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
          <span>{ui('More')}</span>
        </button>
      </div>
    </nav>
  );
};
