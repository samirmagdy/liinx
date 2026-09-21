import { useEffect, useRef, useState } from 'react';
import { type CreatorProfile, type SiteTemplate, type ThemeConfig } from '../../../../shared/index.js';
import { api } from '../../../services/api';
import { resolveTheme } from '../../../utils/colorContrast';
import { friendlyErrorMessage } from '../../../utils/errors';
import { clearStarterSiteParam, readStarterSiteParam } from '../../../utils/starterSites';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';

interface UseStarterSiteProps {
  profile: CreatorProfile;
  setProfile: (profile: CreatorProfile) => void;
  setCustomTheme: (theme: ThemeConfig) => void;
  flushQueue: () => Promise<boolean>;
  onApplied: (profile: CreatorProfile) => void;
}

/**
 * Owns the `?template=` hand-off in the studio: the arrival opens a dialog that previews the
 * composition, and nothing is written until the creator chooses append or replace.
 */
export function useStarterSite({ profile, setProfile, setCustomTheme, flushQueue, onApplied }: UseStarterSiteProps) {
  const { tr: ui } = useUiLanguage();
  const [starterSite, setStarterSite] = useState<SiteTemplate | null>(null);
  const [starterSiteError, setStarterSiteError] = useState<string | null>(null);
  const [applyingStarterSite, setApplyingStarterSite] = useState(false);
  const arrivedRef = useRef(false);

  useEffect(() => {
    // There has to be a loaded profile to write into, and the param is read exactly once per
    // studio visit so a reload cannot add a second copy of the same starter site.
    if (arrivedRef.current || !profile.id) return;
    arrivedRef.current = true;
    const requested = readStarterSiteParam();
    if (!requested) return;
    clearStarterSiteParam();
    setStarterSite(requested);
  }, [profile.id]);

  const applyStarterSite = async (mode: 'append' | 'replace') => {
    if (!starterSite || applyingStarterSite) return;
    if (!(await flushQueue())) return;
    setApplyingStarterSite(true);
    setStarterSiteError(null);
    try {
      const res = await api.studio.applyTemplate(starterSite.id, mode);
      setProfile(res.profile);
      setCustomTheme(resolveTheme(res.profile.themeId, res.profile.customTheme));
      onApplied(res.profile);
      setStarterSite(null);
    } catch (error) {
      setStarterSiteError(friendlyErrorMessage(error, ui('We could not add that starter site. Please try again.')));
    } finally {
      setApplyingStarterSite(false);
    }
  };

  const dismissStarterSite = () => {
    setStarterSite(null);
    setStarterSiteError(null);
  };

  return { starterSite, starterSiteError, applyingStarterSite, applyStarterSite, dismissStarterSite };
}
