import React from 'react';
import {
  ChevronDown,
  Check,
  Plus,
  QrCode,
  Share2,
  Maximize2
} from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { useBuilder } from '../context/BuilderContext';

export const BuilderToolbar: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    profile,
    profileList,
    profileDropdownOpen,
    setProfileDropdownOpen,
    profileSwitchError,
    setProfileSwitchError,
    handleSelectProfile,
    setDeleteProfileId,
    setShowNewProfileModal,
    saveStatus,
    saveErrorBanner,
    queueRef,
    handleRetryFailedSaves,
    setQrModalOpen,
    copiedLink,
    handleCopyPublicLink,
    customTheme,
    onViewFullscreen,
    setActiveTab
  } = useBuilder();

  return (
    <div className="studio-toolbar bg-neutral-100 border-b border-neutral-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-18 z-30 shadow-2xs">
      {/* Left: Username & Save Status */}
      <div className="flex items-center gap-4">
        {/* Multi-Profile Switcher Dropdown */}
        <div className="relative">
          <div className="flex items-center bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors text-xs font-bold text-neutral-900 border border-transparent hover:border-neutral-300">
            <button
              type="button"
              onClick={() => {
                setProfileSwitchError(null);
                setProfileDropdownOpen(!profileDropdownOpen);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-l-xl cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span className="font-mono">@{profile.username}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              title={ui("Manage subscription plan")}
              aria-label={ui("Manage subscription plan")}
              className="mr-2 ml-1 inline-flex min-h-11 min-w-11 items-center text-[11px] font-mono font-bold uppercase tracking-caps px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
            >
              {profile.plan || 'free'}
            </button>
          </div>

          {profileDropdownOpen && (
            <div className="absolute start-0 mt-2 w-64 bg-neutral-100 rounded-2xl shadow-xl border border-neutral-200 py-2 z-50 animate-fade-in">
              {profileSwitchError && (
                <div role="alert" className="mx-2 mb-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {profileSwitchError}
                </div>
              )}
              <div className="px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-caps text-neutral-600">
                {ui("Switch Profile (")}{profileList.length})
              </div>
              <div className="max-h-56 overflow-y-auto divide-y divide-neutral-50">
                {profileList.map(p => (
                  <div
                    key={p.id}
                    className={`w-full px-3 py-2 text-start flex items-center justify-between text-xs hover:bg-neutral-50 transition-colors cursor-pointer ${
                      p.id === profile.id ? 'bg-neutral-50 font-bold text-neutral-900' : 'text-neutral-700'
                    }`}
                  >
                    <button type="button" onClick={() => handleSelectProfile(p.id)} className="flex min-w-0 flex-1 flex-col truncate text-start">
                      <span className="truncate">{p.displayName || p.username}</span>
                      <span className="text-xs font-mono text-neutral-600">@{p.username}</span>
                    </button>
                    {p.id === profile.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <button
                        type="button"
                        onClick={event => {
                          event.stopPropagation();
                          setDeleteProfileId(p.id);
                        }}
                        aria-label={`${ui('Delete profile')} @${p.username}`}
                        className="rounded-lg px-1.5 py-1 text-rose-600 hover:bg-rose-50"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="pt-2 mt-1 border-t border-neutral-100 px-2">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    setShowNewProfileModal(true);
                  }}
                  className="w-full py-1.5 px-3 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{ui("New Bio Profile")}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="save-status flex items-center gap-1.5 text-xs text-neutral-600">
          <span className={`w-2 h-2 rounded-full ${
            saveStatus === 'saving' ? 'bg-amber-500 animate-ping' : 
            saveStatus === 'error' ? 'bg-rose-500' : 'bg-emerald-500'
          }`} />
          <span className="font-mono text-xs">
            {ui(saveErrorBanner ? 'Save failed' : queueRef.current?.dirty || saveStatus === 'saving' ? 'Saving...' : saveStatus === 'error' ? 'Save failed' : 'Saved')}
          </span>
          {queueRef.current?.dirty && saveStatus === 'error' && (
            <button
              type="button"
              onClick={handleRetryFailedSaves}
              className="ml-1 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
            >
              {ui("Retry")}
            </button>
          )}
        </div>
      </div>

      {/* Right Action Tools */}
      <div className="studio-toolbar-actions flex items-center gap-2">
        <button
          onClick={() => setQrModalOpen(true)}
          aria-label={ui('QR Code')}
          className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 hover:border-neutral-900 bg-neutral-50 text-xs font-semibold text-neutral-900 transition-colors cursor-pointer"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{ui("QR Code")}</span>
        </button>

        <button
          onClick={handleCopyPublicLink}
          aria-label={ui('Copy Link')}
          className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 hover:border-neutral-900 bg-neutral-50 text-xs font-semibold text-neutral-900 transition-colors cursor-pointer"
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{ui("Copied!")}</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{ui("Copy Link")}</span>
            </>
          )}
        </button>

        <button
          onClick={async () => {
            if (!queueRef.current?.dirty || (await queueRef.current.flush())) {
              window.sessionStorage.setItem(`raloa-fullscreen-preview:${profile.username.toLowerCase()}`, '1');
              onViewFullscreen(profile, customTheme);
            }
          }}
          className="px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95 shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
        >
          <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
          <span>{ui("View Live Page")}</span>
        </button>
      </div>
    </div>
  );
};
