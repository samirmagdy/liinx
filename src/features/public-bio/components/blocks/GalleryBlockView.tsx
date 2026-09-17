import React from 'react';
import { type BlockItem, type ThemeConfig } from '../../../../types';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { safePublicHref, advancedRadius } from '../../utils/publicBio.utils';

interface GalleryBlockViewProps {
  block: BlockItem;
  theme: ThemeConfig;
  previewOnly?: boolean;
}

export const GalleryBlockView: React.FC<GalleryBlockViewProps> = ({
  block,
  theme,
  previewOnly = false
}) => {
  const { tr: ui } = useUiLanguage();
  const extra = (block as any).extra || block;
  const card = `p-5 shadow-sm ${advancedRadius(theme.cardRadius)}`;
  const cardStyle = { backgroundColor: theme.cardBg, border: theme.cardBorder, color: theme.cardText };
  const links = Array.isArray(extra.items) ? extra.items : Array.isArray(extra.links) ? extra.links : [];

  if (links.length === 0) {
    return (
      <div className={card} style={cardStyle}>
        <h3 className="font-bold mb-2">{block.title}</h3>
        <p className="text-sm" style={{ color: theme.subtextColor }}>
          {ui('No images in this gallery yet.')}
        </p>
      </div>
    );
  }

  return (
    <div className={card} style={cardStyle}>
      <h3 className="font-bold mb-3">{block.title}</h3>
      <div className="grid grid-cols-2 gap-2">
        {links.map((item: any, index: number) => {
          const imageSrc = safePublicHref(item.imageUrl);
          const linkHref = safePublicHref(item.linkUrl);

          const image = imageSrc ? (
            <>
              <img
                src={imageSrc}
                alt={item.alt || block.title}
                className="aspect-square w-full object-cover rounded-xl"
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
                className="flex aspect-square items-center justify-center rounded-xl bg-neutral-100/60 p-3 text-center text-xs"
                style={{ color: theme.subtextColor }}
              >
                {ui('Image unavailable.')}
              </span>
            </>
          ) : (
            <span
              role="status"
              className="flex aspect-square items-center justify-center rounded-xl bg-neutral-100/60 p-3 text-center text-xs"
              style={{ color: theme.subtextColor }}
            >
              {ui('Image unavailable.')}
            </span>
          );

          const content = (
            <>
              {image}
              {item.caption && (
                <span className="mt-1 block text-xs" style={{ color: theme.subtextColor }}>
                  {item.caption}
                </span>
              )}
            </>
          );

          const trackingHref = item.id
            ? `/r/${block.id}?item=${encodeURIComponent(item.id)}`
            : `/r/${block.id}?itemIndex=${index}`;

          return linkHref && !previewOnly ? (
            <a
              key={item.id || index}
              href={trackingHref}
              target="_blank"
              rel="noreferrer"
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
            >
              {content}
            </a>
          ) : (
            <div key={item.id || index} className="block">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
};
