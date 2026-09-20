import type { Language } from '../config/i18n';

const ARABIC_PREFIX = '/ar';

export function languageForPath(pathname: string): Language {
  return pathname === ARABIC_PREFIX || pathname.startsWith(`${ARABIC_PREFIX}/`) ? 'ar' : 'en';
}

export function localizedPath(pathname: string, language: Language): string {
  const withoutArabicPrefix = pathname.replace(/^\/ar(?=\/|$)/, '') || '/';
  const normalizedPath = withoutArabicPrefix.startsWith('/') ? withoutArabicPrefix : `/${withoutArabicPrefix}`;
  if (language === 'en') return normalizedPath;
  return normalizedPath === '/' ? '/ar/' : `/ar${normalizedPath}`;
}
