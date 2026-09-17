import { type RefObject } from 'react';
import { easing, gsap, ScrollTrigger, timing, useGSAP } from './gsap';

/** Animate mounted panel content; React remains responsible for visibility. */
export function usePanelMotion(ref: RefObject<HTMLElement | null>, state: string | number | boolean | null, selector: string) {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const nodes = ref.current?.querySelectorAll<HTMLElement>(selector);
      if (!nodes?.length) return;
      gsap.timeline({ defaults: { ease: easing.out, clearProps: 'opacity,transform' }, onComplete: () => ScrollTrigger.refresh() })
        .from(nodes, { opacity: 0, y: 4, duration: timing.component, stagger: { amount: 0.12 } });
    });
    ScrollTrigger.refresh();
    return () => mm.revert();
  }, { scope: ref, dependencies: [state], revertOnUpdate: true });
}
