import { Language } from '../config/i18n';

export function getUiLocale(lang: Language): string {
  return lang === 'ar' ? 'ar-SA' : 'en-US';
}

export function formatUiDate(value: number | string | Date, lang: Language): string {
  return new Intl.DateTimeFormat(getUiLocale(lang), { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}

export function formatUiDateTime(value: number | string | Date, lang: Language): string {
  return new Intl.DateTimeFormat(getUiLocale(lang), { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value));
}
