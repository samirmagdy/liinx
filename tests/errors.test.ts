import { describe, expect, it } from 'vitest';
import { friendlyErrorMessage } from '../src/utils/errors';

describe('friendly error messages', () => {
  it('turns common transport failures into an actionable message', () => {
    expect(friendlyErrorMessage({ status: 503, message: 'database exploded' })).toMatch(/temporarily unavailable/i);
    expect(friendlyErrorMessage({ message: 'Failed to fetch' })).toMatch(/reach LIINX/i);
  });

  it('does not expose implementation details', () => {
    expect(friendlyErrorMessage({ status: 500, message: 'SQLITE_CONSTRAINT: users.email' })).not.toMatch(/sqlite|users/i);
    expect(friendlyErrorMessage({ message: 'Cannot read properties of undefined' })).not.toMatch(/undefined/i);
  });

  it('preserves useful validation guidance', () => {
    expect(friendlyErrorMessage({ status: 400, message: 'Username is already taken' })).toBe('Username is already taken');
  });
});
