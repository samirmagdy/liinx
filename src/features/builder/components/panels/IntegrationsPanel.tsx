import React from 'react';
import {
  Terminal,
  Plus,
  Instagram,
  RefreshCw,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';
import { formatUiDate } from '../../../../utils/localization';

export const IntegrationsPanel: React.FC = () => {
  const { tr: ui, lang } = useUiLanguage();
  const {
    profile,
    apiKeyList,
    apiKeyError,
    confirmRevokeKeyId,
    setConfirmRevokeKeyId,
    handleRevokeApiKey,
    setShowNewKeyModal,
    setCreatedApiKey,
    setNewKeyName,
    instagramStatus,
    isSyncingInstagram,
    instagramCaptionInput,
    setInstagramCaptionInput,
    isTestingCaption,
    instagramFeedback,
    setInstagramFeedback,
    handleConnectInstagram,
    handleSyncInstagramNow,
    handleToggleInstagramAutoSync,
    handleDisconnectInstagram,
    handleTestCaptionExtract
  } = useBuilder();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Developer REST API Card */}
      <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-neutral-900">{ui("Developer & REST API Access")}</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                {ui("Read profile details and create or delete link blocks with REST API v1.")}
              </p>
            </div>
          </div>
          {profile.plan !== 'studio' ? (
            <span className="whitespace-nowrap text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1 rounded-md">
              {ui("STUDIO TIER ONLY")}
            </span>
          ) : (
            <span className="whitespace-nowrap text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-md">
              {ui("API ENABLED")}
            </span>
          )}
        </div>

        {profile.plan !== 'studio' ? (
          <p className="text-xs text-neutral-500">
            {ui("REST API keys and programmatic block automation require a Studio subscription. Upgrade to unlock direct API access.")}
          </p>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-800">{ui("Active API Keys")}</span>
              <button
                type="button"
                onClick={() => {
                  setCreatedApiKey(null);
                  setNewKeyName('');
                  setShowNewKeyModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{ui("Generate Key")}</span>
              </button>
            </div>

            {apiKeyError && (
              <div role="alert" className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {apiKeyError}
              </div>
            )}

            {apiKeyList.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-600 border border-dashed rounded-xl">
                {ui("No API keys generated yet. Click \"Generate Key\" to create your first API credential.")}
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 border rounded-xl overflow-hidden text-xs">
                {apiKeyList.map(k => (
                  <div key={k.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-neutral-900">{k.name}</span>
                      <span className="font-mono text-xs text-neutral-600" dir="ltr">{k.prefix}</span>
                      {k.expiresAt && (
                        <span className="text-xs text-neutral-500" dir="auto">
                          {ui('Expires')} <span dir="ltr">{formatUiDate(k.expiresAt, lang)}</span>
                        </span>
                      )}
                    </div>
                    {confirmRevokeKeyId === k.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRevokeApiKey(k.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          {ui("Confirm Revoke")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRevokeKeyId(null)}
                          className="px-2 py-1 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          {ui("Cancel")}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmRevokeKeyId(k.id)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                      >
                        {ui("Revoke")}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="p-3 bg-neutral-900 text-neutral-200 rounded-xl space-y-1 text-xs font-mono">
              <span className="text-neutral-600 text-[11px] uppercase font-bold tracking-caps block">{ui("Sample API Request")}</span>
              <p className="text-xs select-all overflow-x-auto whitespace-nowrap">
                <span dir="ltr">curl https://raloa.app/api/v1/profile</span><br />
                {'  -H "Authorization: Bearer raloa_live_your_key_here"'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Instagram Caption Auto-Sync Card */}
      <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
              <Instagram className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                <span>{ui("Instagram Caption Link Sync")}</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                {ui("Sync links found in captions from your connected professional Instagram account. This does not provide an Instagram media grid.")}
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg border ${
            instagramStatus?.connected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-neutral-100 text-neutral-600 border-neutral-200'
          }`}>
            {instagramStatus?.connected ? ui("CONNECTED") : ui("DISCONNECTED")}
          </span>
        </div>

        {/* Feedback Notification */}
        {instagramFeedback && (
          <div className={`p-3 rounded-xl text-xs flex items-center justify-between animate-fade-in ${
            instagramFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            <span>{instagramFeedback.message}</span>
            <button 
              onClick={() => setInstagramFeedback(null)}
              className="font-bold text-xs opacity-70 hover:opacity-100 cursor-pointer ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Connection Details or Connect Button */}
        {instagramStatus?.connected ? (
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-900">@{instagramStatus.username}</span>
                <span className="text-neutral-500" aria-hidden="true">•</span>
                <span className="font-mono text-neutral-500">
                  {instagramStatus.syncedLinksCount ?? 0} {ui("synced links active")}
                </span>
              </div>
              {instagramStatus.needsReconnect && (
                <p role="alert" className="text-xs text-rose-700">
                  {ui("Instagram access expired. Reconnect to sync again; existing links are unchanged.")}
                </p>
              )}
              {instagramStatus.lastSyncError && !instagramStatus.needsReconnect && (
                <p role="alert" className="text-xs text-rose-700">{instagramStatus.lastSyncError}</p>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncInstagramNow}
                  disabled={isSyncingInstagram}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white font-semibold flex items-center gap-1.5 text-xs hover:bg-black transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingInstagram ? 'animate-spin' : ''}`} />
                  <span>{isSyncingInstagram ? ui("Syncing...") : ui("Sync Now")}</span>
                </button>
                <button
                  onClick={handleDisconnectInstagram}
                  className="px-3 py-1.5 rounded-lg border border-neutral-300 text-neutral-700 font-semibold text-xs hover:bg-neutral-100 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  {ui("Disconnect")}
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-xs">
              <span className="text-neutral-600">{ui("Scheduled sync:")}</span>
              <button
                onClick={handleToggleInstagramAutoSync}
                className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                  instagramStatus.autoSyncEnabled
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {instagramStatus.autoSyncEnabled ? ui("ENABLED") : ui("PAUSED")}
              </button>
            </div>
          </div>
        ) : !instagramStatus?.configured ? (
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-semibold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{ui("Meta Instagram OAuth Setup Required")}</span>
            </div>
            <p className="text-amber-800 text-xs leading-relaxed">
              {ui("To connect your live Instagram account, server administrators must configure")}<code className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[11px]">{ui("INSTAGRAM_CLIENT_ID")}</code> {ui("and")}<code className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[11px]">{ui("INSTAGRAM_CLIENT_SECRET")}</code> {ui("in the server environment.")}
            </p>
            <div className="pt-1 flex items-center justify-between text-xs text-amber-900 font-medium">
              <span>{ui("Live Caption Parser & Link Ingest is available below without OAuth.")}</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-neutral-900">{ui("Connect your Instagram account")}</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {ui("Authorize via official Meta Graph API to enable automatic post polling & real-time webhook updates.")}
                </p>
              </div>
              <button
                onClick={handleConnectInstagram}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>{ui("Connect Account")}</span>
              </button>
            </div>
          </div>
        )}

        {/* Instant Caption Ingest & Parser Tester */}
        <div className="pt-2 border-t border-neutral-100 space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="instagram-caption-input" className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{ui("Live Caption Parser & Post Ingest")}</span>
            </label>
            <button
              type="button"
              onClick={() => setInstagramCaptionInput('Tickets for Berlin studio show live now: https://eventbrite.com/e/berlin-live-2025! Also grab the vinyl bundle at https://shop.artist.studio/vinyl.')}
              className="text-xs font-mono text-amber-700 hover:underline cursor-pointer"
            >
              {ui("Fill sample caption")}
            </button>
          </div>
          <textarea
            id="instagram-caption-input"
            name="instagramCaption"
            aria-label={ui("Destination URL")}
            rows={2}
            value={instagramCaptionInput}
            onChange={(e) => setInstagramCaptionInput(e.target.value)}
            placeholder={ui("Paste any Instagram caption containing links to extract & add to your bio (e.g. 'Presave the single on Spotify: https://...')")}
            className="w-full text-xs p-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-neutral-50 focus:border-neutral-900 outline-none transition-colors"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => handleTestCaptionExtract(false)}
              disabled={isTestingCaption || !instagramCaptionInput.trim()}
              className="px-3 py-1.5 rounded-lg border border-neutral-300 hover:border-neutral-900 text-xs font-semibold text-neutral-700 transition-colors cursor-pointer disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {ui("Test Parser")}
            </button>
            <button
              type="button"
              onClick={() => handleTestCaptionExtract(true)}
              disabled={isTestingCaption || !instagramCaptionInput.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span>{ui("Extract & Add Link to Bio")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
