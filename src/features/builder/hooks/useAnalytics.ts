import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { AnalyticsData, BuilderTab } from '../types/builder.types';

interface UseAnalyticsProps {
  activeTab: BuilderTab;
  profileId: string;
}

export function useAnalytics({ activeTab, profileId }: UseAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [dataError, setDataError] = useState(false);

  useEffect(() => {
    setDataError(false);
    if (activeTab === 'analytics') {
      setAnalyticsLoading(true);
      api.studio.getAnalytics()
        .then(data => {
          if (data) setAnalyticsData(data);
        })
        .catch(() => setDataError(true))
        .finally(() => setAnalyticsLoading(false));
    }
  }, [activeTab, profileId]);

  return {
    analyticsData,
    setAnalyticsData,
    analyticsLoading,
    dataError,
    setDataError
  };
}
