import { useEffect, useMemo, useState } from 'react';
import { siteTemplatesForIntent, type SiteTemplate, type SignupIntent } from '../../../../shared/index.js';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { readStarterSiteParam } from '../../../utils/starterSites';

/**
 * The signup choice that decides what the server materialises: a discipline, and either one of its
 * starter sites or the explicit decision to start from an empty page.
 */
export function useStarterSiteChoice() {
  const { t } = useUiLanguage();
  const [selectedIntent, setSelectedIntent] = useState<SignupIntent>('creator');
  /** null is a decision, not an absence: the account starts with an empty page. */
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    // "Use this template" while signed out lands here with a catalogue id: it preselects the
    // discipline that site was written for, so the choice on screen is the one the visitor clicked.
    const requested = readStarterSiteParam();
    if (!requested) return;
    setSelectedIntent(requested.intent);
    setSelectedTemplateId(requested.id);
  }, []);

  const starterSites: SiteTemplate[] = useMemo(() => siteTemplatesForIntent(selectedIntent), [selectedIntent]);
  /** Each card is labelled by its own translated starter-site name, never the raw catalogue string. */
  const starterSiteNames = useMemo(() => Object.fromEntries(
    starterSites.map(site => [site.id, t.templatesSection.templates[site.id]?.name || site.name])
  ), [starterSites, t]);

  const handleIntentSelect = (intent: SignupIntent) => {
    setSelectedIntent(intent);
    setSelectedTemplateId(current => {
      if (current === null) return null;
      const matches = siteTemplatesForIntent(intent);
      return matches.some(site => site.id === current) ? current : matches[0]?.id ?? null;
    });
  };

  return { selectedIntent, selectedTemplateId, setSelectedTemplateId, starterSites, starterSiteNames, handleIntentSelect };
}
