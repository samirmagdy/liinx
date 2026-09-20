import { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { useLanguage } from '../../../context/LanguageContext';
import { useProductFeedback } from '../../../components/ProductFeedback';

export function useBillingStatus(user: { id: string } | null, profile: { plan?: string } | null) {
  const { lang } = useLanguage();
  const { notify } = useProductFeedback();
  const [billingStatus, setBillingStatus] = useState<{ configured: boolean; plan: string; hasActiveSubscription: boolean } | null>(null);

  useEffect(() => {
    if (user) api.billing.getStatus().then(setBillingStatus).catch(() => {});
  }, [user, profile]);

  const openBillingPortal = async () => {
    try {
      const result = await api.billing.createPortalSession();
      if (result.url) window.location.href = result.url;
    } catch {
      notify(lang === 'ar' ? 'تعذر فتح بوابة الفواتير. حاول مرة أخرى.' : 'The billing portal could not be opened. Please try again.');
    }
  };

  return { billingStatus, openBillingPortal };
}
