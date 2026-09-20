import type { Language } from '../config/i18n';

const ARABIC_PREFIX = '/ar';

export function languageForPath(pathname?: string | null): Language {
  const path = typeof pathname === 'string' && pathname ? pathname : '/';
  return path === ARABIC_PREFIX || path.startsWith(`${ARABIC_PREFIX}/`) ? 'ar' : 'en';
}

export function localizedPath(pathname: string | null | undefined, language: Language): string {
  const path = typeof pathname === 'string' && pathname ? pathname : '/';
  const withoutArabicPrefix = path.replace(/^\/ar(?=\/|$)/, '') || '/';
  const normalizedPath = withoutArabicPrefix.startsWith('/') ? withoutArabicPrefix : `/${withoutArabicPrefix}`;
  if (language === 'en') return normalizedPath;
  return normalizedPath === '/' ? '/ar/' : `/ar${normalizedPath}`;
}
