import { defineConfig, devices } from 'playwright/test';
import os from 'node:os';
import path from 'node:path';
import { brand } from './shared/config/brand';

const port = 3178;
const baseURL = `http://127.0.0.1:${port}`;
const databasePath = path.join(os.tmpdir(), `raloa-playwright-${process.pid}.db`);

/**
 * The documented DNS stub (see server/services/dnsRecords.ts and .env.example). It answers only
 * these hosts; every other lookup still goes to real DNS, and it is never read in production.
 */
const dnsStub = {
  'dns-missing.procreator.test': [],
  'dns-wrong.procreator.test': ['old-host.example.com'],
  'dns-live.procreator.test': [brand.cnameTarget]
};

export default defineConfig({
  testDir: './playwright/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: 'list',
  outputDir: 'test-results/playwright',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ...devices['Desktop Chrome']
  },
  webServer: {
    command: 'npm run dev',
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NODE_ENV: 'development',
      PORT: String(port),
      VITE_HMR_PORT: '32778',
      DATABASE_PATH: databasePath,
      APP_ORIGIN: baseURL,
      CORS_ORIGIN: baseURL,
      MAINTENANCE_ENABLED: 'false',
      RESEND_API_KEY: '',
      CONTACT_FROM_EMAIL: '',
      // Only this throwaway suite reads it, and only to open a paid tier without Stripe.
      ADMIN_SECRET: 'playwright-plan-bridge',
      RALOA_DNS_STUB: JSON.stringify(dnsStub)
    }
  }
});
