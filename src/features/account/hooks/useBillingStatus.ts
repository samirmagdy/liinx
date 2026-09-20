import { useEffect, useState } from 'react';
import { api } from '../../../services/api';

export function useBillingStatus(user: { id: string } | null, profile: { plan?: string } | null) {
  const [billingStatus, setBillingStatus] = useState<{ configured: boolean; plan: string; hasActiveSubscription: boolean } | null>(null);

  useEffect(() => {
    if (user) api.billing.getStatus().then(setBillingStatus).catch(() => {});
  }, [user, profile]);

  const openBillingPortal = async () => {
    try {
      const result = await api.billing.createPortalSession();
      if (result.url) window.location.href = result.url;
    } catch {
      alert('Billing portal unavailable');
    }
  };

  return { billingStatus, openBillingPortal };
}
