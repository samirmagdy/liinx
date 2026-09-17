import React from 'react';
import { type BlockItem, type ThemeConfig } from '../../../../types';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { safePublicHref, analyticsHref, advancedRadius } from '../../utils/publicBio.utils';

interface EventBlockViewProps {
  block: BlockItem;
  theme: ThemeConfig;
  previewOnly?: boolean;
}

export const EventBlockView: React.FC<EventBlockViewProps> = ({
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
  const artwork = safePublicHref(extra.artworkUrl);
  const description = extra.description || block.subtitle;
  const details = [extra.date, extra.time, extra.timezone, extra.location]
    .filter(value => typeof value === 'string' && value.trim())
    .map(value => String(value).trim());

  return (
    <article className={`${card} space-y-3`} style={cardStyle}>
      {artwork && (
        <img src={artwork} alt="" loading="lazy" className="max-h-48 w-full rounded-xl object-cover" />
      )}
      <h3 className="font-bold break-words">{block.title}</h3>
      {description && (
        <p className="whitespace-pre-wrap break-words text-sm leading-6" style={{ color: theme.subtextColor }}>
          {description}
        </p>
      )}
      {details.length > 0 && (
        <p className="whitespace-pre-wrap break-words text-sm leading-6" style={{ color: theme.subtextColor }} dir="auto">
          {details.join(' · ')}
        </p>
      )}
      {actionHref ? (
        <a
          href={actionHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-lg border px-3 py-2 text-sm font-semibold underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          {ui('Event details')}
        </a>
      ) : (
        <p role="status" className="text-sm" style={{ color: theme.subtextColor }}>
          {href && previewOnly ? ui('Event link is disabled in preview.') : ui('Event link is not configured yet.')}
        </p>
      )}
    </article>
  );
};
