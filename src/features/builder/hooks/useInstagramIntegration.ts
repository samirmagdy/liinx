import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import { type CreatorProfile } from '../../../types';
import { api } from '../../../services/api';
import { friendlyErrorMessage } from '../../../utils/errors';
import { type InstagramStatus, type BuilderTab } from '../types/builder.types';

interface UseInstagramIntegrationProps {
  activeTab: BuilderTab;
  profile: CreatorProfile;
  setProfile: Dispatch<SetStateAction<CreatorProfile>>;
  activePageId: string;
  setActivePageId: (id: string) => void;
  setDataError: (error: boolean) => void;
}

export function useInstagramIntegration({
  activeTab,
  profile,
  setProfile,
  activePageId,
  setActivePageId,
  setDataError
}: UseInstagramIntegrationProps) {
  const [instagramStatus, setInstagramStatus] = useState<InstagramStatus | null>(null);
  const [isSyncingInstagram, setIsSyncingInstagram] = useState(false);
  const [instagramCaptionInput, setInstagramCaptionInput] = useState('');
  const [isTestingCaption, setIsTestingCaption] = useState(false);
  const [instagramFeedback, setInstagramFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setInstagramStatus(null);
  }, [profile.id]);

  useEffect(() => {
    if (activeTab === 'settings') {
      api.instagram.getStatus()
        .then(status => {
          if (status) setInstagramStatus(status);
        })
        .catch(() => setDataError(true));
    }
  }, [activeTab, profile.id, setDataError]);

  const handleConnectInstagram = async () => {
    try {
      setInstagramFeedback(null);
      const res = await api.instagram.getAuthUrl();
      if (res.authUrl) {
        window.location.href = res.authUrl;
      }
    } catch (err: any) {
      setInstagramFeedback({
        type: 'error',
        message: friendlyErrorMessage(err, 'Instagram connection is not available right now. Please try again later.')
      });
    }
  };

  const handleSyncInstagramNow = async () => {
    try {
      setIsSyncingInstagram(true);
      setInstagramFeedback(null);
      const res = await api.instagram.syncNow();
      setInstagramFeedback({
        type: 'success',
        message: res.message || `Sync complete. Created ${res.linksCreated.length} links.`
      });
      const refreshed = await api.studio.getProfile();
      setProfile(refreshed);
      if (!refreshed.pages?.some(item => item.id === activePageId)) {
        const homeId = refreshed.pages?.find(p => p.isHome)?.id || refreshed.pages?.[0]?.id || '';
        setActivePageId(homeId);
      }
      const status = await api.instagram.getStatus();
      setInstagramStatus(status);
    } catch (err: any) {
      setInstagramFeedback({
        type: 'error',
        message: friendlyErrorMessage(err, 'Instagram could not be synced. Check the connection and try again.')
      });
    } finally {
      setIsSyncingInstagram(false);
    }
  };

  const handleToggleInstagramAutoSync = async () => {
    if (!instagramStatus) return;
    const nextVal = !instagramStatus.autoSyncEnabled;
    try {
      await api.instagram.toggleAutoSync(nextVal);
      setInstagramStatus(prev => (prev ? { ...prev, autoSyncEnabled: nextVal } : null));
    } catch (err: any) {
      setInstagramFeedback({
        type: 'error',
        message: friendlyErrorMessage(err, 'We could not update auto-sync. Please try again.')
      });
    }
  };

  const handleDisconnectInstagram = async () => {
    try {
      await api.instagram.disconnect();
      setInstagramStatus({
        connected: false,
        configured: Boolean(instagramStatus?.configured)
      });
      setInstagramFeedback({
        type: 'success',
        message: 'Instagram account disconnected successfully.'
      });
    } catch (err: any) {
      setInstagramFeedback({
        type: 'error',
        message: friendlyErrorMessage(err, 'We could not disconnect Instagram. Please try again.')
      });
    }
  };

  const handleTestCaptionExtract = async (saveToProfile: boolean) => {
    if (!instagramCaptionInput.trim()) return;
    try {
      setIsTestingCaption(true);
      setInstagramFeedback(null);
      const res = await api.instagram.testCaption(instagramCaptionInput, saveToProfile);
      if (res.extracted.length === 0) {
        setInstagramFeedback({
          type: 'error',
          message: 'No valid web URLs detected in this caption.'
        });
      } else if (saveToProfile) {
        setInstagramFeedback({
          type: 'success',
          message: `Extracted & added ${res.savedCount} new link(s) to your bio!`
        });
        const refreshed = await api.studio.getProfile();
        setProfile(refreshed);
        setInstagramCaptionInput('');
      } else {
        setInstagramFeedback({
          type: 'success',
          message: `Detected ${res.extracted.length} link(s): "${res.extracted.map(l => l.title).join('", "')}"`
        });
      }
    } catch (err: any) {
      setInstagramFeedback({
        type: 'error',
        message: friendlyErrorMessage(err, 'We could not read that caption. Check the text and try again.')
      });
    } finally {
      setIsTestingCaption(false);
    }
  };

  return {
    instagramStatus,
    setInstagramStatus,
    isSyncingInstagram,
    instagramCaptionInput,
    setInstagramCaptionInput,
    isTestingCaption,
    instagramFeedback,
    setInstagramFeedback,
    handleConnectInstagram,
    handleSyncInstagramNow,
    handleToggleInstagramAutoSync,
    handleDisconnectInstagram,
    handleTestCaptionExtract
  };
}
