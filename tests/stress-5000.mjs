import http from 'http';

const CONCURRENT_USERS = Number(process.env.LOAD_USERS || 5000);
const RAMP_UP_MS = Number(process.env.LOAD_RAMP_MS || 5000);
const HOLD_DURATION_MS = Number(process.env.LOAD_HOLD_MS || 15000);
const TOTAL_DURATION_MS = RAMP_UP_MS + HOLD_DURATION_MS;
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3050';

console.log(`\n======================================================`);
console.log(`🚀 RAMP-UP 5,000 CONCURRENT USERS LOAD TEST`);
console.log(`🎯 Target: ${BASE_URL}`);
console.log(`👥 Target Concurrent Users: ${CONCURRENT_USERS}`);
console.log(`📈 Ramp-up Time: ${RAMP_UP_MS / 1000}s`);
console.log(`⏱️  Peak Hold Time: ${HOLD_DURATION_MS / 1000}s`);
console.log(`======================================================\n`);

const agent = new http.Agent({
  keepAlive: true,
  maxSockets: 6000,
  maxFreeSockets: 2000,
  timeout: 15000
});

const stats = {
  totalRequests: 0,
  success: 0,
  failures: 0,
  rateLimited: 0,
  transportFailures: 0,
  statusCodes: {},
  latencies: [],
  profileReads: 0,
  linkClicks: 0,
  viewRecords: 0
};

const startTime = Date.now();
let isRunning = true;

function sendRequest(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const reqStart = Date.now();
    const url = new URL(path, BASE_URL);

    const headers = {
      'Connection': 'keep-alive'
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers,
      agent,
      timeout: 12000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const duration = Date.now() - reqStart;
        stats.totalRequests++;
        stats.latencies.push(duration);
        stats.statusCodes[res.statusCode] = (stats.statusCodes[res.statusCode] || 0) + 1;

        if (res.statusCode >= 200 && res.statusCode < 400) {
          stats.success++;
        } else {
          stats.failures++;
          if (res.statusCode === 429) stats.rateLimited++;
        }
        resolve(true);
      });
    });

    req.on('error', (err) => {
      stats.totalRequests++;
      stats.failures++;
      stats.transportFailures++;
      stats.statusCodes['ERR_' + err.code] = (stats.statusCodes['ERR_' + err.code] || 0) + 1;
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      stats.totalRequests++;
      stats.failures++;
      stats.statusCodes['TIMEOUT'] = (stats.statusCodes['TIMEOUT'] || 0) + 1;
      resolve(false);
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

// Simulated user behavior loop with think time
async function runVirtualUser(userId, startDelayMs) {
  await new Promise((r) => setTimeout(r, startDelayMs));

  while (isRunning) {
    const rand = Math.random();

    try {
      if (rand < 0.70) {
        // 70% Profile Read
        await sendRequest('/api/profiles/elenarostova');
        stats.profileReads++;
      } else if (rand < 0.90) {
        // 20% 302 Link Click Tracking
        await sendRequest('/r/blk_elena_1');
        stats.linkClicks++;
      } else {
        // 10% Profile View Logging
        const body = JSON.stringify({ profileId: 'prf_elena', referrer: 'https://instagram.com' });
        await sendRequest('/api/analytics/view', 'POST', body);
        stats.viewRecords++;
      }
    } catch (e) {
      // Handled in stats
    }

    // Realistic user dwell / think time between interactions (100ms - 300ms)
    await new Promise((r) => setTimeout(r, 100 + Math.floor(Math.random() * 200)));
  }
}

// Stagger 5,000 virtual users across RAMP_UP_MS
const userPromises = [];
for (let i = 0; i < CONCURRENT_USERS; i++) {
  const startDelay = (i / CONCURRENT_USERS) * RAMP_UP_MS;
  userPromises.push(runVirtualUser(i, startDelay));
}

setTimeout(() => {
  isRunning = false;
}, TOTAL_DURATION_MS);

const monitor = setInterval(() => {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const currentRps = (stats.totalRequests / (Date.now() - startTime) * 1000).toFixed(0);
  console.log(`⏱️  [${elapsed}s] Total Req: ${stats.totalRequests.toLocaleString()} | Success: ${stats.success.toLocaleString()} | Failures: ${stats.failures} | Current: ${currentRps} req/s`);
}, 3000);

await Promise.all(userPromises);
clearInterval(monitor);

const totalElapsedSec = (Date.now() - startTime) / 1000;
stats.latencies.sort((a, b) => a - b);

const p50 = stats.latencies[Math.floor(stats.latencies.length * 0.50)] || 0;
const p90 = stats.latencies[Math.floor(stats.latencies.length * 0.90)] || 0;
const p95 = stats.latencies[Math.floor(stats.latencies.length * 0.95)] || 0;
const p99 = stats.latencies[Math.floor(stats.latencies.length * 0.99)] || 0;
const avg = (stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length || 0).toFixed(1);
const rps = (stats.totalRequests / totalElapsedSec).toFixed(1);

console.log(`\n======================================================`);
console.log(`📊 5,000 CONCURRENT USERS STRESS TEST RESULTS (WITH RAMP-UP)`);
console.log(`======================================================`);
console.log(`Total Virtual Users:   ${CONCURRENT_USERS}`);
console.log(`Test Duration:         ${totalElapsedSec.toFixed(2)} seconds`);
console.log(`Total Requests Sent:   ${stats.totalRequests.toLocaleString()}`);
console.log(`Successful Requests:   ${stats.success.toLocaleString()} (${((stats.success / stats.totalRequests) * 100).toFixed(2)}%)`);
console.log(`Failed / Timed Out:    ${stats.failures.toLocaleString()} (${((stats.failures / stats.totalRequests) * 100).toFixed(2)}%)`);
console.log(`Rate limited (429):     ${stats.rateLimited.toLocaleString()}`);
console.log(`Transport failures:     ${stats.transportFailures.toLocaleString()}`);
console.log(`Average Throughput:    ${rps} req/sec`);
console.log(`\n--- Response Times (Latency) ---`);
console.log(`Average Latency:       ${avg} ms`);
console.log(`Median (P50):          ${p50} ms`);
console.log(`90th Percentile (P90): ${p90} ms`);
console.log(`95th Percentile (P95): ${p95} ms`);
console.log(`99th Percentile (P99): ${p99} ms`);
console.log(`\n--- HTTP Status Codes Breakdown ---`);
console.log(JSON.stringify(stats.statusCodes, null, 2));
console.log(`\n--- Operations Breakdown ---`);
console.log(`Profile Reads:         ${stats.profileReads.toLocaleString()}`);
console.log(`302 Link Clicks:       ${stats.linkClicks.toLocaleString()}`);
console.log(`View Records Inserted: ${stats.viewRecords.toLocaleString()}`);
console.log(`======================================================\n`);
