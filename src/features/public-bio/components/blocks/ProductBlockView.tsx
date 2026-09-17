import React from 'react';
import { BlockItem, ThemeConfig } from '../../../../types';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { safePublicHref, analyticsHref, advancedRadius } from '../../utils/publicBio.utils';

interface ProductBlockViewProps {
  block: BlockItem;
  theme: ThemeConfig;
  previewOnly?: boolean;
}

export const ProductBlockView: React.FC<ProductBlockViewProps> = ({
  block,
  theme,
  previewOnly = false
}) => {
  const { tr: ui } = useUiLanguage();
  const extra = (block as any).extra || block;
  const card = `p-5 shadow-sm ${advancedRadius(theme.cardRadius)}`;
  const cardStyle = { backgroundColor: theme.cardBg, border: theme.cardBorder, color: theme.cardText };

  const href = safePublicHref(extra.url || block.url);
  const actionHref = href && !previewOnly ? analyticsHref(`/r/${block.id}`) : null;
  const description = extra.description || block.subtitle;
  const image = safePublicHref(extra.imageUrl);
  const priceAmount =
    typeof extra.priceAmount === 'string' && /^\d{1,8}(?:\.\d{1,2})?$/.test(extra.priceAmount)
      ? extra.priceAmount
      : '';
  const currency =
    typeof extra.currency === 'string' && /^[A-Z]{3}$/.test(extra.currency) ? extra.currency : '';
  const price = priceAmount
    ? `${currency ? `${currency} ` : ''}${priceAmount}`
    : typeof extra.price === 'string'
    ? extra.price
    : '';

  return (
    <article className={`${card} space-y-3`} style={cardStyle}>
      {image && (
        <img src={image} alt="" loading="lazy" className="max-h-52 w-full rounded-xl object-cover" />
      )}
      <h3 className="break-words font-bold">{block.title}</h3>
      {description && (
        <p className="whitespace-pre-wrap break-words text-sm leading-6" style={{ color: theme.subtextColor }}>
          {description}
        </p>
      )}
      {price && <p className="font-semibold" dir="ltr">{price}</p>}
      {actionHref ? (
        <>
          <a
            href={actionHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-lg border px-3 py-2 text-sm font-semibold underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
          >
            {ui('Open external checkout')}
          </a>
          <p className="text-xs" style={{ color: theme.subtextColor }}>
            {ui('Checkout happens on another service.')}
          </p>
        </>
      ) : (
        <p role="status" className="text-sm" style={{ color: theme.subtextColor }}>
          {href && previewOnly
            ? ui('Checkout link is disabled in preview.')
            : ui('Checkout link is not configured yet.')}
        </p>
      )}
    </article>
  );
};
