import dns from 'dns';
import net from 'net';

export function isPrivateOrReservedIp(ipStr: string): boolean {
  const ip = ipStr.trim();
  const kind = net.isIP(ip);
  if (!kind) return true; // Not a valid IP -> unsafe

  if (kind === 4) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(n => isNaN(n) || n < 0 || n > 255)) {
      return true;
    }
    const [a, b, c] = parts;
    // 0.0.0.0/8 (Current network)
    if (a === 0) return true;
    // 10.0.0.0/8 (Private RFC1918)
    if (a === 10) return true;
    // 100.64.0.0/10 (Carrier-grade NAT)
    if (a === 100 && b >= 64 && b <= 127) return true;
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;
    // 169.254.0.0/16 (Link Local / Cloud Metadata)
    if (a === 169 && b === 254) return true;
    // 172.16.0.0/12 (Private RFC1918)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (a === 192 && b === 0 && c === 0) return true;
    // 192.0.2.0/24 (TEST-NET-1)
    if (a === 192 && b === 0 && c === 2) return true;
    // 192.88.99.0/24 (6to4 Relay)
    if (a === 192 && b === 88 && c === 99) return true;
    // 192.168.0.0/16 (Private RFC1918)
    if (a === 192 && b === 168) return true;
    // 198.18.0.0/15 (Benchmarking)
    if (a === 198 && (b === 18 || b === 19)) return true;
    // 198.51.100.0/24 (TEST-NET-2)
    if (a === 198 && b === 51 && c === 100) return true;
    // 203.0.113.0/24 (TEST-NET-3)
    if (a === 203 && b === 0 && c === 113) return true;
    // 224.0.0.0/4 (Multicast)
    if (a >= 224 && a <= 239) return true;
    // 240.0.0.0/4 (Reserved)
    if (a >= 240) return true;

    return false;
  }

  if (kind === 6) {
    const lower = ip.toLowerCase();
    // Unspecified & Loopback
    if (lower === '::' || lower === '0:0:0:0:0:0:0:0' || lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
    // Unique Local (fc00::/7 -> starts with fc or fd)
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
    // Link Local (fe80::/10)
    if (/^fe[89ab]/i.test(lower)) return true;
    // IPv4-mapped IPv6 (::ffff:127.0.0.1)
    if (lower.startsWith('::ffff:') || lower.includes(':ffff:')) {
      const ipv4Part = lower.split(':').pop();
      if (ipv4Part && net.isIPv4(ipv4Part)) {
        return isPrivateOrReservedIp(ipv4Part);
      }
      return true;
    }
    return false;
  }

  return true;
}

// Anti-SSRF check: block internal IPs, local hostnames, and reserved metadata ranges
export function isSafePublicUrl(inputUrl: string): boolean {
  try {
    const parsed = new URL(inputUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;

    const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    // Block localhost, local domains, and internal cloud metadata hostnames
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname === 'metadata.google.internal' ||
      hostname === '169.254.169.254'
    ) {
      return false;
    }

    // Block encoded integer / octal / hex IPs (e.g. 2130706433, 0x7f000001, 017700000001)
    if (/^\d+$/.test(hostname) || /^0x[0-9a-f]+$/i.test(hostname) || /^0\d+/.test(hostname)) {
      return false;
    }

    // If hostname is directly an IP, validate it
    if (net.isIP(hostname)) {
      return !isPrivateOrReservedIp(hostname);
    }

    return true;
  } catch {
    return false;
  }
}

export async function isSafePublicUrlAsync(inputUrl: string): Promise<boolean> {
  if (!isSafePublicUrl(inputUrl)) return false;
  try {
    const parsed = new URL(inputUrl);
    // DNS resolution re-validation to block DNS rebinding attacks
    const addresses = await dns.promises.lookup(parsed.hostname, { all: true });
    if (!addresses || addresses.length === 0) return false;

    for (const addr of addresses) {
      if (isPrivateOrReservedIp(addr.address)) {
        return false;
      }
    }
    return true;
  } catch {
    // If hostname does not resolve, it cannot be safely fetched
    return false;
  }
}
