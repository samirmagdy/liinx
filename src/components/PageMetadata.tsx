import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '../context/LanguageContext';
import { pageTitles } from '../config/pages';
import { brand } from '../config/brand';
export function PageMetadata() {
  const [location] = useLocation();
  const { lang } = useLanguage();
  useEffect(() => {
    const path = location.split('?')[0];
    const title = pageTitles[path];
    if (title) document.title = `${title[lang === 'ar' ? 1 : 0]} | ${brand.productName}`;
    const privatePage = ['/login', '/register', '/studio'].includes(path);
    document.querySelector('meta[name="robots"]')?.setAttribute('content', privatePage ? 'noindex, nofollow' : 'index, follow');
    const canonicalOrigin = brand.domain === window.location.hostname ? window.location.origin : `https://${brand.domain}`;
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', `${canonicalOrigin}${path}`);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', `${canonicalOrigin}${path}`);
    if (title) document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title);
    document.querySelector('meta[property="article:modified_time"]')?.setAttribute('content', '2026-09-15');
  }, [location, lang]);
  return null;
}
