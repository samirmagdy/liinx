const baseUrl = (process.env.HEALTHCHECK_URL || 'http://localhost:3050').replace(/\/$/, '');
const timeoutMs = Number(process.env.HEALTHCHECK_TIMEOUT_MS || 5000);
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), timeoutMs);

try {
  const response = await fetch(`${baseUrl}/api/health`, { signal: controller.signal, headers: { accept: 'application/json' } });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.status !== 'ok') throw new Error(`Health check failed with HTTP ${response.status}`);
  console.log(JSON.stringify({ status: 'ok', url: `${baseUrl}/api/health`, timestamp: new Date().toISOString() }));
} catch (error) {
  console.error(JSON.stringify({ status: 'unhealthy', url: `${baseUrl}/api/health`, error: error instanceof Error ? error.message : 'unknown error' }));
  process.exitCode = 1;
} finally {
  clearTimeout(timer);
}
