import type { Database as BetterSqliteDatabase } from 'better-sqlite3';
import { DatabaseAdapter, DatabaseHealthResult } from './interfaces.js';
import { db as defaultDb } from '../db.js';

export class SqliteDatabaseAdapter implements DatabaseAdapter {
  readonly engine = 'sqlite' as const;
  private readonly sqliteDb: BetterSqliteDatabase;

  constructor(sqliteInstance?: BetterSqliteDatabase) {
    this.sqliteDb = sqliteInstance || defaultDb;
  }

  query<T = unknown>(sql: string, params: unknown[] = []): T[] {
    return this.sqliteDb.prepare(sql).all(...params) as T[];
  }

  queryOne<T = unknown>(sql: string, params: unknown[] = []): T | undefined {
    return this.sqliteDb.prepare(sql).get(...params) as T | undefined;
  }

  execute(sql: string, params: unknown[] = []): { changes: number; lastInsertRowid?: number | bigint } {
    const info = this.sqliteDb.prepare(sql).run(...params);
    return {
      changes: info.changes,
      lastInsertRowid: info.lastInsertRowid
    };
  }

  transaction<T>(fn: () => T): T {
    return this.sqliteDb.transaction(fn)();
  }

  healthCheck(): DatabaseHealthResult {
    const start = process.hrtime();
    try {
      this.sqliteDb.prepare('SELECT 1').get();
      const elapsed = process.hrtime(start);
      const latencyMs = Number((elapsed[0] * 1000 + elapsed[1] / 1e6).toFixed(2));
      return {
        healthy: true,
        engine: 'sqlite',
        latencyMs
      };
    } catch (err: any) {
      return {
        healthy: false,
        engine: 'sqlite',
        error: err?.message || 'SQLite query failed'
      };
    }
  }

  close(): void {
    this.sqliteDb.close();
  }
}

export const sqliteDatabaseAdapter = new SqliteDatabaseAdapter();
