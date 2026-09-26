import { type RefObject } from 'react';
import { conditions, easing, gsap, SplitText, timing, useGSAP } from './gsap';

export function useHeroMotion(ref: RefObject<HTMLElement | null>, language: string, preview: string) {
  useGSAP(() => {
    const root = ref.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(conditions, context => {
      if (context.conditions?.reduce) return;
      const heading = root.querySelector('h1');
      if (!heading) return;
      // Word splitting preserves natural line wrapping. Keep Arabic shaping intact.
      const split = language !== 'ar' ? SplitText.create(heading, { type: 'words', aria: 'auto' }) : null;
      // Critical hero copy must remain readable if the animation is delayed, interrupted,
      // captured by a crawler, or unavailable. Motion only shifts already-visible content.
      const tl = gsap.timeline({ defaults: { ease: easing.out, clearProps: 'transform' } });
      const distance = context.conditions?.desktop ? 18 : 6;
      tl.from('[data-hero="eyebrow"]', { y: 8, duration: timing.component }, 0)
        .from(split?.words || heading, { y: distance, stagger: split ? { amount: 0.16 } : 0, duration: timing.section }, 0.1)
        .from('[data-hero="copy"]', { y: 8, duration: timing.component, stagger: 0.06 }, 0.3)
        .from('[data-hero="action"]', { y: 8, duration: timing.component }, 0.42)
        .from('[data-hero="visual"]', { y: distance, duration: timing.hero, ease: easing.hero }, 0.38);
      const finish = () => tl.progress(1);
      root.addEventListener('focusin', finish);
      if (context.conditions?.desktop && context.conditions?.fine) {
        gsap.to('.phone-shell', {
          y: -12, ease: 'none',
          scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.5 },
        });
      }
      const button = root.querySelector<HTMLElement>('#hero-claim-btn');
      let removePointer = () => {};
      if (button && context.conditions?.desktop && context.conditions?.fine) {
        const xTo = gsap.quickTo(button, 'x', { duration: timing.micro, ease: easing.out });
        const yTo = gsap.quickTo(button, 'y', { duration: timing.micro, ease: easing.out });
        const move = (e: PointerEvent) => {
          const rect = button.getBoundingClientRect();
          xTo(gsap.utils.clamp(-4, 4, (e.clientX - rect.left - rect.width / 2) * 0.05));
          yTo(gsap.utils.clamp(-4, 4, (e.clientY - rect.top - rect.height / 2) * 0.1));
        };
        const reset = () => { xTo(0); yTo(0); };
        button.addEventListener('pointermove', move);
        button.addEventListener('pointerleave', reset);
        button.addEventListener('focus', reset);
        removePointer = () => {
          button.removeEventListener('pointermove', move);
          button.removeEventListener('pointerleave', reset);
          button.removeEventListener('focus', reset);
        };
      }
      return () => { root.removeEventListener('focusin', finish); removePointer(); split?.revert(); };
    });
    return () => mm.revert();
  }, { scope: ref, dependencies: [language], revertOnUpdate: true });

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('[data-hero-preview]', {
        opacity: 0.72,
        y: 6,
        scale: 0.995,
        duration: timing.component,
        ease: easing.out,
        clearProps: 'opacity,transform',
      });
    });
    return () => mm.revert();
  }, { scope: ref, dependencies: [preview], revertOnUpdate: true });
}
