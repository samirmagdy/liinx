import React from 'react';
import { ExternalLink } from 'lucide-react';
import { type BlockItem, type ThemeConfig } from '../../../../types';
import { getAccessibleTextColor } from '../../../../utils/colorContrast';
import { analyticsHref, safePublicHref, getRadiusClass } from '../../utils/publicBio.utils';

interface LinkBlockViewProps {
  block: BlockItem;
  theme: ThemeConfig;
  previewOnly?: boolean;
}

export const LinkBlockView: React.FC<LinkBlockViewProps> = ({ block, theme, previewOnly = false }) => {
  const redirectUrl = analyticsHref(`/r/${block.id}`);
  const hasDestination = Boolean(safePublicHref(block.url));
  const isComplexLink = Boolean(block.subtitle);
  const isPill = theme.cardRadius === 'full' && !isComplexLink;
  const extra = (block as any).extra || {};
  const linkLayout = (block as any).layout || extra.layout || 'list';
  const linkAnimation = (block as any).animation || extra.animation || 'none';

  const linkContent = (
    <>
      {block.icon && <span aria-hidden="true" className="text-xl shrink-0">{block.icon}</span>}
      <div className="flex-1 min-w-0" dir="auto">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-sm sm:text-base tracking-tight truncate" dir="auto">
            {block.title}
          </span>
          {block.badge && (
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase shadow-xs shrink-0"
              style={{
                backgroundColor: theme.accentColor,
                color: getAccessibleTextColor(theme.accentColor)
              }}
            >
              {block.badge}
            </span>
          )}
        </div>
        {block.subtitle && (
          <p className="text-xs truncate" style={{ color: theme.subtextColor }} dir="auto">
            {block.subtitle}
          </p>
        )}
      </div>
      <div className="p-2 rounded-full opacity-60 shrink-0" aria-hidden="true">
        <ExternalLink className="w-4 h-4" />
      </div>
    </>
  );

  const className = `${linkLayout === 'grid' ? 'raloa-grid-link' : 'sm:col-span-2'} group relative ${
    isPill ? 'px-6 py-4' : 'p-4'
  } transition-shadow duration-200 flex items-center justify-between gap-4 shadow-sm ${
    hasDestination
      ? 'hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-current'
      : 'opacity-75'
  } ${linkLayout === 'featured' ? 'min-h-28' : ''} ${linkLayout === 'grid' ? 'min-h-24' : ''} ${
    linkAnimation === 'fade' ? 'raloa-link-animation-fade' : ''
  } ${linkAnimation === 'pulse' ? 'raloa-link-animation-pulse' : ''} ${
    linkAnimation === 'lift' && hasDestination ? 'raloa-link-animation-lift' : ''
  } ${getRadiusClass(theme.cardRadius, isComplexLink)}`;

  const style = {
    backgroundColor: block.highlighted ? (theme.isDark ? '#23242A' : '#FFFFFF') : theme.cardBg,
    border: block.highlighted ? `2px solid ${theme.accentColor}` : theme.cardBorder,
    color: theme.cardText
  };

  if (hasDestination && !previewOnly) {
    return (
      <a
        href={redirectUrl}
        target="_blank"
        rel="noreferrer"
        className={className}
        style={style}
      >
        {linkContent}
      </a>
    );
  }

  return (
    <div className={className} style={style} aria-disabled="true">
      {linkContent}
    </div>
  );
};
