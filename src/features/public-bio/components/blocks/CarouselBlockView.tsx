import React, { useState, useRef, useEffect } from 'react';
import { BlockItem, ThemeConfig } from '../../../../types';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { safePublicHref, analyticsHref, advancedRadius } from '../../utils/publicBio.utils';

interface CarouselBlockViewProps {
  block: BlockItem;
  theme: ThemeConfig;
  previewOnly?: boolean;
}

export const CarouselBlockView: React.FC<CarouselBlockViewProps> = ({
  block,
  theme,
  previewOnly = false
}) => {
  const { tr: ui } = useUiLanguage();
  const extra = (block as any).extra || block;
  const card = `p-5 shadow-sm ${advancedRadius(theme.cardRadius)}`;
  const cardStyle = { backgroundColor: theme.cardBg, border: theme.cardBorder, color: theme.cardText };
  const links = Array.isArray(extra.items) ? extra.items : Array.isArray(extra.links) ? extra.links : [];

  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselTouchStart = useRef<number | null>(null);

  useEffect(() => {
    setCarouselIndex(0);
  }, [block.id, links.length]);

  if (links.length === 0) {
    return (
      <div className={card} style={cardStyle}>
        <h3 className="font-bold mb-2">{block.title}</h3>
        <p className="text-sm" style={{ color: theme.subtextColor }}>
          {ui('No slides in this carousel yet.')}
        </p>
      </div>
    );
  }

  const activeIndex = Math.min(carouselIndex, links.length - 1);
  const item = links[activeIndex] || {};
  const imageSrc = safePublicHref(item.imageUrl);
  const linkHref = safePublicHref(item.linkUrl);

  const image = imageSrc ? (
    <>
      <img
        src={imageSrc}
        alt={item.alt || block.title}
        className="aspect-[4/3] w-full object-cover rounded-xl"
        loading="lazy"
        onError={event => {
          event.currentTarget.style.display = 'none';
          const fallback = event.currentTarget.nextElementSibling;
          if (fallback instanceof HTMLElement) fallback.removeAttribute('hidden');
        }}
      />
      <span
        hidden
        role="status"
        className="flex aspect-[4/3] items-center justify-center rounded-xl bg-neutral-100/60 p-3 text-center text-xs"
        style={{ color: theme.subtextColor }}
      >
        {ui('Image unavailable.')}
      </span>
    </>
  ) : (
    <span
      role="status"
      className="flex aspect-[4/3] items-center justify-center rounded-xl bg-neutral-100/60 p-3 text-center text-xs"
      style={{ color: theme.subtextColor }}
    >
      {ui('Image unavailable.')}
    </span>
  );

  const content = (
    <>
      {image}
      {item.caption && (
        <p className="mt-2 text-sm leading-6" style={{ color: theme.subtextColor }}>
          {item.caption}
        </p>
      )}
    </>
  );

  const move = (direction: -1 | 1) =>
    setCarouselIndex(current => Math.max(0, Math.min(links.length - 1, current + direction)));

  const trackingHref = analyticsHref(
    item.id
      ? `/r/${block.id}?item=${encodeURIComponent(item.id)}`
      : `/r/${block.id}?itemIndex=${activeIndex}`
  );

  return (
    <section
      className={`${card} overflow-hidden touch-pan-y`}
      style={cardStyle}
      aria-roledescription="carousel"
      aria-label={block.title}
      onKeyDown={event => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          move(-1);
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          move(1);
        } else if (event.key === 'Home') {
          event.preventDefault();
          setCarouselIndex(0);
        } else if (event.key === 'End') {
          event.preventDefault();
          setCarouselIndex(links.length - 1);
        }
      }}
      tabIndex={0}
      onTouchStart={event => {
        carouselTouchStart.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={event => {
        const start = carouselTouchStart.current;
        carouselTouchStart.current = null;
        const end = event.changedTouches[0]?.clientX;
        if (start == null || end == null || Math.abs(end - start) < 40) return;
        move(end < start ? 1 : -1);
      }}
    >
      <h3 className="font-bold mb-3" dir="auto">{block.title}</h3>
      <div className="min-w-0">
        {linkHref && !previewOnly ? (
          <a
            href={trackingHref}
            target="_blank"
            rel="noreferrer"
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
          >
            {content}
          </a>
        ) : (
          content
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          disabled={activeIndex === 0}
          onClick={() => move(-1)}
          aria-label={ui('Previous slide')}
          className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
        >
          {ui('Previous')}
        </button>
        <span className="text-xs" aria-live="polite" dir="ltr">
          {activeIndex + 1} / {links.length}
        </span>
        <button
          type="button"
          disabled={activeIndex === links.length - 1}
          onClick={() => move(1)}
          aria-label={ui('Next slide')}
          className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
        >
          {ui('Next')}
        </button>
      </div>
    </section>
  );
};
