import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db, initDatabase } from './db.js';
import { authRouter } from './routes/auth.js';
import { profilesRouter } from './routes/profiles.js';
import { blocksRouter } from './routes/blocks.js';
import { analyticsRouter } from './routes/analytics.js';
import { newsletterRouter } from './routes/newsletter.js';
import { uploadRouter } from './routes/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3050;

// Initialize SQLite database & seed demo data
initDatabase();

app.use(cors());

// Correlation ID & Response Time Observability Middleware
app.use((req, res, next) => {
  const startHrTime = process.hrtime();
  const requestId = (req.headers['x-request-id'] as string) || `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  res.setHeader('X-Request-Id', requestId);

  const originalEnd = res.end;
  res.end = function(this: express.Response, ...args: any[]): any {
    if (!res.headersSent) {
      const elapsedHrTime = process.hrtime(startHrTime);
      const elapsedMs = (elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6).toFixed(2);
      res.setHeader('X-Response-Time', `${elapsedMs}ms`);
    }
    return originalEnd.apply(this, args as any);
  };

  next();
});

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded media with caching
const uploadsDir = path.resolve(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir, { maxAge: '30d' }));

// Link Redirector (e.g. /r/:blockId) and analytics routes
app.use(analyticsRouter);

// API Routes
app.use('/api/auth', authRouter);
app.use('/api', profilesRouter);
app.use('/api', blocksRouter);
app.use(newsletterRouter);
app.use(uploadRouter);

// Comprehensive Health & Diagnostics Endpoint
app.get('/api/health', (_req, res) => {
  try {
    // Quick DB liveness check
    db.prepare('SELECT 1').get();

    const mem = process.memoryUsage();
    res.json({
      status: 'ok',
      service: 'liinx-api',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        driver: 'better-sqlite3',
        journalMode: 'wal'
      },
      memory: {
        rssMb: Number((mem.rss / 1024 / 1024).toFixed(2)),
        heapUsedMb: Number((mem.heapUsed / 1024 / 1024).toFixed(2)),
        heapTotalMb: Number((mem.heapTotal / 1024 / 1024).toFixed(2))
      }
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'liinx-api',
      error: err.message
    });
  }
});

// Centralized error handler middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      error: 'Payload exceeds maximum allowed limit of 2MB'
    });
  }
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

export async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode: Vite middleware mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve pre-built static assets from dist with caching
    const distDir = path.resolve(__dirname, '../dist');
    app.use(express.static(distDir, {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        if (filePath.includes('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', 4096, () => {
    console.log(`[LIINX] Server running in ${isProd ? 'production' : 'development'} mode on http://localhost:${PORT}`);
  });

  // Keep-alive tuning for reverse proxies (Cloudflare, AWS ALB, Nginx)
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  return server;
}

// Cluster Mode or direct execution
if (process.env.NODE_ENV !== 'test') {
  if (process.env.CLUSTER === 'true') {
    const { default: cluster } = await import('node:cluster');
    const { default: os } = await import('node:os');
    const numCPUs = os.availableParallelism ? os.availableParallelism() : os.cpus().length;

    if (cluster.isPrimary) {
      console.log(`[LIINX Cluster] Primary ${process.pid} is running. Forking ${numCPUs} worker processes...`);
      for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
      }
      cluster.on('exit', (worker) => {
        console.log(`[LIINX Cluster] Worker ${worker.process.pid} exited. Forking replacement...`);
        cluster.fork();
      });
    } else {
      startServer();
    }
  } else {
    startServer();
  }
}

export { app };
