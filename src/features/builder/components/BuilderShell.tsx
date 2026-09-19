import React, { useState } from 'react';
import { Key, X, AlertCircle, Check, Copy, Sliders, Smartphone } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { useBuilder } from '../context/BuilderContext';
import { BuilderToolbar } from './BuilderToolbar';
import { BuilderSidebar } from './BuilderSidebar';
import { PreviewControls } from './PreviewControls';
import { ContentPanel } from './panels/ContentPanel';
import { AppearancePanel } from './panels/AppearancePanel';
import { AnalyticsPanel } from './panels/AnalyticsPanel';
import { SettingsPanel } from './panels/SettingsPanel';
import { Modal } from '../../../components/Modal';
import { QrCodeModal } from '../../../components/QrCodeModal';
import { LinktreeImporterModal } from '../../../components/LinktreeImporterModal';
import { api } from '../../../services/api';
import { resolveTheme } from '../../../utils/colorContrast';
import { initialPageId } from '../utils/builder.utils';

export const BuilderShell: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    activeTab,
    profile,
    setProfile,
    setCustomTheme,
    activePageId,
    setActivePageId,
    fileInputRef,
    handleAvatarFileSelect,
    saveErrorBanner,
    dataError,
    qrModalOpen,
    setQrModalOpen,
    showImporterModal,
    setShowImporterModal,
    setShowAddMenu,
    deletePageId,
    setDeletePageId,
    handleDeletePage,
    deleteProfileId,
    setDeleteProfileId,
    handleDeleteProfile,
    showNewProfileModal,
    setShowNewProfileModal,
    createProfileError,
    newUsername,
    setNewUsername,
    newDisplayName,
    setNewDisplayName,
    isCreatingProfile,
    handleCreateProfileSubmit,
    showNewKeyModal,
    setShowNewKeyModal,
    createdApiKey,
    setCreatedApiKey,
    newKeyName,
    setNewKeyName,
    copiedKey,
    handleCopyKey,
    generateKeyError,
    isGeneratingKey,
    handleGenerateApiKeySubmit
  } = useBuilder();

  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');

  return (
    <div className="studio-shell min-h-[calc(100vh-72px)] bg-neutral-50 border-t border-neutral-200 flex flex-col">
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
          {activeTab === 'appearance' && <AppearancePanel />}
          {activeTab === 'analytics' && <AnalyticsPanel />}
          {activeTab === 'settings' && <SettingsPanel />}
        </div>

        {/* Right Phone Live Preview Simulator (5 cols) */}
        <div className={"lg:col-span-5 " + (mobileTab === 'editor' ? 'hidden lg:block' : 'block')}>
          <PreviewControls />
        </div>
      </div>

      {/* Mobile Switcher Floating Bar */}
      <div className="lg:hidden fixed bottom-6 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
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

      {/* QR Code Modal */}
      <QrCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        username={profile.username}
        displayName={profile.displayName}
        pages={profile.pages}
        customDomain={profile.customDomain}
      />

      {/* Linktree Importer Modal */}
      <LinktreeImporterModal
        isOpen={showImporterModal}
        onClose={() => setShowImporterModal(false)}
        onAddManual={() => setShowAddMenu(true)}
        onImportComplete={async () => {
          try {
            const liveProfile = await api.studio.getProfile();
            setProfile(liveProfile);
            if (!liveProfile.pages?.some(item => item.id === activePageId)) {
              setActivePageId(initialPageId(liveProfile));
            }
            const th = resolveTheme(liveProfile.themeId, liveProfile.customTheme);
            setCustomTheme(th);
          } catch (err) {
            console.error('Failed to reload profile after import', err);
          }
        }}
        pages={profile.pages || []}
      />

      {/* Delete Page Modal */}
      <Modal open={Boolean(deletePageId)} onClose={() => setDeletePageId(null)} label={ui('Confirm page deletion')}>
        <div className="space-y-4 bg-white p-6 text-neutral-900">
          <div>
            <h2 className="text-base font-bold">{ui('Delete this page?')}</h2>
            <p className="mt-2 text-sm text-neutral-600">
              {ui('This page will be deleted. Its blocks will move to Home in their current order and will not be deleted.')}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeletePageId(null)}
              className="rounded-xl border border-neutral-300 px-4 py-2 text-xs font-semibold"
            >
              {ui('Cancel')}
            </button>
            <button
              type="button"
              onClick={() => deletePageId && void handleDeletePage(deletePageId)}
              className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white"
            >
              {ui('Delete page')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Profile Modal */}
      <Modal open={Boolean(deleteProfileId)} onClose={() => setDeleteProfileId(null)} label={ui('Confirm profile deletion')}>
        <div className="space-y-4 bg-white p-6 text-neutral-900">
          <div>
            <h2 className="text-base font-bold">{ui('Delete this profile?')}</h2>
            <p className="mt-2 text-sm text-neutral-600">
              {ui('This removes the selected profile and its pages, blocks, files, forms, subscribers, and provider connection. Your current profile remains active.')}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteProfileId(null)}
              className="rounded-xl border border-neutral-300 px-4 py-2 text-xs font-semibold"
            >
              {ui('Cancel')}
            </button>
            <button
              type="button"
              onClick={() => deleteProfileId && void handleDeleteProfile(deleteProfileId)}
              className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white"
            >
              {ui('Delete profile')}
            </button>
          </div>
        </div>
      </Modal>

      {/* New Profile Creation Modal */}
      <Modal open={showNewProfileModal} onClose={() => setShowNewProfileModal(false)} label={ui('Create New Bio Profile')}>
        <div className="bg-neutral-50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in border border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-neutral-900">{ui("Create New Bio Profile")}</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {ui("Add another project, brand, or persona under your account.")}
              </p>
            </div>
            <button
              onClick={() => setShowNewProfileModal(false)}
              className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          {createProfileError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {createProfileError}
            </div>
          )}

          <form onSubmit={handleCreateProfileSubmit} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="create-profile-username" className="text-xs font-semibold text-neutral-800">{ui("Handle (Username)")}</label>
              <div className="flex items-center rounded-xl border border-neutral-200 bg-neutral-50 px-3 focus-within:bg-neutral-50 focus-within:border-neutral-900">
                <span className="text-xs font-mono text-neutral-400">@</span>
                <input
                  id="create-profile-username"
                  name="username"
                  autoComplete="username"
                  aria-label={ui("Handle (Username)")}
                  type="text"
                  required
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder={ui("myotherbrand")}
                  className="w-full text-xs font-mono p-2 bg-transparent outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="create-profile-display-name" className="text-xs font-semibold text-neutral-800">{ui("Display Name")}</label>
              <input
                id="create-profile-display-name"
                name="displayName"
                autoComplete="name"
                aria-label={ui("Display Name")}
                type="text"
                required
                value={newDisplayName}
                onChange={e => setNewDisplayName(e.target.value)}
                placeholder={ui("My Other Brand")}
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-neutral-50 focus:border-neutral-900 outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewProfileModal(false)}
                className="px-4 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold text-neutral-700 cursor-pointer"
              >
                {ui("Cancel")}
              </button>
              <button
                type="submit"
                disabled={isCreatingProfile || !newUsername.trim() || !newDisplayName.trim()}
                className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isCreatingProfile ? ui("Creating...") : ui("Create Profile")}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Generate API Key Modal */}
      <Modal
        open={showNewKeyModal}
        onClose={() => {
          setShowNewKeyModal(false);
          setCreatedApiKey(null);
          setNewKeyName('');
        }}
        label={createdApiKey ? ui('API Key Generated') : ui('Generate Studio API Key')}
      >
        <div className="bg-neutral-50 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
                <Key className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-neutral-900">
                {createdApiKey ? ui("API Key Generated") : ui("Generate Studio API Key")}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowNewKeyModal(false);
                setCreatedApiKey(null);
                setNewKeyName('');
              }}
              className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {createdApiKey ? (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  <strong>{ui("Make sure to copy your API key now.")}</strong> {ui("You won't be able to see it again! Store it in an environment variable or secrets manager.")}
                </span>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="created-live-api-key" className="text-xs font-semibold text-neutral-800">{ui("Your Live Secret Key")}</label>
                <div className="flex items-center gap-2">
                  <input
                    id="created-live-api-key"
                    name="createdApiKey"
                    aria-label={ui("Your Live Secret Key")}
                    type="text"
                    readOnly
                    value={createdApiKey}
                    className="w-full text-xs font-mono p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 select-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyKey(createdApiKey)}
                    className="px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? ui("Copied") : ui("Copy")}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewKeyModal(false);
                    setCreatedApiKey(null);
                    setNewKeyName('');
                  }}
                  className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold cursor-pointer"
                >
                  {ui("Done")}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleGenerateApiKeySubmit} className="space-y-4">
              {generateKeyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {generateKeyError}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="new-api-key-name" className="text-xs font-semibold text-neutral-800">{ui("Key Name / Description")}</label>
                <input
                  id="new-api-key-name"
                  name="newKeyName"
                  aria-label={ui("Key Name / Description")}
                  type="text"
                  required
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  placeholder={ui("e.g., Zapier Sync, Mobile App Integration")}
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-neutral-50 focus:border-neutral-900 outline-none"
                />
                <p className="text-[11px] text-neutral-400">
                  {ui("Give your API key a recognizable name so you can track where it is being used.")}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewKeyModal(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold text-neutral-700 cursor-pointer"
                >
                  {ui("Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingKey || !newKeyName.trim()}
                  className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingKey ? ui("Generating...") : ui("Generate Key")}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};
