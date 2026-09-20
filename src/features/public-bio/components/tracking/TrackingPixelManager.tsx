import { useEffect, type FC } from 'react';
import { type CreatorProfile } from '../../../../types';

interface TrackingPixelManagerProps {
  profile: CreatorProfile | null;
  analyticsConsent: 'granted' | 'denied' | null;
  previewOnly?: boolean;
}

export const TrackingPixelManager: FC<TrackingPixelManagerProps> = ({
  profile,
  analyticsConsent,
  previewOnly = false
}) => {
  // Google Analytics 4 (gtag.js) Injection
  useEffect(() => {
    if (
      previewOnly ||
      analyticsConsent !== 'granted' ||
      typeof profile?.gaMeasurementId !== 'string' ||
      typeof document === 'undefined'
    ) return;

    const gaId = profile.gaMeasurementId.trim();
    if (!gaId || !/^G-[A-Z0-9]+$/i.test(gaId)) return;

    if (!document.getElementById('raloa-ga4-script')) {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
      script.async = true;
      script.id = 'raloa-ga4-script';
      const nonce = (window as Window & { __CSP_NONCE__?: string }).__CSP_NONCE__;
      if (nonce) {
        script.nonce = nonce;
      }
      document.head.appendChild(script);
    }

    const win = window as Window & {
      dataLayer?: unknown[];
      gtag?: (...args: unknown[]) => void;
    };
    win.dataLayer = win.dataLayer || [];
    if (!win.gtag) {
      win.gtag = function (...args: unknown[]) {
        win.dataLayer?.push(args);
      };
    }
    win.gtag('js', new Date());
    win.gtag('config', gaId);

    return () => {
      document.getElementById('raloa-ga4-script')?.remove();
      if (typeof window !== 'undefined') {
        delete (window as Window & { gtag?: unknown }).gtag;
        delete (window as Window & { dataLayer?: unknown }).dataLayer;
      }
    };
  }, [profile?.gaMeasurementId, analyticsConsent, previewOnly]);

  // Meta Pixel (fbq) Injection
  useEffect(() => {
    if (
      previewOnly ||
      analyticsConsent !== 'granted' ||
      typeof profile?.metaPixelId !== 'string' ||
      typeof document === 'undefined'
    ) return;

    const pixelId = profile.metaPixelId.trim();
    if (!pixelId || !/^[0-9]+$/.test(pixelId)) return;

    const win = window as Window & {
      fbq?: {
        (...args: unknown[]): void;
        callMethod?: (...args: unknown[]) => void;
        queue?: unknown[];
        loaded?: boolean;
        version?: string;
      };
      _fbq?: unknown;
    };

    if (!win.fbq) {
      const fbqFunction: {
        (...args: unknown[]): void;
        callMethod?: (...args: unknown[]) => void;
        queue?: unknown[];
        loaded?: boolean;
        version?: string;
      } = function (...args: unknown[]) {
        if (fbqFunction.callMethod) {
          fbqFunction.callMethod(...args);
        } else {
          fbqFunction.queue?.push(args);
        }
      };
      fbqFunction.queue = [] as unknown[];
      fbqFunction.loaded = true;
      fbqFunction.version = '2.0';
      win.fbq = fbqFunction;
      win._fbq = fbqFunction;
    }

    if (!document.getElementById('raloa-meta-pixel-script')) {
      const script = document.createElement('script');
      script.id = 'raloa-meta-pixel-script';
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      script.async = true;
      const nonce = (window as Window & { __CSP_NONCE__?: string }).__CSP_NONCE__;
      if (nonce) {
        script.nonce = nonce;
      }
      document.head.appendChild(script);
    }

    win.fbq('init', pixelId);
    win.fbq('track', 'PageView');

    return () => {
      document.getElementById('raloa-meta-pixel-script')?.remove();
      if (typeof window !== 'undefined') {
        delete (window as Window & { fbq?: unknown }).fbq;
        delete (window as Window & { _fbq?: unknown })._fbq;
      }
    };
  }, [profile?.metaPixelId, analyticsConsent, previewOnly]);

  return null;
};
