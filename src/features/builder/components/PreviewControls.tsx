import React from 'react';
import { Smartphone, Tablet, Monitor } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { useBuilder } from '../context/BuilderContext';
import { ViewportPreview } from '../../../components/ViewportPreview';

export const PreviewControls: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    previewDevice,
    setPreviewDevice,
    profile,
    visibleBlocks,
    activePage,
    customTheme
  } = useBuilder();

  return (
    <div className="studio-preview lg:col-span-5 sticky top-28 flex flex-col items-center">
      {/* Responsive Viewport Switcher */}
      <div className="flex items-center gap-1 mb-3 p-1 bg-neutral-100 rounded-full border border-neutral-200 text-xs shadow-xs">
        <button
          onClick={() => setPreviewDevice('mobile')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
            previewDevice === 'mobile' ? 'bg-neutral-50 shadow-xs text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="preview-label">{ui("Mobile")}</span>
        </button>
        <button
          onClick={() => setPreviewDevice('tablet')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
            previewDevice === 'tablet' ? 'bg-neutral-50 shadow-xs text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Tablet className="w-3.5 h-3.5" />
          <span className="preview-label">{ui("Tablet")}</span>
        </button>
        <button
          onClick={() => setPreviewDevice('desktop')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
            previewDevice === 'desktop' ? 'bg-neutral-50 shadow-xs text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="preview-label">{ui("Desktop")}</span>
        </button>
      </div>

      <ViewportPreview
        profile={{
          ...profile,
          blocks: visibleBlocks,
          pages: activePage ? [activePage] : profile.pages,
          page: activePage
        }}
        customTheme={customTheme}
        deviceMode={previewDevice}
      />
    </div>
  );
};
