import React from 'react';

interface PublicBackgroundMediaProps {
  hasBackgroundMedia: boolean;
  backgroundMediaType?: string;
  backgroundMediaHref: string;
  reducedMotion: boolean;
}

export const PublicBackgroundMedia: React.FC<PublicBackgroundMediaProps> = ({
  hasBackgroundMedia,
  backgroundMediaType,
  backgroundMediaHref,
  reducedMotion
}) => {
  if (!hasBackgroundMedia) return null;

  return (
    <>
      {backgroundMediaType === 'video' && !reducedMotion && (
        <video
          className="pointer-events-none fixed inset-0 z-0 h-full w-full object-cover"
          src={backgroundMediaHref || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
      )}
      <div className="pointer-events-none fixed inset-0 z-0 bg-black/15" aria-hidden="true" />
    </>
  );
};
