import { afterEach } from 'vitest';
import { resetAuthRateLimits } from '../server/routes/auth.js';

// Auth throttles are intentionally process-local in the current single-node
// implementation. Tests must not inherit a previous test's source IP budget.
afterEach(() => {
  resetAuthRateLimits();
});
