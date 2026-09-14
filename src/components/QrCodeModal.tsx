import React, { useState } from 'react';
import { X, Download, Copy, Check, QrCode, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';

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
  const [copied, setCopied] = useState(false);
  const [qrColor, setQrColor] = useState('#111315');

  if (!isOpen) return null;

  const profileUrl = `${window.location.origin}/@${username}`;
  // Standard SVG QR representation with center monogram
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(profileUrl)}&color=${qrColor.replace('#', '')}&bgcolor=FFFFFF`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(profileUrl);
    setCopied(true);
    confetti({
      particleCount: 60,
      spread: 55,
      origin: { y: 0.7 }
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await fetch(qrApiUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `liinx-${username}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      window.open(qrApiUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-white border border-neutral-200 p-6 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center mx-auto mb-2.5 shadow-sm">
            <QrCode className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="font-brand font-bold text-lg text-neutral-900">
            Dynamic QR Code
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Share {displayName}'s profile anywhere in the physical world
          </p>
        </div>

        {/* QR Code Graphic Frame */}
        <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col items-center justify-center mb-5">
          <img 
            src={qrApiUrl} 
            alt={`QR code for ${username}`}
            className="w-48 h-48 object-contain rounded-lg"
          />
          <span className="font-mono text-xs font-semibold text-neutral-900 mt-3">
            liinx.co/@{username}
          </span>
        </div>

        {/* Color Palette Tint Picker */}
        <div className="flex items-center justify-between px-2 mb-6">
          <span className="text-xs font-medium text-neutral-500">QR Tint:</span>
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
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Downloading...' : 'Download PNG'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
