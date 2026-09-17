import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
export { gsap, useGSAP, ScrollTrigger, SplitText };
export const timing = { micro: 0.18, component: 0.32, section: 0.6, hero: 0.9 };
export const easing = { out: 'power3.out', smooth: 'power2.out', hero: 'expo.out' };
export const conditions = {
  all: '(min-width: 0px)',
  desktop: '(min-width: 1024px)',
  fine: '(hover: hover) and (pointer: fine)',
  reduce: '(prefers-reduced-motion: reduce)',
};

/** One trigger per group; focus completes pending reveals immediately. */
export function revealGroup(root: HTMLElement, targets: HTMLElement[], distance: number, delay = 0) {
  const animation = gsap.from(targets, {
    opacity: 0, y: distance, duration: timing.section, ease: easing.out,
    stagger: { amount: Math.min(0.24, targets.length * 0.06) }, delay,
    clearProps: 'opacity,transform',
    scrollTrigger: { trigger: root, start: 'top 92%', once: true },
  });
  const show = () => animation.progress(1);
  root.addEventListener('focusin', show);
  return () => root.removeEventListener('focusin', show);
}
