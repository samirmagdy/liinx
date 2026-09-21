import React from 'react';
import { SettingsDomainCard } from './SettingsDomainCard';
import { SettingsLinkPreviewCard } from './SettingsPublicPageCards';

/** How the site is addressed, and how it renders when someone shares the address. */
export const SettingsDomainSection: React.FC = () => (
  <div className="space-y-6">
    <SettingsDomainCard />
    <SettingsLinkPreviewCard />
  </div>
);
