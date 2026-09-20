/**
 * Production Startup Safeguards for Single-Node Architecture
 *
 * RALOA is currently architected as a single-node application:
 * - SQLite writes require single-process WAL locking.
 * - Uploads are written directly to the local filesystem.
 * - Rate limiting, analytics buffering, and memory caches are process-local.
 * - Background schedulers run in-process without distributed leader election.
 *
 * These safeguards fail closed at startup if multi-instance or clustered execution
 * is detected in production before shared infrastructure (PostgreSQL, S3, Redis)
 * is provisioned.
 */

export const supportsHorizontalScaling = false;

export interface MultiNodeDetectionResult {
  isMultiNode: boolean;
  reasons: string[];
}

export function detectMultiNodeAttempt(): MultiNodeDetectionResult {
  const reasons: string[] = [];

  if (process.env.CLUSTER === 'true') {
    reasons.push("Node.js cluster mode requested ('CLUSTER=true')");
  }

  if (process.env.HORIZONTAL_SCALING_ENABLED === 'true') {
    reasons.push("Horizontal scaling explicitly enabled ('HORIZONTAL_SCALING_ENABLED=true')");
  }

  const instanceCount = Number(process.env.INSTANCE_COUNT || 1);
  if (!Number.isNaN(instanceCount) && instanceCount > 1) {
    reasons.push(`Multiple instances configured ('INSTANCE_COUNT=${instanceCount}')`);
  }

  const replicas = Number(process.env.REPLICAS || 1);
  if (!Number.isNaN(replicas) && replicas > 1) {
    reasons.push(`Multiple replicas configured ('REPLICAS=${replicas}')`);
  }

  // PM2 cluster mode passes NODE_APP_INSTANCE=0, 1, 2...
  if (typeof process.env.NODE_APP_INSTANCE === 'string') {
    const pm2Instance = Number(process.env.NODE_APP_INSTANCE);
    if (!Number.isNaN(pm2Instance) && pm2Instance > 0) {
      reasons.push(`PM2 cluster secondary worker detected ('NODE_APP_INSTANCE=${pm2Instance}')`);
    }
  }

  return {
    isMultiNode: reasons.length > 0,
    reasons
  };
}

export function enforceSingleNodeSafeguards(forceCheckInNonProduction = false): void {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd && !forceCheckInNonProduction) return;

  const detection = detectMultiNodeAttempt();
  if (detection.isMultiNode) {
    const details = detection.reasons.join('; ');
    throw new Error(
      `Production horizontal scaling is disabled until a shared database, object storage, distributed rate limiter, and job scheduler are configured. Detected: ${details}`
    );
  }
}
