import { useEffect, type MouseEvent } from 'react';

export const HOW_IT_WORKS_ANCHOR = 'how-it-works';

/** Smoothness and reduced-motion are left to CSS `scroll-behavior`. */
const scrollTo = (id: string) => {
  requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
};

/**
 * Wouter tracks the pathname only, so a link that changes nothing but the hash never fires a
 * route change. The nav takes over the click when the section is already on this page; when it
 * is not, the hash rides along with the navigation and the section catches it on mount.
 */
export function scrollWithinPage(event: MouseEvent<HTMLAnchorElement>, id: string) {
  if (!document.getElementById(id)) return;
  event.preventDefault();
  scrollTo(id);
}

export function useHashScroll(id: string) {
  useEffect(() => {
    const reveal = () => {
      if (decodeURIComponent(window.location.hash.replace(/^#/, '')) === id) scrollTo(id);
    };
    reveal();
    window.addEventListener('hashchange', reveal);
    return () => window.removeEventListener('hashchange', reveal);
  }, [id]);
}
