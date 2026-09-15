import React from 'react';

interface BackgroundAnimationProps {
  reducedMotion?: boolean;
}

/** Decorative-only background with no third-party runtime dependency. */
export const BackgroundAnimation: React.FC<BackgroundAnimationProps> = ({ reducedMotion = false }) => {
  const [systemReducedMotion, setSystemReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setSystemReducedMotion(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  if (reducedMotion || systemReducedMotion) return null;

  return (
    <div aria-hidden="true" className="liinx-motion-background fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="liinx-motion-glow absolute inset-0" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 900" preserveAspectRatio="none" focusable="false">
        <ellipse className="liinx-motion-orbit liinx-motion-orbit-a" cx="220" cy="220" rx="300" ry="200" />
        <ellipse className="liinx-motion-orbit liinx-motion-orbit-b" cx="880" cy="420" rx="250" ry="150" />
        <ellipse className="liinx-motion-orbit liinx-motion-orbit-c" cx="450" cy="680" rx="200" ry="100" />
      </svg>
    </div>
  );
};
