import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface QrShareOptions {
  profileUrl: string;
  qrApiUrl: string;
  username: string;
  translate: (key: string) => string;
}

const PROVIDER_UNAVAILABLE = 'The QR image provider is unavailable. Please retry later.';

export function useQrShare({ profileUrl, qrApiUrl, username, translate }: QrShareOptions) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setImageFailed(false);
    setError('');
  }, [qrApiUrl]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
    } catch {
      setError(translate('Could not copy link. Copy the address from the live page.'));
      return;
    }
    setError('');
    setCopied(true);
    confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 } });
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadPng = async () => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    try {
      setDownloading(true);
      const res = await fetch(qrApiUrl, { signal: controller.signal });
      if (!res.ok) throw new Error('QR download failed');
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) throw new Error('QR provider returned an unexpected file.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `raloa-${username}-qr.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(translate('Could not download QR code. Please retry.'));
    } finally {
      window.clearTimeout(timeout);
      setDownloading(false);
    }
  };

  const markImageFailed = () => {
    setImageFailed(true);
    setError(translate(PROVIDER_UNAVAILABLE));
  };

  return {
    copied,
    downloading,
    imageFailed,
    error,
    providerUnavailableMessage: translate(PROVIDER_UNAVAILABLE),
    copyLink,
    downloadPng,
    markImageFailed
  };
}
