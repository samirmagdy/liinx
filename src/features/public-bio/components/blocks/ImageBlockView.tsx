import React, { useState } from 'react';
import { type BlockItem, type ThemeConfig } from '../../../../types';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { safePublicHref, analyticsHref, advancedRadius } from '../../utils/publicBio.utils';

interface ImageBlockViewProps {
  block: BlockItem;
  theme: ThemeConfig;
  previewOnly?: boolean;
}

export const ImageBlockView: React.FC<ImageBlockViewProps> = ({
  block,
  theme,
  previewOnly = false
}) => {
  const { tr: ui } = useUiLanguage();
  const [imageFailed, setImageFailed] = useState(false);
  const extra = (block as any).extra || block;
  const card = `p-5 shadow-sm ${advancedRadius(theme.cardRadius)}`;
  const cardStyle = { backgroundColor: theme.cardBg, border: theme.cardBorder, color: theme.cardText };

  const imageSrc = safePublicHref(extra.imageUrl);
  const imageAlt = extra.decorative ? '' : String(extra.alt || block.title || 'Image');
  const aspectClass =
    extra.aspect === 'square'
      ? 'aspect-square'
      : extra.aspect === 'portrait'
      ? 'aspect-[3/4]'
      : extra.aspect === 'landscape'
      ? 'aspect-[16/9]'
      : '';

  const image =
    imageSrc && !imageFailed ? (
      <img
        src={imageSrc}
        alt={imageAlt}
        className={`w-full max-h-[520px] ${aspectClass} ${extra.aspect && extra.aspect !== 'auto' ? 'h-full' : ''}`}
        style={{
          objectFit: extra.fit === 'contain' ? 'contain' : 'cover',
          objectPosition: extra.cropPosition || 'center'
        }}
        loading="lazy"
        onError={() => setImageFailed(true)}
      />
    ) : (
      <div
        role="status"
        className="flex min-h-32 items-center justify-center rounded-lg bg-neutral-100/60 px-4 text-center text-xs"
        style={{ color: theme.subtextColor }}
      >
        {ui('Image unavailable. Please try again later.')}
      </div>
    );

  const content = (
    <>
      {image}
      {extra.caption && (
        <figcaption className="pt-3 text-xs" style={{ color: theme.subtextColor }}>
          {extra.caption}
        </figcaption>
      )}
    </>
  );

  const destination = safePublicHref(extra.linkUrl);

  return (
    <figure className={`overflow-hidden ${card}`} style={cardStyle}>
      {destination && !previewOnly ? (
        <a
          href={analyticsHref(`/r/${block.id}`)}
          target="_blank"
          rel="noreferrer"
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          {content}
        </a>
      ) : (
        content
      )}
    </figure>
  );
};
