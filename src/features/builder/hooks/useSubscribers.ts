import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { friendlyErrorMessage } from '../../../utils/errors';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { type SubscriberItem, type BuilderTab } from '../types/builder.types';
import { useProductFeedback } from '../../../components/ProductFeedback';

interface UseSubscribersProps {
  activeTab: BuilderTab;
  profileId: string;
  username: string;
}

export function useSubscribers({ activeTab, profileId, username }: UseSubscribersProps) {
  const { tr: ui, lang } = useUiLanguage();
  const { confirm } = useProductFeedback();
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);
  const [subscribersLoading, setSubscribersLoading] = useState(false);
  const [subscribersError, setSubscribersError] = useState<string | null>(null);

  useEffect(() => {
    setSubscribers([]);
    setSubscribersError(null);
  }, [profileId]);

  useEffect(() => {
    if (activeTab !== 'audience') return;
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
  }, [activeTab, profileId, ui]);

  const handleExportCsv = async () => {
    if (subscribers.length === 0) return;
    try {
      const blob = await api.studio.exportSubscribers();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `raloa-${username}-subscribers.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setSubscribersError(friendlyErrorMessage(error, ui('Could not export subscribers.')));
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    const accepted = await confirm(
      lang === 'ar' ? 'سيؤدي هذا إلى إزالة المشترك من قائمتك.' : 'This will remove the subscriber from your list.',
      {
        title: lang === 'ar' ? 'إزالة المشترك' : 'Remove subscriber',
        confirmLabel: lang === 'ar' ? 'إزالة' : 'Remove',
        cancelLabel: lang === 'ar' ? 'إلغاء' : 'Cancel',
        destructive: true
      }
    );
    if (!accepted) return;
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
