import React from 'react';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { SettingsCard } from './SettingsCard';
import { SavePageSettingsButton } from './SavePageSettingsButton';
import { UpgradeGate } from './UpgradeGate';
import { useBuilder } from '../../../context/BuilderContext';
import { planUnlocks } from '../../../config/studioNavigation';

/** The three fields that decide what a messaging app shows when your address is pasted. */
export const SettingsLinkPreviewCard: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    profile,
    shareTitleInput,
    setShareTitleInput,
    shareDescriptionInput,
    setShareDescriptionInput,
    shareImageUrlInput,
    setShareImageUrlInput,
    pageSettingsFeedback
  } = useBuilder();

  return (
    <SettingsCard title={ui('Link preview')} detail={ui('What a messaging app shows when someone pastes your address.')}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label htmlFor="settings-share-title" className="text-xs font-semibold text-neutral-800">
          {ui('Share title')}
          <input
            id="settings-share-title"
            name="shareTitle"
            dir="auto"
            value={shareTitleInput}
            onChange={e => setShareTitleInput(e.target.value)}
            maxLength={160}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900"
            placeholder={profile.displayName}
          />
        </label>
        <label htmlFor="settings-share-image-url" className="text-xs font-semibold text-neutral-800">
          {ui('Share image URL')}
          <input
            id="settings-share-image-url"
            name="shareImageUrl"
            type="url"
            dir="ltr"
            value={shareImageUrlInput}
            onChange={e => setShareImageUrlInput(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900"
            placeholder="https://..."
          />
        </label>
        <label htmlFor="settings-share-description" className="text-xs font-semibold text-neutral-800 sm:col-span-2">
          {ui('Share description')}
          <textarea
            id="settings-share-description"
            name="shareDescription"
            dir="auto"
            value={shareDescriptionInput}
            onChange={e => setShareDescriptionInput(e.target.value)}
            maxLength={300}
            rows={2}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900"
          />
        </label>
      </div>
      <SavePageSettingsButton feedback={pageSettingsFeedback} />
    </SettingsCard>
  );
};

/** Your own image or video behind the page, instead of the theme background. */
export const SettingsBackgroundCard: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    profile,
    backgroundMediaUrlInput,
    setBackgroundMediaUrlInput,
    backgroundMediaTypeInput,
    setBackgroundMediaTypeInput,
    uploadingImage,
    handleBackgroundImageUpload,
    pageSettingsFeedback
  } = useBuilder();
  const unlocked = planUnlocks(profile.plan, 'background-media');

  return (
    <SettingsCard
      title={ui('Background media')}
      detail={ui('Your own image or video behind the page instead of the theme background.')}
      actions={<UpgradeGate capability="background-media" />}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label htmlFor="settings-background-media-url" className="text-xs font-semibold text-neutral-800">
          {ui('Background media URL')}
          <input
            id="settings-background-media-url"
            name="backgroundMediaUrl"
            type="url"
            dir="ltr"
            disabled={!unlocked}
            value={backgroundMediaUrlInput}
            onChange={e => setBackgroundMediaUrlInput(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900 disabled:opacity-50"
            placeholder="https://..."
          />
        </label>
        <label htmlFor="settings-upload-bg-image" className="text-xs font-semibold text-neutral-800">
          {ui('Upload background image')}
          <input
            id="settings-upload-bg-image"
            name="uploadBackgroundImage"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={!unlocked || uploadingImage}
            onChange={event => {
              const file = event.target.files?.[0];
              if (file) void handleBackgroundImageUpload(file);
              event.currentTarget.value = '';
            }}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs font-normal text-neutral-900 disabled:opacity-50"
          />
        </label>
        <label htmlFor="settings-background-media-type" className="text-xs font-semibold text-neutral-800">
          {ui('Background type')}
          <select
            id="settings-background-media-type"
            name="backgroundMediaType"
            disabled={!unlocked}
            value={backgroundMediaTypeInput}
            onChange={e => setBackgroundMediaTypeInput(e.target.value as 'image' | 'video')}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-normal text-neutral-900 disabled:opacity-50"
          >
            <option value="image">{ui('Image')}</option>
            <option value="video">{ui('Video')}</option>
          </select>
        </label>
      </div>
      {unlocked ? (
        <SavePageSettingsButton feedback={pageSettingsFeedback} />
      ) : (
        <p className="text-xs text-neutral-500">
          {ui('Background media is unavailable on the free plan. Existing media is hidden publicly until the plan is upgraded.')}
        </p>
      )}
    </SettingsCard>
  );
};
