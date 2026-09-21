import React from 'react';
import { Layers, Palette, BarChart3, Settings } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { useBuilder } from '../context/BuilderContext';

export const BuilderSidebar: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { activeTab, setActiveTab } = useBuilder();

  return (
    <div className="studio-tabs flex items-center p-1 bg-neutral-50 border border-neutral-200 rounded-2xl shadow-xs gap-1">
      <button
        onClick={() => setActiveTab('content')}
        className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          activeTab === 'content'
            ? 'bg-neutral-900 text-white shadow-xs'
            : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        <span>{ui("Blocks & Content")}</span>
      </button>

      <button
        onClick={() => setActiveTab('appearance')}
        className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          activeTab === 'appearance'
            ? 'bg-neutral-900 text-white shadow-xs'
            : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
        }`}
      >
        <Palette className="w-3.5 h-3.5" />
        <span>{ui("Themes & Styles")}</span>
      </button>

      <button
        onClick={() => setActiveTab('analytics')}
        className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          activeTab === 'analytics'
            ? 'bg-neutral-900 text-white shadow-xs'
            : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
        }`}
      >
        <BarChart3 className="w-3.5 h-3.5" />
        <span>{ui("Analytics")}</span>
      </button>

      <button
        onClick={() => setActiveTab('settings')}
        className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          activeTab === 'settings'
            ? 'bg-neutral-900 text-white shadow-xs'
            : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
        }`}
      >
        <Settings className="w-3.5 h-3.5" />
        <span>{ui("Settings & Plan")}</span>
      </button>
    </div>
  );
};
