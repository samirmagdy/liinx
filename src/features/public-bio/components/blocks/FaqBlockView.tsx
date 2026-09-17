import React from 'react';
import { type BlockItem, type ThemeConfig } from '../../../../types';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { normalizeFaqItems, advancedRadius } from '../../utils/publicBio.utils';

interface FaqBlockViewProps {
  block: BlockItem;
  theme: ThemeConfig;
}

export const FaqBlockView: React.FC<FaqBlockViewProps> = ({ block, theme }) => {
  const { tr: ui } = useUiLanguage();
  const extra = (block as any).extra || block;
  const card = `p-5 shadow-sm ${advancedRadius(theme.cardRadius)}`;
  const cardStyle = { backgroundColor: theme.cardBg, border: theme.cardBorder, color: theme.cardText };

  const links = Array.isArray(extra.items) ? extra.items : Array.isArray(extra.links) ? extra.links : [];
  const faqItems = normalizeFaqItems(links);

  return (
    <section className="space-y-2" aria-labelledby={`faq-title-${block.id}`}>
      <h3 id={`faq-title-${block.id}`} className="font-bold" style={{ color: theme.cardText }}>
        {block.title}
      </h3>
      {faqItems.length > 0 ? (
        faqItems.map((item, index) => (
          <details key={item.id || index} className={card} style={cardStyle}>
            <summary
              className="cursor-pointer break-words font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
              dir="auto"
            >
              {item.question}
            </summary>
            <p
              className="whitespace-pre-wrap break-words pt-3 text-sm leading-6"
              style={{ color: theme.subtextColor }}
              dir="auto"
            >
              {item.answer}
            </p>
          </details>
        ))
      ) : (
        <p role="status" className="text-sm" style={{ color: theme.subtextColor }}>
          {ui('No questions yet.')}
        </p>
      )}
    </section>
  );
};
