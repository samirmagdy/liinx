import React from 'react';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { useBuilder } from '../context/BuilderContext';
import { STUDIO_TABS } from '../config/studioNavigation';
import { Layers, Palette, Users, BarChart3, Settings } from 'lucide-react';

const TAB_ICONS = {
  content: Layers,
  design: Palette,
  audience: Users,
  analytics: BarChart3,
  settings: Settings
} as const;

export const BuilderSidebar: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { activeTab, setActiveTab } = useBuilder();

  return (
    <nav
      className="studio-tabs hidden lg:flex items-center p-1 bg-neutral-50 border border-neutral-200 rounded-2xl shadow-xs gap-1"
      aria-label={ui('Studio sections')}
    >
      {STUDIO_TABS.map(tab => {
        const Icon = TAB_ICONS[tab.id];
        const selected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            aria-current={selected ? 'page' : undefined}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-h-11 rounded-xl px-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              selected ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{ui(tab.label)}</span>
          </button>
        );
      })}
    </nav>
  );
};
