import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { getSystemCapabilities } from '../server/routes/capabilities.js';

describe('System Capabilities API (/api/capabilities)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('is publicly accessible and returns expected structure without auth', async () => {
    const res = await request(app).get('/api/capabilities').expect(200);
    expect(res.body).toHaveProperty('importers');
    expect(res.body.importers).toHaveProperty('linktree');
    expect(res.body.importers).toHaveProperty('beacons');
    expect(res.body.importers).toHaveProperty('biofm');
    expect(res.body).toHaveProperty('instagram');
    expect(res.body).toHaveProperty('billing');
  });

  it('defaults competitor importers to false in default production environment', async () => {
    delete process.env.LINKTREE_IMPORT_ENABLED;
    delete process.env.LINKTREE_API_KEY;
    delete process.env.BEACONS_IMPORT_ENABLED;
    delete process.env.BEACONS_API_KEY;
    delete process.env.BIOFM_IMPORT_ENABLED;
    delete process.env.BIOFM_API_KEY;

    const capabilities = getSystemCapabilities();
    expect(capabilities.importers.linktree).toBe(false);
    expect(capabilities.importers.beacons).toBe(false);
    expect(capabilities.importers.biofm).toBe(false);

    const res = await request(app).get('/api/capabilities').expect(200);
    expect(res.body.importers.linktree).toBe(false);
    expect(res.body.importers.beacons).toBe(false);
    expect(res.body.importers.biofm).toBe(false);
  });

  it('fails closed: enabled flag without API key does not expose importer as available', async () => {
    process.env.LINKTREE_IMPORT_ENABLED = 'true';
    delete process.env.LINKTREE_API_KEY;

    process.env.BEACONS_IMPORT_ENABLED = 'true';
    delete process.env.BEACONS_API_KEY;

    process.env.BIOFM_IMPORT_ENABLED = 'true';
    delete process.env.BIOFM_API_KEY;

    const capabilities = getSystemCapabilities();
    expect(capabilities.importers.linktree).toBe(false);
    expect(capabilities.importers.beacons).toBe(false);
    expect(capabilities.importers.biofm).toBe(false);

    const res = await request(app).get('/api/capabilities').expect(200);
    expect(res.body.importers.linktree).toBe(false);
    expect(res.body.importers.beacons).toBe(false);
    expect(res.body.importers.biofm).toBe(false);
  });

  it('reflects configuration when both enabled flag and authorized provider key are configured', async () => {
    process.env.LINKTREE_IMPORT_ENABLED = 'true';
    process.env.LINKTREE_API_KEY = 'lt_sec_test_123';

    process.env.BEACONS_IMPORT_ENABLED = 'true';
    process.env.BEACONS_API_KEY = 'bc_sec_test_456';

    const capabilities = getSystemCapabilities();
    expect(capabilities.importers.linktree).toBe(true);
    expect(capabilities.importers.beacons).toBe(true);
    expect(capabilities.importers.biofm).toBe(false);

    const res = await request(app).get('/api/capabilities').expect(200);
    expect(res.body.importers.linktree).toBe(true);
    expect(res.body.importers.beacons).toBe(true);
    expect(res.body.importers.biofm).toBe(false);
  });

  it('correctly reflects instagram configuration status', async () => {
    delete process.env.INSTAGRAM_CLIENT_ID;
    delete process.env.INSTAGRAM_CLIENT_SECRET;
    expect(getSystemCapabilities().instagram).toBe(false);

    process.env.INSTAGRAM_CLIENT_ID = 'ig_client_id';
    process.env.INSTAGRAM_CLIENT_SECRET = 'ig_client_secret';
    expect(getSystemCapabilities().instagram).toBe(true);
  });

  it('correctly reflects billing configuration status', async () => {
    process.env.BILLING_ENABLED = 'false';
    expect(getSystemCapabilities().billing).toBe(false);

    process.env.BILLING_ENABLED = 'true';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_456';
    process.env.APP_ORIGIN = 'https://raloa.test';
    expect(getSystemCapabilities().billing).toBe(true);
  });
});
