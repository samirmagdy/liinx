import React, { useState } from 'react';
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

      {/* Bottom chrome: the preview switch lives with the tabs so nothing floats over content */}
      <StudioMobileTabBar mobileTab={mobileTab} onMobileTabChange={setMobileTab} />
    </>
  );
};
