import React, { useRef } from 'react';
import { conditions, gsap, revealGroup, useGSAP } from '../../animations/gsap';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  distance?: 'sm' | 'md' | 'lg';
  stagger?: boolean;
}

/** Server HTML and disabled JS stay visible; GSAP owns temporary styles. */
export function Reveal({ children, className = '', delay = 0, distance = 'md', stagger = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(conditions, context => {
      const root = ref.current;
      if (!root || context.conditions?.reduce) return;
      const targets = stagger ? Array.from(root.querySelectorAll<HTMLElement>('.motion-card')) : [root];
      return revealGroup(root, targets, context.conditions?.desktop ? { sm: 6, md: 14, lg: 24 }[distance] : 6, Math.min(delay / 1000, 0.16));
    });
    return () => mm.revert();
  }, { scope: ref, dependencies: [delay, distance, stagger], revertOnUpdate: true });
  return <div ref={ref} className={className}>{children}</div>;
}
