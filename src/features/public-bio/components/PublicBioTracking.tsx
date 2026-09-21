import React from 'react';
import { type CreatorProfile } from '../../../types';
import type { AnalyticsConsent } from '../hooks/usePublicBioState';
import { TrackingPixelManager } from './tracking/TrackingPixelManager';
import { AnalyticsTracker } from './tracking/AnalyticsTracker';
import { PrivacyConsentBanner } from './tracking/PrivacyConsentBanner';

interface PublicBioTrackingProps {
  profile: CreatorProfile;
  previewOnly: boolean;
  analyticsConsent: AnalyticsConsent;
  updateAnalyticsConsent: (value: 'granted' | 'denied') => void;
  renderNow: number;
  onBoundaryRefresh: (now: number) => void;
}

export const PublicBioTracking: React.FC<PublicBioTrackingProps> = ({
  profile,
  previewOnly,
  analyticsConsent,
  updateAnalyticsConsent,
  renderNow,
  onBoundaryRefresh
}) => (
  <>
    <PrivacyConsentBanner
      profile={profile}
      analyticsConsent={analyticsConsent}
      previewOnly={previewOnly}
      onConsentChange={updateAnalyticsConsent}
    />
    <TrackingPixelManager
      profile={profile}
      analyticsConsent={analyticsConsent}
      previewOnly={previewOnly}
    />
    <AnalyticsTracker
      profile={profile}
      previewOnly={previewOnly}
      onBoundaryRefresh={onBoundaryRefresh}
      renderNow={renderNow}
    />
  </>
);
