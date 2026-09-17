import React, { useEffect } from 'react';
import { CreatorProfile } from '../../../../types';
import { api } from '../../../../services/api';

interface AnalyticsTrackerProps {
  profile: CreatorProfile | null;
  previewOnly?: boolean;
  onBoundaryRefresh?: (now: number) => void;
  renderNow?: number;
}

export const AnalyticsTracker: React.FC<AnalyticsTrackerProps> = ({
  profile,
  previewOnly = false,
  onBoundaryRefresh,
  renderNow
}) => {
  // Record profile visit with UTM parameters
  useEffect(() => {
    if (!profile || previewOnly) return;
    api.analytics.recordView(profile.id, undefined, profile.page?.id).catch(() => {});
  }, [profile?.id, profile?.page?.id, previewOnly]);

  // Scheduled blocks auto-refresh timer
  useEffect(() => {
    if (!profile || previewOnly || !onBoundaryRefresh || typeof window === 'undefined') return;

    const nextBoundary = profile.blocks
      .flatMap(block => [block.startAt, block.endAt])
      .filter((timestamp): timestamp is number => typeof timestamp === 'number' && timestamp > Date.now())
      .sort((a, b) => a - b)[0];

    if (!nextBoundary) return;

    const timer = window.setTimeout(
      () => onBoundaryRefresh(Date.now()),
      Math.max(1, nextBoundary - Date.now() + 1)
    );
    return () => window.clearTimeout(timer);
  }, [profile, previewOnly, renderNow, onBoundaryRefresh]);

  return null;
};
