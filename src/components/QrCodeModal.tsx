import { useLanguage as useUiLanguage } from '../context/LanguageContext';
import React, { useState } from 'react';
import { X, Download, Copy, Check, QrCode, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Modal } from './Modal';
import { useLanguage } from '../context/LanguageContext';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  displayName: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  username,
  displayName
}) => {
  const { tr: ui } = useUiLanguage();
  const [copied, setCopied] = useState(false);
  const [qrColor, setQrColor] = useState('#111315');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const { tr, lang } = useLanguage();

  const profileUrl = `${window.location.origin}/@${username}`;
  // Standard SVG QR representation with center monogram
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(profileUrl)}&color=${qrColor.replace('#', '')}&bgcolor=FFFFFF`;

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(profileUrl); }
    catch { setError(tr('Could not copy link. Copy the address from the live page.')); return; }
    setError('');
    setCopied(true);
    confetti({
      particleCount: 60,
      spread: 55,
      origin: { y: 0.7 }
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await fetch(qrApiUrl);
      if (!res.ok) throw new Error('QR download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `liinx-${username}-qr.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(tr('Could not download QR code. Please retry.'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} label={tr('QR Code')}>
      <div className="relative w-full max-w-sm rounded-3xl bg-white border border-neutral-200 p-6 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
          aria-label={ui("Close modal")}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center mx-auto mb-2.5 shadow-sm">
            <QrCode className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="font-brand font-bold text-lg text-neutral-900">
            {ui("Dynamic QR Code")}</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            {lang === 'ar' ? `شارك صفحة ${displayName} عبر رمز QR` : `Share ${displayName}'s page with a QR code`}</p>
        </div>

        {/* QR Code Graphic Frame */}
        <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col items-center justify-center mb-5">
          <img 
            src={qrApiUrl} 
            alt={`QR code for ${username}`}
            className="w-48 h-48 object-contain rounded-lg"
          />
          <span dir="ltr" className="font-mono text-xs font-semibold text-neutral-900 mt-3 break-all text-center">
            {profileUrl}
          </span>
        </div>

        {/* Color Palette Tint Picker */}
        <div className="flex items-center justify-between px-2 mb-6">
          <span className="text-xs font-medium text-neutral-500">{ui("QR Tint:")}</span>
          <div className="flex items-center gap-2">
            {['#111315', '#B45309', '#2563EB', '#7C3AED', '#059669'].map((c) => (
              <button
                key={c}
                onClick={() => setQrColor(c)}
                className={`w-5 h-5 rounded-full border transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
                  qrColor === c ? 'ring-2 ring-neutral-900 ring-offset-1 scale-110' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: c }}
                title={`Tint ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleCopyLink}
            className="py-2.5 px-3 rounded-xl bg-white border border-neutral-300 hover:border-neutral-900 text-xs font-semibold text-neutral-900 flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{ui("Copied!")}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{ui("Copy Link")}</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? ui("Downloading...") : ui("Download PNG")}</span>
          </button>
        </div>

        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  );
};
