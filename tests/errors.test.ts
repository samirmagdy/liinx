import { describe, expect, it } from 'vitest';
import { friendlyErrorMessage } from '../src/utils/errors';

describe('friendly error messages', () => {
  it('turns common transport failures into an actionable message', () => {
    expect(friendlyErrorMessage({ status: 503, message: 'database exploded' })).toMatch(/temporarily unavailable/i);
    expect(friendlyErrorMessage({ message: 'Failed to fetch' })).toMatch(/reach RALOA/i);
  });

  it('does not expose implementation details', () => {
    expect(friendlyErrorMessage({ status: 500, message: 'SQLITE_CONSTRAINT: users.email' })).not.toMatch(/sqlite|users/i);
    expect(friendlyErrorMessage({ message: 'Cannot read properties of undefined' })).not.toMatch(/undefined/i);
  });

  it('preserves useful validation guidance', () => {
    expect(friendlyErrorMessage({ status: 400, message: 'Username is already taken' })).toBe('Username is already taken');
  });

  it('maps specific HTTP statuses and error structures correctly', () => {
    expect(friendlyErrorMessage({ status: 408 })).toMatch(/took too long/i);
    expect(friendlyErrorMessage({ name: 'AbortError' })).toMatch(/took too long/i);
    expect(friendlyErrorMessage({ status: 401 })).toMatch(/session has expired/i);
    expect(friendlyErrorMessage({ status: 403 })).toMatch(/permission/i);
    expect(friendlyErrorMessage({ status: 404 })).toMatch(/could not find/i);
    expect(friendlyErrorMessage({ status: 409, message: 'Slug already taken' })).toBe('Slug already taken');
    expect(friendlyErrorMessage({ status: 409 })).toMatch(/conflicts with existing/i);
    expect(friendlyErrorMessage({ status: 413 })).toMatch(/too large/i);
    expect(friendlyErrorMessage({ status: 429 })).toMatch(/doing that too often/i);
    expect(friendlyErrorMessage({ message: 'backend unreachable' })).toMatch(/reach RALOA/i);
    expect(friendlyErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
    expect(friendlyErrorMessage(undefined)).toBe('Something went wrong. Please try again.');
    expect(friendlyErrorMessage(new Error('Direct string error'))).toBe('Direct string error');
  });
});
