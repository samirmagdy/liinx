import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * On a phone the hero is off screen for most of a long page, so the way to start creating
 * follows the reader. It waits until the hero has gone, and steps aside for the footer so it
 * never covers the end of the page.
 */
export const StickyMobileCta: React.FC = () => {
  const { tr: ui, isRtl } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector<HTMLElement>('.hero-section');
    const footer = document.querySelector<HTMLElement>('footer');
    let frame = 0;

    const measure = () => {
      // Pages without a hero still need the offer; there, one screen of scrolling counts as past it.
      const heroEnds = hero ? hero.getBoundingClientRect().bottom : window.innerHeight * 0.25;
      const footerArrives = footer ? footer.getBoundingClientRect().top < window.innerHeight * 0.4 : false;
      setVisible(heroEnds <= 0 && !footerArrives);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; measure(); });
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div
      className={`sticky-mobile-cta lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur-md px-4 pt-3 transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full pointer-events-none'
      }`}
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      aria-hidden={!visible}
      inert={!visible}
    >
      <Link
        href="/register"
        className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-black active:scale-[0.985]"
      >
        <span>{ui('Create your page')}</span>
        <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
      </Link>
    </div>
  );
};
