import React from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { BlockItem, ThemeConfig } from '../../../../types';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { safePublicHref, analyticsHref, getRadiusClass } from '../../utils/publicBio.utils';

interface FolderBlockViewProps {
  block: BlockItem;
  theme: ThemeConfig;
  isOpen: boolean;
  onToggle: () => void;
}

export const FolderBlockView: React.FC<FolderBlockViewProps> = ({
  block,
  theme,
  isOpen,
  onToggle
}) => {
  const { tr: ui } = useUiLanguage();

  return (
    <div
      className={`overflow-hidden transition-shadow duration-200 border shadow-sm ${getRadiusClass(theme.cardRadius, true)}`}
      style={{
        backgroundColor: theme.cardBg,
        border: theme.cardBorder,
        color: theme.cardText
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`folder-items-${block.id}`}
        className="w-full p-4 flex items-center justify-between text-left hover:opacity-95 transition-opacity cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-current gap-2"
      >
        <div className="min-w-0 flex-1" dir="auto">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm sm:text-base truncate" dir="auto">{block.title}</span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-mono shrink-0"
              style={{
                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.12)' : '#F5F5F5',
                color: theme.cardText
              }}
            >
              {block.items?.length || 0} {ui('links')}
            </span>
          </div>
          {block.subtitle && (
            <p className="text-xs truncate mt-0.5 text-pretty" style={{ color: theme.subtextColor }} dir="auto">
              {block.subtitle}
            </p>
          )}
        </div>
        <div className="p-1.5 rounded-full opacity-60 shrink-0">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {isOpen && block.items && (
        <div
          id={`folder-items-${block.id}`}
          className="max-w-full overflow-hidden px-4 pb-4 pt-1 space-y-2 border-t border-black/5 dark:border-white/10"
        >
          {block.items.length === 0 && (
            <p className="py-2 text-xs" style={{ color: theme.subtextColor }}>
              {ui('No links in this folder yet.')}
            </p>
          )}
          {block.items.map((item, itemIndex) => {
            const itemHref = /^(?:https?:|mailto:|tel:)/i.test(item.url) ? safePublicHref(item.url) : null;
            const content = (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-semibold group-hover:underline truncate" dir="auto">
                    {item.title}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 shrink-0" />
                </div>
                {item.subtitle && (
                  <p className="text-xs truncate mt-0.5 text-pretty" style={{ color: theme.subtextColor }} dir="auto">
                    {item.subtitle}
                  </p>
                )}
              </>
            );
            const trackingHref = analyticsHref(
              item.id
                ? `/r/${block.id}?item=${encodeURIComponent(item.id)}`
                : `/r/${block.id}?itemIndex=${itemIndex}`
            );
            return itemHref ? (
              <a
                key={item.id || itemIndex}
                href={trackingHref}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl block transition-colors hover:bg-neutral-100/5 dark:hover:bg-neutral-900/5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
              >
                {content}
              </a>
            ) : (
              <div
                key={item.id || itemIndex}
                aria-disabled="true"
                className="p-3 rounded-xl block opacity-70"
              >
                {content}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
