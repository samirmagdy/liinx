import React from 'react';
import { type BlockItem, type ThemeConfig } from '../../../../types';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { getGoogleMapsSearchUrl } from '../../../../utils/mapLinks';
import { advancedRadius } from '../../utils/publicBio.utils';

interface MapBlockViewProps {
  block: BlockItem;
  theme: ThemeConfig;
}

export const MapBlockView: React.FC<MapBlockViewProps> = ({ block, theme }) => {
  const { tr: ui } = useUiLanguage();
  const extra = (block as any).extra || block;
  const card = `p-5 shadow-sm ${advancedRadius(theme.cardRadius)}`;
  const cardStyle = { backgroundColor: theme.cardBg, border: theme.cardBorder, color: theme.cardText };

  const locationValue =
    (typeof extra.location === 'string' && extra.location.trim() ? extra.location : undefined) ||
    (typeof extra.address === 'string' && extra.address.trim() ? extra.address : undefined) ||
    block.subtitle;
  const location = typeof locationValue === 'string' ? locationValue.trim() : '';
  const mapsHref = getGoogleMapsSearchUrl(location);

  return (
    <div className={card} style={cardStyle}>
      <strong>{block.title}</strong>
      {location ? (
        <>
          <span className="block text-sm mt-1" style={{ color: theme.subtextColor }} dir="auto">
            {location}
          </span>
          <a
            href={mapsHref || undefined}
            target="_blank"
            rel="noreferrer"
            dir="ltr"
            className="mt-3 inline-flex rounded-lg border px-3 py-2 text-sm font-semibold underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
            aria-label={`${ui('Get directions to')} ${location}`}
          >
            {ui('Get directions')}
          </a>
        </>
      ) : (
        <p role="status" className="mt-2 text-sm" style={{ color: theme.subtextColor }}>
          {ui('Add an address to show directions.')}
        </p>
      )}
    </div>
  );
};
