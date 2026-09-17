import { SQLiteAnalyticsEventStore } from './sqliteAnalyticsEventStore.js';

/** @deprecated Kept as a compatibility export for existing infrastructure tests. */
export class MemoryBufferedEventStore extends SQLiteAnalyticsEventStore {
  readonly name = 'memory-buffered-sqlite';
}

export const memoryBufferedEventStore = new MemoryBufferedEventStore();
