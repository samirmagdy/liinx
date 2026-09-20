import { afterEach, describe, expect, it, vi } from 'vitest';
import { entitlementsFor, hasEntitlement, normalizePlan } from '../shared/config/plans';
import { EmailDeliveryUnavailable, sendTransactionalEmail } from '../server/services/email.js';
import { hasAllowedUrlProtocol, isHttpUrl, isSafeLinkUrl } from '../server/utils/urlValidation.js';
import { InProcessJobScheduler } from '../server/infrastructure/inProcessScheduler.js';

describe('shared plan helpers', () => {
  it('falls back to free for unknown values and returns each plan entitlement set', () => {
    expect(normalizePlan('pro')).toBe('pro');
    expect(normalizePlan('studio')).toBe('studio');
    expect(normalizePlan(undefined)).toBe('free');
    expect(normalizePlan('enterprise')).toBe('free');

    expect(entitlementsFor('free').maxProfiles).toBe(1);
    expect(entitlementsFor('pro').maxProfiles).toBe(5);
    expect(entitlementsFor('studio').maxProfiles).toBe(25);
    expect(hasEntitlement('free', 'apiAccess')).toBe(false);
    expect(hasEntitlement('studio', 'apiAccess')).toBe(true);
    expect(hasEntitlement('unknown', 'customDomain')).toBe(false);
  });
});

describe('transactional email delivery', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('requires both provider credentials', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('CONTACT_FROM_EMAIL', 'support@example.test');
    await expect(sendTransactionalEmail({ to: 'user@example.test', subject: 'Hello', text: 'Message' }))
      .rejects.toBeInstanceOf(EmailDeliveryUnavailable);

    vi.stubEnv('RESEND_API_KEY', 'test-key');
    vi.stubEnv('CONTACT_FROM_EMAIL', '');
    await expect(sendTransactionalEmail({ to: 'user@example.test', subject: 'Hello', text: 'Message' }))
      .rejects.toBeInstanceOf(EmailDeliveryUnavailable);
  });

  it('sends the message and reports provider rejection', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key');
    vi.stubEnv('CONTACT_FROM_EMAIL', 'support@example.test');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false });
    vi.stubGlobal('fetch', fetchMock);

    await expect(sendTransactionalEmail({ to: 'user@example.test', subject: 'Hello', text: 'Message' }))
      .resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ from: 'support@example.test', to: ['user@example.test'], subject: 'Hello', text: 'Message' })
    }));
    await expect(sendTransactionalEmail({ to: 'user@example.test', subject: 'Hello', text: 'Message' }))
      .rejects.toThrow('Transactional email provider rejected the message.');
  });
});

describe('URL protocol validation', () => {
  it('rejects non-strings, blank strings, malformed URLs, and unsupported protocols', () => {
    expect(hasAllowedUrlProtocol(null, ['https:'])).toBe(false);
    expect(hasAllowedUrlProtocol('   ', ['https:'])).toBe(false);
    expect(hasAllowedUrlProtocol('http://[', ['http:'])).toBe(false);
    expect(hasAllowedUrlProtocol('javascript:alert(1)', ['https:'])).toBe(false);
    expect(isHttpUrl('https://example.test')).toBe(true);
    expect(isSafeLinkUrl('mailto:hello@example.test')).toBe(true);
  });
});

describe('in-process job scheduler', () => {
  afterEach(() => vi.useRealTimers());

  it('starts registered jobs once, includes jobs registered while running, and contains job failures', async () => {
    vi.useFakeTimers();
    const scheduler = new InProcessJobScheduler();
    const firstJob = vi.fn().mockRejectedValueOnce(new Error('job failure'));
    const secondJob = vi.fn().mockResolvedValue(undefined);
    scheduler.register({ name: 'first', intervalMs: 10, run: firstJob });

    scheduler.start();
    scheduler.start();
    scheduler.register({ name: 'second', intervalMs: 10, run: secondJob });
    await vi.advanceTimersByTimeAsync(10);

    expect(firstJob).toHaveBeenCalledOnce();
    expect(secondJob).toHaveBeenCalledOnce();
    scheduler.stop();
    scheduler.stop();
  });
});
