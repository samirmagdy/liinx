import React from 'react';
import { BlockItem, ThemeConfig } from '../../../../types';
import { advancedRadius, renderRichText } from '../../utils/publicBio.utils';

interface RichTextBlockViewProps {
  block: BlockItem;
  theme: ThemeConfig;
}

export const RichTextBlockView: React.FC<RichTextBlockViewProps> = ({ block, theme }) => {
  const extra = (block as any).extra || block;
  const card = `p-5 shadow-sm ${advancedRadius(theme.cardRadius)}`;
  const cardStyle = { backgroundColor: theme.cardBg, border: theme.cardBorder, color: theme.cardText };

  return (
    <article className={card} style={cardStyle}>
      <h3 className="font-bold mb-2">{block.title}</h3>
      <div className="text-sm leading-7" style={{ color: theme.subtextColor }}>
        {renderRichText(extra.body || block.subtitle || '')}
      </div>
    </article>
  );
};
