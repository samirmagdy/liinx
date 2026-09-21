import React from 'react';
import { SettingsStylingCard, SettingsRedirectCard } from './SettingsAdvancedCards';
import { SettingsBackgroundCard } from './SettingsPublicPageCards';

/** The knobs that can break a page if misused: raw CSS, artwork behind it, redirects. */
export const SettingsAdvancedSection: React.FC = () => (
  <div className="space-y-6">
    <SettingsStylingCard />
    <SettingsBackgroundCard />
    <SettingsRedirectCard />
  </div>
);
