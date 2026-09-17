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

    if (!document.getElementById('liinx-ga4-script')) {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
      script.async = true;
      script.id = 'liinx-ga4-script';
      document.head.appendChild(script);
    }
    if (!document.getElementById('liinx-ga4-inline')) {
      const inlineScript = document.createElement('script');
      inlineScript.id = 'liinx-ga4-inline';
      inlineScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    `;
      document.head.appendChild(inlineScript);
    }

    return () => {
      document.getElementById('liinx-ga4-script')?.remove();
      document.getElementById('liinx-ga4-inline')?.remove();
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

    if (!document.getElementById('liinx-meta-pixel')) {
      const script = document.createElement('script');
      script.id = 'liinx-meta-pixel';
      script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
      document.head.appendChild(script);
    }

    return () => {
      document.getElementById('liinx-meta-pixel')?.remove();
      if (typeof window !== 'undefined') {
        delete (window as Window & { fbq?: unknown }).fbq;
        delete (window as Window & { _fbq?: unknown })._fbq;
      }
    };
  }, [profile?.metaPixelId, analyticsConsent, previewOnly]);

  return null;
};
