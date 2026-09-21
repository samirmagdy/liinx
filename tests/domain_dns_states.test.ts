import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';
import { signJwt } from '../server/auth.js';
import { brand } from '../shared/index.js';
import { readDnsStub, classifyCname } from '../server/services/dnsRecords.js';

const TARGET = brand.cnameTarget;
const HOST = 'dns-states.procreator.studio';

const userId = 'usr_dns_states';
const profileId = 'prf_dns_states';
const username = 'dnsstates';
let token = '';

function stub(value: string[] | 'error') {
  process.env.RALOA_DNS_STUB = JSON.stringify({ [HOST]: value });
}

async function verify() {
  const res = await request(app)
    .post('/api/studio/custom-domain/verify')
    .set('Authorization', `Bearer ${token}`)
    .send({ domain: HOST });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return res.body;
}

function storedFlag() {
  return (db.prepare('SELECT custom_domain_verified AS v FROM profiles WHERE id = ?').get(profileId) as { v: number }).v;
}

describe('DNS verification names the record that is missing', () => {
  beforeAll(() => {
    initDatabase();
    const now = Date.now();
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
      userId, 'dnsstates@raloa.test', 'hashed', now
    );
    db.prepare("UPDATE users SET subscription_plan = 'pro' WHERE id = ?").run(userId);
    db.prepare('DELETE FROM profiles WHERE id = ? OR username = ?').run(profileId, username);
    db.prepare(`
      INSERT INTO profiles (id, user_id, username, display_name, plan, custom_domain, custom_domain_verified, created_at, updated_at)
      VALUES (?, ?, ?, 'DNS States', 'pro', ?, 0, ?, ?)
    `).run(profileId, userId, username, HOST, now, now);
    token = signJwt({ userId, email: 'dnsstates@raloa.test', profileId, username });
  });

  afterEach(() => {
    delete process.env.RALOA_DNS_STUB;
    db.prepare('UPDATE profiles SET custom_domain_verified = 0 WHERE id = ?').run(profileId);
  });

  it('says there is no CNAME at all, and names the record to add', async () => {
    stub([]);
    const body = await verify();
    expect(body.state).toBe('no-record');
    expect(body.verified).toBe(false);
    expect(body.message).toContain(HOST);
    expect(body.message).toContain(TARGET);
    expect(body.message.toLowerCase()).toContain('cname');
    expect(storedFlag()).toBe(0);
  });

  it('names the target the domain currently points at when it is the wrong one', async () => {
    stub(['wrong-host.example.com']);
    const body = await verify();
    expect(body.state).toBe('pointing-elsewhere');
    expect(body.foundTargets).toEqual(['wrong-host.example.com']);
    expect(body.message).toContain('wrong-host.example.com');
    expect(body.message).toContain(TARGET);
    expect(storedFlag()).toBe(0);
  });

  it('confirms the match in plain words and stores the flag', async () => {
    stub([`${TARGET}.`]);
    const body = await verify();
    expect(body.state).toBe('verified');
    expect(body.verified).toBe(true);
    expect(body.message).toContain(HOST);
    expect(storedFlag()).toBe(1);
  });

  it('separates a resolver that could not answer from a domain that is not configured', async () => {
    stub('error');
    const body = await verify();
    expect(body.state).toBe('lookup-unavailable');
    expect(body.verified).toBe(false);
    expect(body.message).not.toMatch(/no CNAME record/i);
    expect(storedFlag()).toBe(0);
  });

  it('revokes a previously verified domain when the record goes away', async () => {
    db.prepare('UPDATE profiles SET custom_domain_verified = 1 WHERE id = ?').run(profileId);
    stub([]);
    await verify();
    expect(storedFlag()).toBe(0);
  });
});

describe('the DNS stub is a test seam that fails closed', () => {
  afterEach(() => { delete process.env.RALOA_DNS_STUB; });

  it('is never read in production', () => {
    process.env.RALOA_DNS_STUB = JSON.stringify({ [HOST]: [TARGET] });
    expect(readDnsStub(process.env, 'production')).toBeUndefined();
    expect(readDnsStub({ RALOA_DNS_STUB: process.env.RALOA_DNS_STUB }, 'test')).toBeDefined();
  });

  it('ignores malformed configuration instead of trusting it', () => {
    expect(readDnsStub({ RALOA_DNS_STUB: '{not json' }, 'test')).toBeUndefined();
    expect(readDnsStub({ RALOA_DNS_STUB: JSON.stringify({ [HOST]: 42 }) }, 'test')).toBeUndefined();
  });

  it('treats an unlisted host as no stub at all', () => {
    const map = readDnsStub({ RALOA_DNS_STUB: JSON.stringify({ 'other.test': [TARGET] }) }, 'test');
    expect(map?.[HOST]).toBeUndefined();
  });

  it('only reports verified for an exact target match', () => {
    expect(classifyCname([`${TARGET}.`], TARGET).state).toBe('verified');
    expect(classifyCname([`not-${TARGET}`], TARGET).state).toBe('pointing-elsewhere');
    expect(classifyCname([], TARGET).state).toBe('no-record');
  });
});
