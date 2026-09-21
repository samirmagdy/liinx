import React from 'react';
import { Trash2 } from 'lucide-react';
import { type SocialLink } from '../../../../types';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';

const SOCIAL_PLACEHOLDERS: Record<string, string> = {
  phone: '+966 50 123 4567',
  email: 'creator@example.com',
  instagram: 'https://instagram.com/yourhandle',
  twitter: 'https://x.com/yourhandle',
  youtube: 'https://youtube.com/@channel',
  spotify: 'https://open.spotify.com/artist/...',
  github: 'https://github.com/username',
  linkedin: 'https://linkedin.com/in/username'
};

interface SocialLinkItemProps {
  soc: SocialLink;
  index: number;
  total: number;
  draftValue?: string;
  ui: (text: string) => string;
  onDraftChange: (value: string) => void;
  onBlur: (value: string) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}

const SocialLinkItem: React.FC<SocialLinkItemProps> = ({
  soc,
  index,
  total,
  draftValue,
  ui,
  onDraftChange,
  onBlur,
  onMove,
  onRemove
}) => (
  <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
    <div className="flex items-center gap-2 min-w-0 flex-1">
      <span className="capitalize font-bold text-neutral-700 font-mono text-[11px] bg-neutral-200 px-2 py-0.5 rounded">
        {soc.platform}
      </span>
      <input
        id={`social-link-draft-${index}-${soc.platform}`}
        name={`socialLink_${soc.platform}`}
        dir="ltr"
        aria-label={`${ui('Edit social link')} ${soc.platform}`}
        value={draftValue ?? soc.url}
        onChange={event => onDraftChange(event.target.value)}
        onBlur={event => onBlur(event.target.value)}
        className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-neutral-600 truncate font-mono text-xs focus:border-neutral-900"
      />
    </div>
    <button
      type="button"
      onClick={() => onMove(-1)}
      disabled={index === 0}
      aria-label={ui('Move social link up')}
      className="grid min-h-11 min-w-11 place-items-center rounded-lg text-neutral-600 disabled:opacity-30"
    >
      ↑
    </button>
    <button
      type="button"
      onClick={() => onMove(1)}
      disabled={index === total - 1}
      aria-label={ui('Move social link down')}
      className="grid min-h-11 min-w-11 place-items-center rounded-lg text-neutral-600 disabled:opacity-30"
    >
      ↓
    </button>
    <button
      type="button"
      onClick={onRemove}
      aria-label={`${ui('Remove social link')} ${soc.platform}`}
      className="grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-lg text-rose-600 hover:text-rose-700"
      title={ui("Remove social link")}
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  </div>
);

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

  const currentSocials = profile.socials || [];

  return (
    <div className="pt-3 border-t border-neutral-100">
      <span className="block text-xs font-bold text-neutral-900 mb-2">{ui("Connected Social Icons")}</span>

      {/* Current socials list */}
      <div className="space-y-2 mb-3">
        {currentSocials.length > 0 ? (
          currentSocials.map((soc, sIdx) => (
            <SocialLinkItem
              key={sIdx}
              soc={soc}
              index={sIdx}
              total={currentSocials.length}
              draftValue={socialDrafts[sIdx]}
              ui={ui}
              onDraftChange={val => setSocialDrafts(prev => ({ ...prev, [sIdx]: val }))}
              onBlur={val => handleEditSocial(sIdx, val)}
              onMove={dir => handleMoveSocial(sIdx, dir)}
              onRemove={() => handleRemoveSocial(sIdx)}
            />
          ))
        ) : (
          <p className="text-xs text-neutral-600">{ui("No social links added yet.")}</p>
        )}
      </div>

      {/* Add social link form */}
      <div className="flex items-center gap-2">
        <select
          id="new-social-platform"
          name="newSocialPlatform"
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
          id="new-social-url"
          name="newSocialUrl"
          aria-label={ui("Connected Social Icons")}
          type={newSocialPlatform === 'email' ? 'email' : 'text'}
          inputMode={newSocialPlatform === 'phone' ? 'tel' : newSocialPlatform === 'email' ? 'email' : 'url'}
          value={newSocialUrl}
          onChange={(e) => setNewSocialUrl(e.target.value)}
          placeholder={SOCIAL_PLACEHOLDERS[newSocialPlatform] || 'https://...'}
          dir="ltr"
          className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs outline-none focus:border-neutral-900 font-mono"
        />

        <button
          type="button"
          onClick={handleAddSocial}
          className="px-3 py-1.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {ui("Add")}
        </button>
      </div>
      {socialError && <p role="alert" className="mt-2 text-xs text-rose-700">{socialError}</p>}
    </div>
  );
};
