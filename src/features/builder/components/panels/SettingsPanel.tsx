import React, { useState } from 'react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { SETTINGS_SECTIONS } from '../../config/studioNavigation';
import { type SettingsSection } from '../../types/builder.types';
import { SettingsSiteSection } from './settings/SettingsSiteSection';
import { SettingsDomainSection } from './settings/SettingsDomainSection';
import { SettingsIntegrationsSection } from './settings/SettingsIntegrationsSection';
import { SettingsBillingSection } from './settings/SettingsBillingSection';
import { SettingsAdvancedSection } from './settings/SettingsAdvancedSection';

const SECTIONS: Record<SettingsSection, React.FC> = {
  site: SettingsSiteSection,
  domain: SettingsDomainSection,
  integrations: SettingsIntegrationsSection,
  billing: SettingsBillingSection,
  advanced: SettingsAdvancedSection
};

export const SettingsPanel: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const [section, setSection] = useState<SettingsSection>('site');
  const Active = SECTIONS[section];

  return (
    <div className="space-y-5 animate-fade-in">
      <nav
        className="settings-sections flex flex-wrap gap-1 rounded-2xl border border-neutral-200 bg-white p-1 shadow-xs"
        aria-label={ui('Settings sections')}
      >
        {SETTINGS_SECTIONS.map(item => {
          const selected = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={selected ? 'true' : undefined}
              onClick={() => setSection(item.id)}
              className={`min-h-11 rounded-xl px-3 py-2 text-xs font-bold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                selected ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              {ui(item.label)}
            </button>
          );
        })}
      </nav>

      <Active />
    </div>
  );
};
