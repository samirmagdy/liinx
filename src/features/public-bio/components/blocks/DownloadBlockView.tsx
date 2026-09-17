import React from 'react';
import { type BlockItem, type ThemeConfig } from '../../../../types';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { safePublicHref, advancedRadius } from '../../utils/publicBio.utils';

interface DownloadBlockViewProps {
  block: BlockItem;
  theme: ThemeConfig;
  previewOnly?: boolean;
}

export const DownloadBlockView: React.FC<DownloadBlockViewProps> = ({
  block,
  theme,
  previewOnly = false
}) => {
  const { tr: ui } = useUiLanguage();
  const extra = (block as any).extra || block;
  const card = `p-5 shadow-sm ${advancedRadius(theme.cardRadius)}`;
  const cardStyle = { backgroundColor: theme.cardBg, border: theme.cardBorder, color: theme.cardText };

  const href = safePublicHref(extra.fileUrl || block.url);
  const label =
    typeof extra.downloadName === 'string' && extra.downloadName.trim()
      ? extra.downloadName.trim()
      : 'Download file';
  const size = Number(extra.sizeBytes);
  const sizeLabel = Number.isFinite(size) && size >= 0 ? ` · ${(size / 1024 / 1024).toFixed(2)} MB` : '';
  const actionHref = href && !previewOnly ? href : null;

  return (
    <article className={`${card} space-y-2`} style={cardStyle}>
      <h3 className="break-words font-bold">{block.title}</h3>
      <p className="break-words text-sm" style={{ color: theme.subtextColor }}>
        {extra.description || label}
        {sizeLabel}
      </p>
      {actionHref ? (
        <a
          href={actionHref}
          download={extra.downloadName}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-lg border px-3 py-2 text-sm font-semibold underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          {ui('Download file')}
        </a>
      ) : (
        <p role="status" className="text-sm" style={{ color: theme.subtextColor }}>
          {href && previewOnly ? ui('Download is disabled in preview.') : ui('Download is not available yet.')}
        </p>
      )}
    </article>
  );
};
