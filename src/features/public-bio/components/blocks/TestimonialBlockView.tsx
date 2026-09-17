import React from 'react';
import { type BlockItem, type ThemeConfig } from '../../../../types';
import { advancedRadius } from '../../utils/publicBio.utils';

interface TestimonialBlockViewProps {
  block: BlockItem;
  theme: ThemeConfig;
}

export const TestimonialBlockView: React.FC<TestimonialBlockViewProps> = ({ block, theme }) => {
  const extra = (block as any).extra || block;
  const card = `p-5 shadow-sm ${advancedRadius(theme.cardRadius)}`;
  const cardStyle = { backgroundColor: theme.cardBg, border: theme.cardBorder, color: theme.cardText };
  const links = Array.isArray(extra.items) ? extra.items : Array.isArray(extra.links) ? extra.links : [];

  return (
    <div className={`${card} space-y-4`} style={cardStyle}>
      <h3 className="font-bold">{block.title}</h3>
      {links.map((item: any, index: number) => (
        <blockquote key={item.id || index} className="border-l-2 pl-3">
          <p className="text-sm">“{item.quote || item.body}”</p>
          <cite className="mt-1 block text-xs not-italic" style={{ color: theme.subtextColor }}>
            {item.name || item.author}
          </cite>
        </blockquote>
      ))}
    </div>
  );
};
