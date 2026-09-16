export interface AppError extends Error {
  status?: number;
  code?: string;
}

/** Converts transport, validation, and server failures into actionable copy. */
export function friendlyErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  const appError = error as AppError | null | undefined;
  const status = appError?.status;
  const raw = typeof appError?.message === 'string' ? appError.message.trim() : '';

  if (status === 408 || appError?.name === 'AbortError') return 'That took too long. Check your connection and try again.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to do that on your current plan.';
  if (status === 404) return 'We could not find what you requested. It may have been removed.';
  if (status === 409) return raw || 'That conflicts with existing information. Please choose another value.';
  if (status === 413) return 'That file or request is too large. Please choose a smaller one.';
  if (status === 429) return 'You are doing that too often. Please wait a moment and try again.';
  if (status >= 500) return 'The service is temporarily unavailable. Please try again shortly.';
  if (!status && /network|fetch failed|failed to fetch|backend unreachable/i.test(raw)) {
    return 'We could not reach LIINX. Check your connection and try again.';
  }

  // Never surface implementation details, SQL errors, or stack-like messages.
  if (!raw || /(?:sql|sqlite|eaddrinuse|undefined|cannot read|stack trace| at \w)/i.test(raw)) return fallback;
  return raw;
}
