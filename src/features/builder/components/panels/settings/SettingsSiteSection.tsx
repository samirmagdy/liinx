import React from 'react';
import { SettingsWhiteLabelCard } from './SettingsWhiteLabelCard';
import { SettingsFooterCard } from './SettingsFooterCard';
import { SettingsDuplicateCard } from './SettingsDuplicateCard';

/** How the site presents itself: its own branding, not the platform's. */
export const SettingsSiteSection: React.FC = () => (
  <div className="space-y-6">
    <SettingsWhiteLabelCard />
    <SettingsFooterCard />
    <SettingsDuplicateCard />
  </div>
);
