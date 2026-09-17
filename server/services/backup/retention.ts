import { type BackupItem, type RetentionConfig } from './types.js';

const DEFAULT_RETENTION: RetentionConfig = { daily: 7, weekly: 4, monthly: 3, minimumKnownGood: 2 };

function readNonNegativeInteger(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 0 || value > 10_000) {
    console.warn(`[Backup retention] Ignoring invalid ${name}; using ${fallback}.`);
    return fallback;
  }
  return value;
}

export function getRetentionConfig(): RetentionConfig {
  return {
    daily: readNonNegativeInteger('BACKUP_RETENTION_DAILY', DEFAULT_RETENTION.daily),
    weekly: readNonNegativeInteger('BACKUP_RETENTION_WEEKLY', DEFAULT_RETENTION.weekly),
    monthly: readNonNegativeInteger('BACKUP_RETENTION_MONTHLY', DEFAULT_RETENTION.monthly),
    minimumKnownGood: Math.max(1, readNonNegativeInteger('BACKUP_RETENTION_MINIMUM_KNOWN_GOOD', DEFAULT_RETENTION.minimumKnownGood))
  };
}

export function getUploadBackupRetentionCount(): number {
  return Math.max(1, readNonNegativeInteger('UPLOAD_BACKUP_RETENTION_COUNT', 30));
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
  const effectiveConfig: RetentionConfig = {
    daily: Number.isSafeInteger(config.daily) && config.daily >= 0 ? config.daily : DEFAULT_RETENTION.daily,
    weekly: Number.isSafeInteger(config.weekly) && config.weekly >= 0 ? config.weekly : DEFAULT_RETENTION.weekly,
    monthly: Number.isSafeInteger(config.monthly) && config.monthly >= 0 ? config.monthly : DEFAULT_RETENTION.monthly,
    minimumKnownGood: Number.isSafeInteger(config.minimumKnownGood) && config.minimumKnownGood >= 1
      ? config.minimumKnownGood
      : DEFAULT_RETENTION.minimumKnownGood
  };
  // Sort descending by last modified (newest first)
  const sorted = [...items].sort((a, b) => b.lastModified - a.lastModified);
  const keep = new Set<string>();
  const valid = sorted.filter(item => item.valid !== false);

  // Always reserve the newest known-good backups before applying age/slot
  // rules. Corrupt items are never allowed to satisfy this safety floor.
  for (const item of valid.slice(0, effectiveConfig.minimumKnownGood)) keep.add(item.key);

  const dailySlots = new Map<string, string>();   // 'YYYY-MM-DD' -> key
  const weeklySlots = new Map<string, string>();  // 'YYYY-Www' -> key
  const monthlySlots = new Map<string, string>(); // 'YYYY-MM' -> key

  const nowMs = referenceDate.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const maxDailyAgeMs = effectiveConfig.daily * oneDayMs;
  const maxWeeklyAgeMs = effectiveConfig.weekly * 7 * oneDayMs;
  const maxMonthlyAgeMs = effectiveConfig.monthly * 31 * oneDayMs;

  for (const item of valid) {
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

    // Daily retention candidate
    if (ageMs <= maxDailyAgeMs && dailySlots.size < effectiveConfig.daily) {
      if (!dailySlots.has(dayKey)) {
        dailySlots.set(dayKey, item.key);
        keep.add(item.key);
      }
    }

    // Weekly retention candidate
    if (ageMs <= maxWeeklyAgeMs && weeklySlots.size < effectiveConfig.weekly) {
      if (!weeklySlots.has(weekKey)) {
        weeklySlots.set(weekKey, item.key);
        keep.add(item.key);
      }
    }

    // Monthly retention candidate
    if (ageMs <= maxMonthlyAgeMs && monthlySlots.size < effectiveConfig.monthly) {
      if (!monthlySlots.has(monthKey)) {
        monthlySlots.set(monthKey, item.key);
        keep.add(item.key);
      }
    }

  }

  const prune: string[] = [];
  for (const item of valid) {
    if (!keep.has(item.key)) {
      prune.push(item.key);
    }
  }

  return { keep, prune };
}
