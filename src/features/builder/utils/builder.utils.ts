import { formatUiDate } from '../../../utils/localization';
import { Language } from '../../../config/i18n';

export const toDateTimeLocal = (ts?: number | null): string => {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
};

export const fromDateTimeLocal = (val: string): number | null => {
  if (!val) return null;
  const parsed = new Date(val).getTime();
  return isNaN(parsed) ? null : parsed;
};

export interface ScheduleStatus {
  label: string;
  color: string;
}

export const getScheduleStatus = (
  startAt?: number | null,
  endAt?: number | null,
  ui: (key: string) => string = (k) => k,
  lang: Language = 'en'
): ScheduleStatus | null => {
  if (!startAt && !endAt) return null;
  const now = Date.now();
  if (startAt && now < startAt) {
    return {
      label: `${ui('Scheduled')} (${formatUiDate(startAt, lang)})`,
      color: 'bg-amber-100 text-amber-800'
    };
  }
  if (endAt && now >= endAt) {
    return { label: 'EXPIRED', color: 'bg-neutral-100 text-neutral-600' };
  }
  return { label: ui('Live scheduled'), color: 'bg-emerald-100 text-emerald-800' };
};

export const initialPageId = (nextProfile: { pages?: Array<{ id: string; isHome?: boolean }> }): string =>
  nextProfile.pages?.find(page => page.isHome)?.id || nextProfile.pages?.[0]?.id || '';

