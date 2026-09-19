import React from 'react';
import { getBorderColor } from '../../../utils/colorContrast';
import { type ThemeConfig } from '../../../types';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';

interface PublicSearchInputProps {
  theme: ThemeConfig;
  value: string;
  onChange: (value: string) => void;
}

export const PublicSearchInput: React.FC<PublicSearchInputProps> = ({ theme, value, onChange }) => {
  const { tr: ui } = useUiLanguage();

  return (
    <label
      className="mb-5 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,.15)'),
        color: theme.cardText
      }}
    >
      <span aria-hidden="true">⌕</span>
      <input
        id="public-page-search"
        name="pageSearch"
        type="search"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={ui('Search this page')}
        aria-label={ui('Search this page')}
        className="min-w-0 flex-1 bg-transparent outline-none"
      />
      <span className="sr-only" role="status">
        {ui('Search includes this page only')}
      </span>
    </label>
  );
};
