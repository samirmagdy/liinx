import React from 'react';
import { type CreatorProfile } from '../../../types';
import type { BackgroundMedia } from '../hooks/useBackgroundMedia';
import { PublicBackgroundMedia } from './PublicBackgroundMedia';

interface PublicBioBackdropProps {
  profile: CreatorProfile;
  media: BackgroundMedia;
  reducedMotion: boolean;
}

export const PublicBioBackdrop: React.FC<PublicBioBackdropProps> = ({ profile, media, reducedMotion }) => (
  <>
    <PublicBackgroundMedia
      hasBackgroundMedia={media.hasMedia}
      backgroundMediaType={profile.backgroundMediaType}
      backgroundMediaHref={media.href}
      reducedMotion={reducedMotion}
    />
    {profile.customCss && <style dangerouslySetInnerHTML={{ __html: profile.customCss }} />}
  </>
);
