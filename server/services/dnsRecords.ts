import dns from 'node:dns';

export type DnsState = 'verified' | 'pointing-elsewhere' | 'no-record' | 'lookup-unavailable';

export type DnsFinding = {
  state: DnsState;
  foundTargets: string[];
};

type StubMap = Record<string, string[] | 'error'>;

/**
 * A documented seam for proving the guided domain flow without owning a domain.
 *
 * It is deliberately narrow: never read in production, only for hosts it explicitly lists,
 * and dropped entirely if the JSON is malformed — a broken stub must not be able to report a
 * domain as verified.
 */
export function readDnsStub(env: NodeJS.ProcessEnv, nodeEnv: string): StubMap | undefined {
  if (nodeEnv === 'production') return undefined;
  const raw = env.RALOA_DNS_STUB;
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return undefined;
    const entries = Object.entries(parsed as Record<string, unknown>);
    if (entries.some(([, value]) => value !== 'error' && !Array.isArray(value))) return undefined;
    return Object.fromEntries(entries.map(([host, value]) => [host.toLowerCase(), value as string[] | 'error']));
  } catch {
    return undefined;
  }
}

export function normalizeTarget(record: string): string {
  return record.replace(/\.$/, '').toLowerCase();
}

export function classifyCname(records: string[], expectedTarget: string): DnsFinding {
  const foundTargets = records.map(normalizeTarget).filter(Boolean);
  if (foundTargets.length === 0) return { state: 'no-record', foundTargets: [] };
  if (foundTargets.includes(normalizeTarget(expectedTarget))) return { state: 'verified', foundTargets };
  return { state: 'pointing-elsewhere', foundTargets };
}

/** Answers for the listed hosts; everything else falls through to the real resolver. */
export async function inspectCname(host: string, expectedTarget: string): Promise<DnsFinding> {
  const stub = readDnsStub(process.env, process.env.NODE_ENV || '');
  const canned = stub?.[host.toLowerCase()];
  if (canned === 'error') return { state: 'lookup-unavailable', foundTargets: [] };
  if (canned) return classifyCname(canned, expectedTarget);

  try {
    return classifyCname(await dns.promises.resolveCname(host), expectedTarget);
  } catch (err) {
    const code = (err as { code?: string }).code;
    // A name that answers but has no CNAME is a configuration gap; a resolver that could not
    // answer at all is not, and telling those apart is the whole point of this endpoint.
    if (code === 'ENODATA' || code === 'ENOTFOUND' || code === 'ENOTIMP') {
      return { state: 'no-record', foundTargets: [] };
    }
    return { state: 'lookup-unavailable', foundTargets: [] };
  }
}
