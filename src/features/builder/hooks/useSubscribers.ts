import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { friendlyErrorMessage } from '../../../utils/errors';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { SubscriberItem, BuilderTab } from '../types/builder.types';

interface UseSubscribersProps {
  activeTab: BuilderTab;
  profileId: string;
  username: string;
}

export function useSubscribers({ activeTab, profileId, username }: UseSubscribersProps) {
  const { tr: ui } = useUiLanguage();
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);
  const [subscribersLoading, setSubscribersLoading] = useState(false);
  const [subscribersError, setSubscribersError] = useState<string | null>(null);

  useEffect(() => {
    setSubscribers([]);
    setSubscribersError(null);
  }, [profileId]);

  useEffect(() => {
    if (activeTab !== 'settings') return;
    let cancelled = false;
    setSubscribersLoading(true);
    setSubscribersError(null);
    api.studio.getSubscribers()
      .then(res => {
        if (!cancelled) setSubscribers(res?.subscribers || []);
      })
      .catch(error => {
        if (!cancelled) setSubscribersError(friendlyErrorMessage(error, ui('Could not load subscribers.')));
      })
      .finally(() => {
        if (!cancelled) setSubscribersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, profileId]);

  const handleExportCsv = async () => {
    if (subscribers.length === 0) return;
    try {
      const blob = await api.studio.exportSubscribers();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `liinx-${username}-subscribers.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setSubscribersError(friendlyErrorMessage(error, ui('Could not export subscribers.')));
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    if (!window.confirm(ui('Remove this subscriber from your list?'))) return;
    try {
      await api.studio.deleteSubscriber(id);
      setSubscribers(current => current.filter(subscriber => subscriber.id !== id));
    } catch (err: any) {
      setSubscribersError(friendlyErrorMessage(err, ui('Could not remove subscriber.')));
    }
  };

  return {
    subscribers,
    setSubscribers,
    subscribersLoading,
    subscribersError,
    setSubscribersError,
    handleExportCsv,
    handleDeleteSubscriber
  };
}
