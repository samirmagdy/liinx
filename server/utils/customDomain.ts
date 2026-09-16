import net from 'node:net';

const labelPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

export function normalizeCustomDomain(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  let domain = value.trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, '').replace(/\.$/, '');
  if (domain.includes('/') || domain.includes(':') || domain.length < 4 || domain.length > 253) return null;
  if (net.isIP(domain) || domain.includes('..')) return null;
  const labels = domain.split('.');
  if (labels.length < 2 || labels.some(label => !labelPattern.test(label))) return null;
  const tld = labels[labels.length - 1];
  if (tld.length < 2 || !/^[a-z]{2,63}$/i.test(tld)) return null;
  return domain;
}
