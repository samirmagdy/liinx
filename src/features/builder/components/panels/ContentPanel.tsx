import React from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';
import { SocialLinksEditor } from '../social/SocialLinksEditor';
import { PageManager } from '../pages/PageManager';
import { AddBlockMenu } from '../blocks/AddBlockMenu';
import { BlockList } from '../blocks/BlockList';
import { BookingEditor } from '../../../../components/BookingEditor';

export const ContentPanel: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    profile,
    setProfile,
    fileInputRef,
    uploadingImage,
    avatarError,
    usernameCheck,
    handleUsernameBlur,
    handleProfileChange,
    handleAddBookingBlock
  } = useBuilder();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile Bio & Avatar Card */}
      <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#18181B]">{ui("Creator Identity")}</h3>
          <span className="text-[10px] font-mono uppercase bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md">
            {ui("Published autosave")}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              onError={event => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = '/favicon.svg';
              }}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-neutral-200"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="absolute inset-0 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-semibold cursor-pointer"
            >
              {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-neutral-300 hover:border-black transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-neutral-500" />
                <span>{uploadingImage ? ui("Uploading...") : ui("Upload Avatar Image")}</span>
              </button>
            </div>
            {avatarError && (
              <p role="alert" className="text-xs text-rose-600 font-medium">
                {avatarError}
              </p>
            )}
            <p className="text-[11px] text-neutral-500">
              {ui("Supports JPG, PNG, WEBP up to 5MB. Stored directly on server.")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label htmlFor="builder-profile-username" className="block text-xs font-semibold text-neutral-500 mb-1">{ui('Username / Handle')}</label>
            <input
              id="builder-profile-username"
              name="username"
              autoComplete="username"
              aria-label={ui('Username / Handle')}
              type="text"
              value={profile.username}
              maxLength={30}
              onChange={event => setProfile(previous => ({ ...previous, username: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
              onBlur={() => void handleUsernameBlur()}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 font-mono text-neutral-900 focus:ring-1 focus:ring-neutral-900/10"
            />
            <p className="mt-1 text-[11px] text-neutral-500">
              {usernameCheck.loading ? ui('Checking handle…') : usernameCheck.error || ui('3–30 lowercase letters, numbers, or underscores.')}
            </p>
          </div>

          <div>
            <label htmlFor="builder-profile-displayName" className="block text-xs font-semibold text-neutral-500 mb-1">{ui("Display Name")}</label>
            <input
              id="builder-profile-displayName"
              name="displayName"
              autoComplete="name"
              aria-label={ui("Display Name")}
              type="text"
              maxLength={100}
              value={profile.displayName}
              onChange={(e) => handleProfileChange('displayName', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 font-semibold text-neutral-900 focus:ring-1 focus:ring-neutral-900/10"
            />
          </div>

          <div>
            <label htmlFor="builder-profile-category" className="block text-xs font-semibold text-neutral-500 mb-1">{ui("Category / Tag")}</label>
            <input
              id="builder-profile-category"
              name="category"
              aria-label={ui("Category / Tag")}
              type="text"
              maxLength={50}
              value={profile.category}
              onChange={(e) => handleProfileChange('category', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900 focus:ring-1 focus:ring-neutral-900/10"
            />
          </div>
        </div>

        <div>
          <label htmlFor="builder-profile-bio" className="block text-xs font-semibold text-neutral-500 mb-1">{ui("Short Bio")}</label>
          <textarea
            id="builder-profile-bio"
            name="bio"
            aria-label={ui("Short Bio")}
            rows={2}
            maxLength={500}
            value={profile.bio}
            onChange={(e) => handleProfileChange('bio', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900 resize-none focus:ring-1 focus:ring-neutral-900/10"
          />
        </div>

        {/* Social Links Manager */}
        <SocialLinksEditor />
      </div>

      {/* Pages Section */}
      <PageManager />

      {/* Booking Block Section */}
      <BookingEditor onSave={handleAddBookingBlock} />

      {/* Add Block & Importer */}
      <AddBlockMenu />

      {/* Block List */}
      <BlockList />
    </div>
  );
};
