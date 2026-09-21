import React, { useState } from 'react';
import { Sliders, Smartphone } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { useBuilder } from '../context/BuilderContext';
import { BuilderToolbar } from './BuilderToolbar';
import { BuilderSidebar } from './BuilderSidebar';
import { PreviewControls } from './PreviewControls';
import { ContentPanel } from './panels/ContentPanel';
import { AppearancePanel } from './panels/AppearancePanel';
import { AnalyticsPanel } from './panels/AnalyticsPanel';
import { SettingsPanel } from './panels/SettingsPanel';
import { AudiencePanel } from './panels/AudiencePanel';
import { StudioMobileTabBar } from './StudioMobileTabBar';

export const BuilderWorkspace: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    activeTab,
    fileInputRef,
    handleAvatarFileSelect,
    saveErrorBanner,
    dataError
  } = useBuilder();

  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');

  return (
    <>
      {/* Hidden File Input for Avatar Upload */}
      <input
        id="builder-avatar-file-input"
        name="avatarFile"
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Studio Top Control Bar */}
      <BuilderToolbar />

      {/* Error Banners */}
      {saveErrorBanner && <p role="alert" className="p-4 text-red-700">{ui(saveErrorBanner)}</p>}
      {dataError && <p role="alert" className="p-4 text-red-700">{ui('Could not load data. Reopen this tab to retry.')}</p>}

      {/* Main Studio Workspace: Left Editor + Right Simulator */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Control Canvas (7 cols) */}
        <div className={"studio-controls lg:col-span-7 space-y-6 " + (mobileTab === 'preview' ? 'hidden lg:block' : 'block')}>
          <BuilderSidebar />

          {activeTab === 'content' && <ContentPanel />}
          {activeTab === 'design' && <AppearancePanel />}
          {activeTab === 'audience' && <AudiencePanel />}
          {activeTab === 'analytics' && <AnalyticsPanel />}
          {activeTab === 'settings' && <SettingsPanel />}
        </div>

        {/* Right Phone Live Preview Simulator (5 cols) */}
        <div className={"lg:col-span-5 " + (mobileTab === 'editor' ? 'hidden lg:block' : 'block')}>
          <PreviewControls />
        </div>
      </div>

      {/* Mobile Switcher Floating Bar */}
      <StudioMobileTabBar />

      {/* Editor / Live Preview switch, lifted clear of the tab bar */}
      <div className="studio-mobile-switcher lg:hidden fixed bottom-20 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
        <div className="pointer-events-auto bg-neutral-900/90 backdrop-blur-md p-1 rounded-full shadow-2xl border border-neutral-700/60 flex items-center gap-1 text-xs font-semibold text-white">
          <button
            type="button"
            onClick={() => setMobileTab('editor')}
            className={"flex items-center gap-1.5 px-4 py-2 rounded-full transition-colors cursor-pointer " + (mobileTab === 'editor' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-300 hover:text-white')}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{ui('Editor')}</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={"flex items-center gap-1.5 px-4 py-2 rounded-full transition-colors cursor-pointer " + (mobileTab === 'preview' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-300 hover:text-white')}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{ui('Live Preview')}</span>
          </button>
        </div>
      </div>
    </>
  );
};
