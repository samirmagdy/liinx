type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levels: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const configuredLevel = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
const minimumLevel = levels[configuredLevel] ? configuredLevel : 'info';

function safeError(error: unknown) {
  if (!(error instanceof Error)) return undefined;
  return { name: error.name, message: error.message, stack: process.env.NODE_ENV === 'production' ? undefined : error.stack };
}

export function log(level: LogLevel, message: string, fields: Record<string, unknown> = {}) {
  if (levels[level] < levels[minimumLevel]) return;
  const entry = { timestamp: new Date().toISOString(), level, service: 'raloa-api', message, ...fields };
  process.stdout.write(`${JSON.stringify(entry)}\n`);
}

export function logError(message: string, error: unknown, fields: Record<string, unknown> = {}) {
  log('error', message, { ...fields, error: safeError(error) });
}
