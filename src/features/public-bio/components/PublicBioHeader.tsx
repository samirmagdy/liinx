import React, { useState } from 'react';
import { ArrowLeft, QrCode, Share2, Check } from 'lucide-react';
import { useLocation } from 'wouter';
import { type ThemeConfig } from '../../../types';
import { getBorderColor } from '../../../utils/colorContrast';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { shareProfile } from '../utils/shareUtils';

interface PublicBioHeaderProps {
  theme: ThemeConfig;
  onBackToStudio?: () => void;
  onOpenQr?: () => void;
  setQrModalOpen: (open: boolean) => void;
}

export const PublicBioHeader: React.FC<PublicBioHeaderProps> = ({
  theme,
  onBackToStudio,
  onOpenQr,
  setQrModalOpen
}) => {
  const { tr: ui } = useUiLanguage();
  const [, setLocation] = useLocation();
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShare = () => {
    void shareProfile(window.location.href, undefined, () => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  return (
    <header
      className="public-header sticky top-0 z-40 w-full px-4 py-3 backdrop-blur-md border-b flex items-center justify-between text-xs"
      style={{
        backgroundColor: theme.isDark ? 'rgba(15, 23, 42, 0.86)' : 'rgba(255, 255, 255, 0.9)',
        borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(24, 24, 23, 0.12)'
      }}
    >
      {onBackToStudio ? (
        <button
          onClick={onBackToStudio}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border font-medium transition-opacity hover:opacity-80 cursor-pointer"
          style={{
            backgroundColor: theme.cardBg,
            color: theme.cardText,
            borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,0.12)')
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          <span>{ui('Back to Studio')}</span>
        </button>
      ) : (
        <button
          onClick={() => setLocation('/')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border font-medium transition-opacity hover:opacity-80 cursor-pointer"
          style={{
            backgroundColor: theme.cardBg,
            color: theme.cardText,
            borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,0.12)')
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          <span>{ui('RALOA')}</span>
        </button>
      )}

      <div className="public-header-actions flex items-center gap-2">
        <button
          onClick={onOpenQr ? onOpenQr : () => setQrModalOpen(true)}
          className="px-3 py-1.5 rounded-full border font-medium transition-opacity hover:opacity-80 cursor-pointer flex items-center gap-1.5"
          style={{
            backgroundColor: theme.cardBg,
            color: theme.cardText,
            borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,0.12)')
          }}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>{ui('QR Code')}</span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-semibold transition-opacity hover:opacity-80 shadow-xs cursor-pointer"
          style={{
            backgroundColor: theme.cardBg,
            color: theme.cardText,
            borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,0.12)')
          }}
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{ui('Copied!')}</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>{ui('Share')}</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
