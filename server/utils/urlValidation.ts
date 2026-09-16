/** Runtime-safe URL protocol validation for untrusted request payloads. */
export function hasAllowedUrlProtocol(value: unknown, protocols: readonly string[]): boolean {
  if (typeof value !== 'string' || value.trim() === '') return false;
  try {
    return protocols.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export const isHttpUrl = (value: unknown) => hasAllowedUrlProtocol(value, ['http:', 'https:']);
export const isSafeLinkUrl = (value: unknown) => hasAllowedUrlProtocol(value, ['http:', 'https:', 'mailto:', 'tel:']);
