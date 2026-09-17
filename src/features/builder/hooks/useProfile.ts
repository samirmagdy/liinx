import { useState, useEffect, useRef, type FormEvent } from 'react';
import { type CreatorProfile, type ThemeConfig } from '../../../types';
import { THEMES } from '../../../config/themes';
import { api, authStorage } from '../../../services/api';
import { resolveTheme } from '../../../utils/colorContrast';
import { friendlyErrorMessage } from '../../../utils/errors';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { type ProfileSummary, type BuilderLoadState } from '../types/builder.types';

export const EMPTY_BUILDER_PROFILE: CreatorProfile = {
  id: '',
  username: '',
  displayName: '',
  bio: '',
  avatarUrl: '',
  category: '',
  verified: false,
  themeId: 'editorial-stone',
  socials: [],
  pages: [],
  blocks: []
};

interface UseProfileProps {
  initialProfile?: CreatorProfile;
  triggerAutoSave: (patch: Partial<CreatorProfile>) => void;
  flushQueue: () => Promise<boolean>;
  onProfileSwitched?: (newProfile: CreatorProfile) => void;
}

export function useProfile({
  initialProfile,
  triggerAutoSave,
  flushQueue,
  onProfileSwitched
}: UseProfileProps) {
  const { tr: ui } = useUiLanguage();
  const [loadState, setLoadState] = useState<BuilderLoadState>(initialProfile ? 'ready' : 'loading');
  const [profile, setProfile] = useState<CreatorProfile>(initialProfile || EMPTY_BUILDER_PROFILE);
  const [customTheme, setCustomTheme] = useState<ThemeConfig>(() =>
    resolveTheme(profile.themeId, profile.customTheme)
  );

  const [profileList, setProfileList] = useState<ProfileSummary[]>([]);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileSwitchError, setProfileSwitchError] = useState<string | null>(null);
  const [showNewProfileModal, setShowNewProfileModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [createProfileError, setCreateProfileError] = useState<string | null>(null);
  const [usernameCheck, setUsernameCheck] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });
  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [showImporterModal, setShowImporterModal] = useState(false);

  const profileRef = useRef(profile);
  const savedUsernameRef = useRef(profile.username);
  const onProfileSwitchedRef = useRef(onProfileSwitched);
  profileRef.current = profile;
  onProfileSwitchedRef.current = onProfileSwitched;

  const loadProfilesList = () => {
    api.studio.getProfiles()
      .then(res => {
        if (res && Array.isArray(res.profiles)) {
          setProfileList(res.profiles);
        }
      })
      .catch(() => {});
  };

  // Initial load
  useEffect(() => {
    if (initialProfile) {
      setLoadState('ready');
      return;
    }

    api.studio.getProfile()
      .then(async liveProfile => {
        if (!liveProfile || !liveProfile.id) {
          setLoadState('empty');
          return;
        }
        const params = new URLSearchParams(window.location.search);
        const template = params.get('template');
        const shouldOpenImporter = params.get('import') === '1';

        if (template && THEMES.some(theme => theme.id === template)) {
          await api.studio.updateProfile({ themeId: template, customTheme: THEMES.find(theme => theme.id === template)! });
          liveProfile = await api.studio.getProfile();
          window.history.replaceState(null, '', '/studio');
        }

        setLoadState('ready');
        savedUsernameRef.current = liveProfile.username;
        setProfile(liveProfile);
        const th = resolveTheme(liveProfile.themeId, liveProfile.customTheme);
        setCustomTheme(th);
        onProfileSwitchedRef.current?.(liveProfile);

        if (shouldOpenImporter) {
          setShowImporterModal(true);
          window.history.replaceState(null, '', '/studio');
        }
      })
      .catch((err: any) => {
        const is404 = err?.status === 404 || err?.statusCode === 404 || err?.message?.toLowerCase().includes('not found');
        setLoadState(is404 ? 'empty' : 'error');
      });

    loadProfilesList();
  }, [initialProfile]);

  const handleProfileChange = (field: keyof CreatorProfile, value: any) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    triggerAutoSave({ [field]: value });
  };

  const handleSelectProfile = async (targetId: string) => {
    if (!(await flushQueue())) return;
    if (targetId === profile.id) {
      setProfileDropdownOpen(false);
      return;
    }
    setProfileSwitchError(null);
    try {
      const res = await api.studio.selectProfile(targetId);
      if (res.token) {
        authStorage.setToken(res.token);
        const newLiveProfile = await api.studio.getProfile();
        savedUsernameRef.current = newLiveProfile.username;
        setProfile(newLiveProfile);
        const th = resolveTheme(newLiveProfile.themeId, newLiveProfile.customTheme);
        setCustomTheme(th);
        onProfileSwitched?.(newLiveProfile);
        setProfileDropdownOpen(false);
        loadProfilesList();
      }
    } catch (err: any) {
      setProfileSwitchError(friendlyErrorMessage(err, ui('Failed to switch profile')));
    }
  };

  const handleCreateProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!(await flushQueue())) return;
    if (!newUsername.trim() || !newDisplayName.trim() || isCreatingProfile) return;
    setIsCreatingProfile(true);
    setCreateProfileError(null);

    try {
      const res = await api.studio.createProfile({
        username: newUsername.trim(),
        displayName: newDisplayName.trim()
      });
      if (res.token) {
        authStorage.setToken(res.token);
        const newLiveProfile = await api.studio.getProfile();
        savedUsernameRef.current = newLiveProfile.username;
        setProfile(newLiveProfile);
        const th = resolveTheme(newLiveProfile.themeId, newLiveProfile.customTheme);
        setCustomTheme(th);
        onProfileSwitched?.(newLiveProfile);
        setShowNewProfileModal(false);
        setNewUsername('');
        setNewDisplayName('');
        loadProfilesList();
      }
    } catch (err: any) {
      setCreateProfileError(friendlyErrorMessage(err, 'We could not create the new bio profile. Check the details and try again.'));
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const handleDeleteProfile = async (targetId: string) => {
    if (!(await flushQueue())) return;
    try {
      await api.studio.deleteProfile(targetId);
      setDeleteProfileId(null);
      setProfileSwitchError(null);
      loadProfilesList();
    } catch (error) {
      setProfileSwitchError(friendlyErrorMessage(error, ui('Could not delete this profile.')));
    }
  };

  const handleUsernameBlur = async () => {
    const username = profile.username.trim().toLowerCase();
    if (username === savedUsernameRef.current) return;
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      setUsernameCheck({ loading: false, error: ui('Use 3–30 lowercase letters, numbers, or underscores.') });
      return;
    }
    setUsernameCheck({ loading: true, error: null });
    try {
      const availability = await api.auth.checkUsername(username);
      if (!availability.available) throw new Error(availability.reason || ui('That handle is unavailable.'));
      const result = await api.studio.updateProfile({ username });
      if (result.token) authStorage.setToken(result.token);
      savedUsernameRef.current = username;
      setProfile(previous => ({ ...previous, username }));
      setUsernameCheck({ loading: false, error: null });
      loadProfilesList();
    } catch (error) {
      setUsernameCheck({ loading: false, error: friendlyErrorMessage(error, ui('That handle is unavailable.')) });
      setProfile(previous => ({ ...previous, username: savedUsernameRef.current }));
    }
  };

  const handleUpgradePlan = async (targetPlan: 'free' | 'pro' | 'studio') => {
    setBillingError(null);
    try {
      if (!(await flushQueue())) return;
      const res = targetPlan === 'free' || profile.plan !== 'free'
        ? await api.billing.createPortalSession()
        : await api.billing.createCheckoutSession(targetPlan);
      window.location.assign(res.url);
    } catch (err: any) {
      setBillingError(friendlyErrorMessage(err, ui('Failed to update plan')));
    }
  };

  const handleThemeSelect = (theme: ThemeConfig) => {
    const updated = {
      ...profile,
      themeId: theme.id,
      customTheme: theme
    };
    setProfile(updated);
    setCustomTheme(theme);
    triggerAutoSave({
      themeId: theme.id,
      customTheme: theme
    });
  };

  return {
    profile,
    setProfile,
    profileRef,
    customTheme,
    setCustomTheme,
    loadState,
    setLoadState,
    profileList,
    profileDropdownOpen,
    setProfileDropdownOpen,
    profileSwitchError,
    setProfileSwitchError,
    showNewProfileModal,
    setShowNewProfileModal,
    newUsername,
    setNewUsername,
    newDisplayName,
    setNewDisplayName,
    isCreatingProfile,
    createProfileError,
    usernameCheck,
    deleteProfileId,
    setDeleteProfileId,
    billingError,
    setBillingError,
    showImporterModal,
    setShowImporterModal,
    handleProfileChange,
    handleSelectProfile,
    handleCreateProfileSubmit,
    handleDeleteProfile,
    handleUsernameBlur,
    handleUpgradePlan,
    handleThemeSelect,
    loadProfilesList
  };
}
