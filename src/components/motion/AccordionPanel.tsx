import React, { useRef } from 'react';
import { easing, gsap, ScrollTrigger, timing, useGSAP } from '../../animations/gsap';

export function AccordionPanel({ open, id, labelledBy, children }: {
  open: boolean; id: string; labelledBy: string; children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const node = ref.current;
    if (!node) return;
    const mm = gsap.matchMedia();
    mm.add({ reduce: '(prefers-reduced-motion: reduce)', normal: '(prefers-reduced-motion: no-preference)' }, context => {
      node.hidden = false;
      gsap.fromTo(node, { height: open ? 0 : 'auto', opacity: open ? 0 : 1 }, {
        height: open ? 'auto' : 0, opacity: open ? 1 : 0,
        duration: context.conditions?.reduce ? 0 : timing.component, ease: easing.smooth,
        onComplete: () => { node.hidden = !open; ScrollTrigger.refresh(); },
      });
    });
    return () => mm.revert();
  }, { scope: ref, dependencies: [open], revertOnUpdate: true });
  return <div ref={ref} id={id} hidden={!open} aria-hidden={!open} inert={!open} role="region" aria-labelledby={labelledBy} className="overflow-hidden">
    <div className="px-5 pb-5 pt-3 text-sm sm:text-base text-neutral-700 leading-relaxed border-t border-neutral-100 text-pretty text-start">{children}</div>
  </div>;
}
