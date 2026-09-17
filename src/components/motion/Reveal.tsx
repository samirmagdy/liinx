import React, { useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  distance?: 'sm' | 'md' | 'lg';
}

/** Progressive enhancement: without JS the content remains visible. */
export const Reveal: React.FC<RevealProps> = ({ children, className = '', delay = 0, distance = 'md' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'idle' | 'ready' | 'visible'>('idle');

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
      setState('visible');
      return;
    }

    setState('ready');
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      setState('visible');
      observer.disconnect();
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`motion-reveal motion-reveal-${distance} ${className}`}
      data-motion-state={state === 'idle' ? undefined : state}
      style={{ '--motion-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

