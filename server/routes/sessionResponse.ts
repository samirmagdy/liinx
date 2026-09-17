/**
 * Browser sessions are delivered through HttpOnly cookies. The test-only
 * bearer field exists solely for legacy API fixtures that cannot retain a
 * cookie jar; it must never be emitted by a production process.
 */
export function testOnlySessionToken(token: string | undefined): { token?: string } {
  return process.env.NODE_ENV === 'test' && token ? { token } : {};
}
