import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '../context/LanguageContext';
import { pageTitles, pageDescriptions } from '../config/pages';
import { brand } from '../config/brand';
import { localizedPath } from '../utils/languagePaths';
export function PageMetadata() {
  const [location] = useLocation();
  const { lang } = useLanguage();
  useEffect(() => {
    const path = location.split('?')[0];
    const title = pageTitles[path];
    const languageIndex = lang === 'ar' ? 1 : 0;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    if (title) document.title = `${title[languageIndex]} | ${brand.productName}`;
    const description = pageDescriptions[path]?.[languageIndex];
    if (description) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', description);
      document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
      document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);
    }
    const privatePage = ['/login', '/register', '/studio', '/account'].includes(path);
    document.querySelector('meta[name="robots"]')?.setAttribute('content', privatePage ? 'noindex, nofollow' : 'index, follow');
    const canonicalOrigin = brand.domain === window.location.hostname ? window.location.origin : `https://${brand.domain}`;
    const canonical = `${canonicalOrigin}${localizedPath(path, lang)}`;
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonical);
    const localizedPublicPage = Boolean(title) && !privatePage;
    const setAlternate = (language: string, href: string | null) => {
      const selector = `link[rel="alternate"][hreflang="${language}"]`;
      let alternate = document.querySelector<HTMLLinkElement>(selector);
      if (!href) {
        alternate?.remove();
        return;
      }
      if (!alternate) {
        alternate = document.createElement('link');
        alternate.rel = 'alternate';
        alternate.hreflang = language;
        document.head.appendChild(alternate);
      }
      alternate.href = href;
    };
    setAlternate('en', localizedPublicPage ? `${canonicalOrigin}${localizedPath(path, 'en')}` : null);
    setAlternate('ar', localizedPublicPage ? `${canonicalOrigin}${localizedPath(path, 'ar')}` : null);
    setAlternate('x-default', localizedPublicPage ? `${canonicalOrigin}${localizedPath(path, 'en')}` : null);
    if (title) {
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title);
      document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', document.title);
    }
  }, [location, lang]);
  return null;
}
