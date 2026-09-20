import { useEffect, useState } from 'react';
import { api } from '../../../services/api';

export type AccountProfileSummary = { id: string; username: string; displayName: string; avatarUrl: string; plan: string; category: string };

export function useAccountProfiles(
  user: { id: string } | null,
  profile: { plan?: string } | null,
  refreshProfile: () => Promise<void>,
  setLocation: (path: string) => void
) {
  const [profilesList, setProfilesList] = useState<AccountProfileSummary[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfilesLoading(true);
    api.studio.getProfiles()
      .then(result => setProfilesList(result.profiles || []))
      .catch(() => {})
      .finally(() => setProfilesLoading(false));
  }, [user, profile]);

  const selectProfile = async (profileId: string) => {
    await api.studio.selectProfile(profileId);
    await refreshProfile();
    setLocation('/studio');
  };

  return { profilesList, profilesLoading, selectProfile };
}
