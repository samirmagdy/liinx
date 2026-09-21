import { useEffect, useState } from 'react';
import type { CreatorProfile, ProfileBlock } from '../../../types';
import { matchesPublicPageSearch } from '../../../utils/publicSearch';

const CONSENT_STORAGE_KEY = 'raloa_analytics_consent';

export type AnalyticsConsent = 'granted' | 'denied' | null;

export function useAnalyticsConsent(previewOnly: boolean) {
  const [analyticsConsent, setAnalyticsConsent] = useState<AnalyticsConsent>(null);

  useEffect(() => {
    if (previewOnly || typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (saved === 'granted' || saved === 'denied') setAnalyticsConsent(saved);
  }, [previewOnly]);

  const updateAnalyticsConsent = (value: 'granted' | 'denied') => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
    }
    setAnalyticsConsent(value);
  };

  return { analyticsConsent, updateAnalyticsConsent };
}

export function usePageSearch(profile: CreatorProfile) {
  const [pageSearch, setPageSearch] = useState('');

  useEffect(() => {
    setPageSearch('');
  }, [profile.id, profile.page?.id]);

  return { pageSearch, setPageSearch };
}

export interface VisibleBlocks {
  availableBlocks: ProfileBlock[];
  visibleBlocks: ProfileBlock[];
  hasGridLink: boolean;
  normalizedQuery: string;
}

// The server persists scheduling windows on every block type, but the discriminated
// union only declares them on some members.
type ScheduledBlock = ProfileBlock & { startAt?: number | null; endAt?: number | null };

export function useVisibleBlocks(
  profile: CreatorProfile,
  pageSearch: string,
  renderNow: number
): VisibleBlocks {
  const normalizedQuery = pageSearch.trim();
  const scheduledBlocks = (Array.isArray(profile.blocks) ? profile.blocks : []) as ScheduledBlock[];
  const availableBlocks = scheduledBlocks.filter(
    block =>
      (block.startAt == null || block.startAt <= renderNow) &&
      (block.endAt == null || block.endAt > renderNow)
  );
  const visibleBlocks = availableBlocks.filter(block =>
    matchesPublicPageSearch(block as unknown as Record<string, unknown>, normalizedQuery)
  );
  const hasGridLink = profile.blocks.some(
    block =>
      block.type === 'link' &&
      ((block as any).layout === 'grid' || (block as any).extra?.layout === 'grid')
  );

  return { availableBlocks, visibleBlocks, hasGridLink, normalizedQuery };
}
