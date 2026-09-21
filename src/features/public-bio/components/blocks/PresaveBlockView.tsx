import React from 'react';
import { type BlockItem, type ThemeConfig } from '../../../../types';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { safePublicHref, analyticsHref, advancedRadius } from '../../utils/publicBio.utils';

interface PresaveBlockViewProps {
  block: BlockItem;
  theme: ThemeConfig;
  previewOnly?: boolean;
}

export const PresaveBlockView: React.FC<PresaveBlockViewProps> = ({
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

  return (
    <article className={`${card} space-y-3`} style={cardStyle}>
      <h3 className="font-bold break-words">{block.title}</h3>
      <p className="text-xs font-semibold uppercase tracking-caps" style={{ color: theme.subtextColor }}>
        {ui('External release link')}
      </p>
      {extra.description && (
        <p className="whitespace-pre-wrap break-words text-sm leading-6" style={{ color: theme.subtextColor }}>
          {extra.description}
        </p>
      )}
      {actionHref ? (
        <a
          href={actionHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-lg border px-3 py-2 text-sm font-semibold underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-current"
        >
          {ui('Open release link')}
        </a>
      ) : (
        <p role="status" className="text-sm" style={{ color: theme.subtextColor }}>
          {href && previewOnly ? ui('Release link is disabled in preview.') : ui('Release link is not configured yet.')}
        </p>
      )}
    </article>
  );
};
