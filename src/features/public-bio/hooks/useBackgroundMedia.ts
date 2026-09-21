import type { CreatorProfile } from '../../../types';
import { safePublicHref } from '../utils/publicBio.utils';

export interface BackgroundMedia {
  href: string | null;
  hasMedia: boolean;
}

export function useBackgroundMedia(profile: CreatorProfile): BackgroundMedia {
  const href = safePublicHref(profile.backgroundMediaUrl);
  const hasMedia = Boolean(
    href && (profile.backgroundMediaType === 'image' || profile.backgroundMediaType === 'video')
  );
  return { href, hasMedia };
}
