import { type BackupItem, type RetentionConfig } from './types.js';

export function getRetentionConfig(): RetentionConfig {
  return {
    daily: Math.max(1, Number(process.env.BACKUP_RETENTION_DAILY || 7)),
    weekly: Math.max(1, Number(process.env.BACKUP_RETENTION_WEEKLY || 4)),
    monthly: Math.max(1, Number(process.env.BACKUP_RETENTION_MONTHLY || 3))
  };
}

/**
 * Categorizes backups and determines which keys to retain and which to prune
 * using a Grandfather-Father-Son (Daily/Weekly/Monthly) lifecycle strategy.
 */
export function evaluateRetention(
  items: BackupItem[],
  config: RetentionConfig = getRetentionConfig(),
  referenceDate = new Date()
): { keep: Set<string>; prune: string[] } {
  // Sort descending by last modified (newest first)
  const sorted = [...items].sort((a, b) => b.lastModified - a.lastModified);
  const keep = new Set<string>();

  const dailySlots = new Map<string, string>();   // 'YYYY-MM-DD' -> key
  const weeklySlots = new Map<string, string>();  // 'YYYY-Www' -> key
  const monthlySlots = new Map<string, string>(); // 'YYYY-MM' -> key

  const nowMs = referenceDate.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const maxDailyAgeMs = config.daily * oneDayMs;
  const maxWeeklyAgeMs = config.weekly * 7 * oneDayMs;
  const maxMonthlyAgeMs = config.monthly * 31 * oneDayMs;

  for (const item of sorted) {
    const ageMs = nowMs - item.lastModified;
    const date = new Date(item.lastModified);

    // Format keys
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const dayKey = `${year}-${month}-${day}`;

    // Simple ISO week number
    const target = new Date(date.valueOf());
    const dayNr = (date.getUTCDay() + 6) % 7;
    target.setUTCDate(target.getUTCDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setUTCMonth(0, 1);
    if (target.getUTCDay() !== 4) {
      target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
    }
    const weekNr = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    const weekKey = `${year}-W${String(weekNr).padStart(2, '0')}`;

    const monthKey = `${year}-${month}`;

    let retained = false;

    // Daily retention candidate
    if (ageMs <= maxDailyAgeMs && dailySlots.size < config.daily) {
      if (!dailySlots.has(dayKey)) {
        dailySlots.set(dayKey, item.key);
        keep.add(item.key);
        retained = true;
      }
    }

    // Weekly retention candidate
    if (ageMs <= maxWeeklyAgeMs && weeklySlots.size < config.weekly) {
      if (!weeklySlots.has(weekKey)) {
        weeklySlots.set(weekKey, item.key);
        keep.add(item.key);
        retained = true;
      }
    }

    // Monthly retention candidate
    if (ageMs <= maxMonthlyAgeMs && monthlySlots.size < config.monthly) {
      if (!monthlySlots.has(monthKey)) {
        monthlySlots.set(monthKey, item.key);
        keep.add(item.key);
        retained = true;
      }
    }

    // Always keep at least the single latest backup if nothing else matched
    if (!retained && keep.size === 0) {
      keep.add(item.key);
    }
  }

  const prune: string[] = [];
  for (const item of sorted) {
    if (!keep.has(item.key)) {
      prune.push(item.key);
    }
  }

  return { keep, prune };
}
