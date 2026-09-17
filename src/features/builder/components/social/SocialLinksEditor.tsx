import React from 'react';
import { Trash2 } from 'lucide-react';
import { SocialLink } from '../../../../types';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';

export const SocialLinksEditor: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    profile,
    newSocialPlatform,
    setNewSocialPlatform,
    newSocialUrl,
    setNewSocialUrl,
    socialError,
    socialDrafts,
    setSocialDrafts,
    handleAddSocial,
    handleEditSocial,
    handleMoveSocial,
    handleRemoveSocial
  } = useBuilder();

  return (
    <div className="pt-3 border-t border-neutral-100">
      <label className="block text-xs font-bold text-neutral-900 mb-2">{ui("Connected Social Icons")}</label>

      {/* Current socials list */}
      <div className="space-y-2 mb-3">
        {profile.socials && profile.socials.length > 0 ? (
          profile.socials.map((soc, sIdx) => (
            <div key={sIdx} className="flex items-center gap-2 p-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="capitalize font-bold text-neutral-700 font-mono text-[11px] bg-neutral-200 px-2 py-0.5 rounded">
                  {soc.platform}
                </span>
                <input
                  dir="ltr"
                  aria-label={`${ui('Edit social link')} ${soc.platform}`}
                  value={socialDrafts[sIdx] ?? soc.url}
                  onChange={event => setSocialDrafts(previous => ({ ...previous, [sIdx]: event.target.value }))}
                  onBlur={event => handleEditSocial(sIdx, event.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-neutral-600 truncate font-mono text-[11px] focus:border-neutral-900 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => handleMoveSocial(sIdx, -1)}
                disabled={sIdx === 0}
                aria-label={ui('Move social link up')}
                className="rounded p-1 text-neutral-500 disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => handleMoveSocial(sIdx, 1)}
                disabled={sIdx === profile.socials.length - 1}
                aria-label={ui('Move social link down')}
                className="rounded p-1 text-neutral-500 disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => handleRemoveSocial(sIdx)}
                aria-label={`${ui('Remove social link')} ${soc.platform}`}
                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/30 rounded"
                title={ui("Remove social link")}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-[11px] text-neutral-400">{ui("No social links added yet.")}</p>
        )}
      </div>

      {/* Add social link form */}
      <div className="flex items-center gap-2">
        <select
          aria-label={ui("Connected Social Icons")}
          value={newSocialPlatform}
          onChange={(e) => setNewSocialPlatform(e.target.value as SocialLink['platform'])}
          className="px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold outline-none focus:border-neutral-900"
        >
          <option value="instagram">{ui("Instagram")}</option>
          <option value="twitter">{ui("X / Twitter")}</option>
          <option value="youtube">{ui("YouTube")}</option>
          <option value="spotify">{ui("Spotify")}</option>
          <option value="github">{ui("GitHub")}</option>
          <option value="linkedin">{ui("LinkedIn")}</option>
          <option value="email">{ui("Email")}</option>
          <option value="phone">{ui("Phone")}</option>
        </select>

        <input
          aria-label={ui("Connected Social Icons")}
          type="text"
          value={newSocialUrl}
          onChange={(e) => setNewSocialUrl(e.target.value)}
          placeholder="https://instagram.com/yourhandle"
          dir="ltr"
          className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs outline-none focus:border-neutral-900 font-mono"
        />

        <button
          type="button"
          onClick={handleAddSocial}
          className="px-3 py-1.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
        >
          {ui("Add")}
        </button>
      </div>
      {socialError && <p role="alert" className="mt-2 text-[11px] text-rose-700">{socialError}</p>}
    </div>
  );
};
