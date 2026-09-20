import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function runMigration(mode: 'fresh' | 'legacy') {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'raloa-task-04-'));
  const dbPath = path.join(directory, 'raloa.db');
  const uploads = path.join(directory, 'uploads');
  fs.mkdirSync(uploads);
  const fixture = path.resolve('tests/fixtures/migration-check.ts');
  const output = execFileSync(process.execPath, ['--import', 'tsx/esm', fixture], {
    env: { ...process.env, DATABASE_PATH: dbPath, UPLOADS_DIR: uploads, NODE_ENV: 'production', MIGRATION_MODE: mode },
    encoding: 'utf8'
  });
  return JSON.parse(output.trim().split('\n').at(-1) || '{}') as { homes: number; blocks: number; migrationRows: number; snapshot: boolean; duplicateHomeRejected: boolean };
}

function runAccountBillingMigration() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'raloa-account-billing-'));
  const dbPath = path.join(directory, 'raloa.db');
  const fixture = path.resolve('tests/fixtures/account-billing-migration-check.ts');
  try {
    const output = execFileSync(process.execPath, ['--import', 'tsx/esm', fixture], {
      env: { ...process.env, DATABASE_PATH: dbPath, NODE_ENV: 'production' },
      encoding: 'utf8'
    });
    return JSON.parse(output.trim().split('\n').at(-1) || '{}');
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

describe('database migrations and invariants', () => {
  it('initializes a fresh database and safely runs migrations twice', () => {
    expect(runMigration('fresh')).toEqual({ homes: 0, blocks: 0, migrationRows: 1, snapshot: false, duplicateHomeRejected: false });
  });

  it('upgrades a legacy fixture from a snapshot without losing content', () => {
    expect(runMigration('legacy')).toEqual({ homes: 1, blocks: 3, migrationRows: 1, snapshot: true, duplicateHomeRejected: true });
  });

  it('moves the paid plan and Stripe ownership off legacy profiles to the account', () => {
    expect(runAccountBillingMigration()).toEqual({
      accountPlan: 'studio',
      accountCustomer: 'cus_legacy',
      accountSubscription: 'sub_legacy',
      profilePlans: ['studio', 'studio'],
      profileSubscriptionIds: [null, null],
      staleProfilePlan: 'free'
    });
  });
});
