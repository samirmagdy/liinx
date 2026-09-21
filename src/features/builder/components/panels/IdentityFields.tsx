import React from 'react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';

interface IdentityFieldsProps {
  onUsernameFocus: () => void;
  onUsernameBlur: () => void;
}

export const IdentityFields: React.FC<IdentityFieldsProps> = ({ onUsernameFocus, onUsernameBlur }) => {
  const { tr: ui } = useUiLanguage();
  const { profile, setProfile, usernameCheck, handleProfileChange } = useBuilder();

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div>
          <label htmlFor="builder-profile-username" className="block text-xs font-semibold text-neutral-500 mb-1">{ui('Username / Handle')}</label>
          <input
            id="builder-profile-username"
            name="username"
            dir="ltr"
            autoComplete="username"
            aria-label={ui('Username / Handle')}
            type="text"
            value={profile.username}
            maxLength={30}
            onChange={event => setProfile(previous => ({ ...previous, username: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
            onFocus={onUsernameFocus}
            onBlur={onUsernameBlur}
            className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 font-mono text-neutral-900 focus-visible:ring-1 focus-visible:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-neutral-500">
            {usernameCheck.loading ? ui('Checking handle…') : usernameCheck.error || ui('3–30 lowercase letters, numbers, or underscores.')}
          </p>
        </div>

        <div>
          <label htmlFor="builder-profile-displayName" className="block text-xs font-semibold text-neutral-500 mb-1">{ui("Display Name")}</label>
          <input
            id="builder-profile-displayName"
            name="displayName"
            dir="auto"
            autoComplete="name"
            aria-label={ui("Display Name")}
            type="text"
            maxLength={100}
            value={profile.displayName}
            onChange={(e) => handleProfileChange('displayName', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 font-semibold text-neutral-900 focus-visible:ring-1 focus-visible:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="builder-profile-category" className="block text-xs font-semibold text-neutral-500 mb-1">{ui("Category / Tag")}</label>
          <input
            id="builder-profile-category"
            name="category"
            dir="auto"
            aria-label={ui("Category / Tag")}
            type="text"
            maxLength={50}
            value={profile.category}
            onChange={(e) => handleProfileChange('category', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900 focus-visible:ring-1 focus-visible:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="builder-profile-bio" className="block text-xs font-semibold text-neutral-500 mb-1">{ui("Short Bio")}</label>
        <textarea
          id="builder-profile-bio"
          name="bio"
          dir="auto"
          aria-label={ui("Short Bio")}
          rows={2}
          maxLength={500}
          value={profile.bio}
          onChange={(e) => handleProfileChange('bio', e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900 resize-none focus-visible:ring-1 focus-visible:ring-indigo-500"
        />
      </div>
    </>
  );
};
