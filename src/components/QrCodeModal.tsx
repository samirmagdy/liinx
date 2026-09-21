import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Modal } from './Modal';
import { useLanguage } from '../context/LanguageContext';
import type { CreatorPage } from '../types';
import { QrModalHeader } from './qr/QrModalHeader';
import { QrPreview } from './qr/QrPreview';
import { QrTargetSelect } from './qr/QrTargetSelect';
import { QrTintPicker } from './qr/QrTintPicker';
import { QrShareActions } from './qr/QrShareActions';
import { qrImageApiUrl, useQrTarget } from './qr/useQrTarget';
import { useQrShare } from './qr/useQrShare';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  displayName: string;
  pages?: CreatorPage[];
  currentPageSlug?: string;
  customDomain?: string | null;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  username,
  displayName,
  pages = [],
  currentPageSlug,
  customDomain
}) => {
  const { tr: ui, lang } = useLanguage();
  const [qrColor, setQrColor] = useState('#0F172A');

  const { publishedPages, targetPage, profileUrl, setSelectedPageSlug } = useQrTarget({
    username,
    pages,
    currentPageSlug,
    customDomain,
    isOpen
  });

  const qrApiUrl = qrImageApiUrl(profileUrl, qrColor);

  const {
    copied,
    downloading,
    imageFailed,
    error,
    providerUnavailableMessage,
    copyLink,
    downloadPng,
    markImageFailed
  } = useQrShare({ profileUrl, qrApiUrl, username, translate: ui });

  return (
    <Modal open={isOpen} onClose={onClose} label={ui('QR Code')}>
      <div className="relative w-full max-w-sm rounded-3xl bg-neutral-50 border border-neutral-200 p-6 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label={ui("Close modal")}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <QrModalHeader
          title={ui("Profile QR code")}
          shareLabel={lang === 'ar' ? `شارك صفحة ${displayName} عبر رمز QR` : `Share ${displayName}'s page with a QR code`}
          privacyNote={ui("This is a profile QR code. Only the selected public URL is sent to the QR image provider.")}
        />

        {publishedPages.length > 1 && (
          <QrTargetSelect
            label={ui("QR target")}
            homeLabel={ui('Home')}
            pages={publishedPages}
            value={targetPage ? (targetPage.isHome ? 'home' : targetPage.slug) : 'home'}
            onChange={setSelectedPageSlug}
          />
        )}

        <QrPreview
          qrApiUrl={qrApiUrl}
          profileUrl={profileUrl}
          imageFailed={imageFailed}
          unavailableMessage={providerUnavailableMessage}
          onImageError={markImageFailed}
        />

        <QrTintPicker value={qrColor} label={ui("QR Tint:")} onChange={setQrColor} />

        <QrShareActions
          copied={copied}
          downloading={downloading}
          labels={{
            copy: ui("Copy Link"),
            copied: ui("Copied!"),
            download: ui("Download PNG"),
            downloading: ui("Downloading...")
          }}
          onCopy={copyLink}
          onDownload={downloadPng}
        />

        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  );
};
