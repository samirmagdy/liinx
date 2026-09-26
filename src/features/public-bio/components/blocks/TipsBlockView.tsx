import React from 'react';
import { type BlockItem, type ThemeConfig } from '../../../../types';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { safePublicHref, analyticsHref, advancedRadius } from '../../utils/publicBio.utils';

interface TipsBlockViewProps {
  block: BlockItem;
  theme: ThemeConfig;
  previewOnly?: boolean;
}

export const TipsBlockView: React.FC<TipsBlockViewProps> = ({
  block,
  theme,
  previewOnly = false
}) => {
  const { tr: ui } = useUiLanguage();
  const extra = (block as any).extra || block;
  const card = `p-5 shadow-sm ${advancedRadius(theme.cardRadius)}`;
  const cardStyle = { backgroundColor: theme.cardBg, border: theme.cardBorder, color: theme.cardText };

  const href = safePublicHref(extra.url || (block as any).url);
  const actionHref = href && !previewOnly ? analyticsHref(`/r/${block.id}`) : null;

  return (
    <article className={`${card} space-y-3`} style={cardStyle}>
      <h3 className="break-words font-bold">{block.title}</h3>
      <p className="text-xs font-semibold uppercase tracking-caps" style={{ color: theme.subtextColor }}>
        {ui('External support link')}
      </p>
      {(extra.description || (block as any).subtitle) && (
        <p className="whitespace-pre-wrap break-words text-sm leading-6" style={{ color: theme.subtextColor }}>
          {extra.description || (block as any).subtitle}
        </p>
      )}
      {actionHref ? (
        <>
          <a
            href={actionHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-lg border px-3 py-2 text-sm font-semibold underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-current"
          >
            {ui('Open support link')}
          </a>
          <p className="text-xs" style={{ color: theme.subtextColor }}>
            {ui('Support happens on another service.')}
          </p>
        </>
      ) : (
        <p role="status" className="text-sm" style={{ color: theme.subtextColor }}>
          {href && previewOnly
            ? ui('Support link is disabled in preview.')
            : ui('Support link is not configured yet.')}
        </p>
      )}
    </article>
  );
};
