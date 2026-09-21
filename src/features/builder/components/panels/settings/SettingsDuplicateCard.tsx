import React from 'react';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useBuilder } from '../../../context/BuilderContext';
import { api, authStorage } from '../../../../../services/api';
import { resolveTheme } from '../../../../../utils/colorContrast';
import { SettingsCard } from './SettingsCard';
import { UpgradeGate } from './UpgradeGate';

/** Copy the current site to a new handle. */
export const SettingsDuplicateCard: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { profile, setProfile, setCustomTheme, loadProfilesList } = useBuilder();

  return (
    <SettingsCard
      title={ui('Duplicate this site')}
      detail={ui('Create another site with the same content and design, then choose a new address.')}
      actions={<UpgradeGate capability="extra-sites" />}
    >
      <button
        type="button"
        onClick={async () => {
          const username = window.prompt(ui('New username'));
          if (!username) return;
          const displayName = window.prompt(ui('Display name'), profile.displayName) || profile.displayName;
          try {
            const result = await api.studio.createProfile({ username, displayName, duplicateProfileId: profile.id });
            authStorage.setToken(result.token);
            const next = await api.studio.getProfile();
            setProfile(next);
            setCustomTheme(resolveTheme(next.themeId, next.customTheme));
            loadProfilesList();
          } catch (error) {
            console.error('Could not duplicate profile', error);
          }
        }}
        className="min-h-11 rounded-xl border border-neutral-300 px-4 text-xs font-bold text-neutral-900 hover:border-neutral-900"
      >
        {ui('Duplicate site')}
      </button>
    </SettingsCard>
  );
};
