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
import { formsRouter } from './routes/forms.js';
import { pagesRouter } from './routes/pages.js';
import { instagramRouter } from './routes/instagram.js';
import { importerRouter } from './routes/importer.js';
import { apiV1Router } from './routes/apiV1.js';
import { billingRouter } from './routes/billing.js';
import { contactRouter } from './routes/contact.js';
import { pageTitles } from '../src/config/pages.js';
import * as Sentry from '@sentry/node';
import { log, logError } from './logger.js';
import { startMaintenanceScheduler } from './maintenance.js';
import { createId } from './utils/ids.js';
import { startInstagramSyncScheduler } from './instagramScheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    sendDefaultPii: false,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.05)
  });
}
const PORT = Number(process.env.PORT) || 3050;

function validateProductionConfig() {
  if (process.env.NODE_ENV !== 'production') return;

  for (const variable of ['APP_ORIGIN', 'CORS_ORIGIN', 'INTEGRATION_ENCRYPTION_KEY']) {
    const value = process.env[variable];
    if (!value || value.includes('replace_with_') || value.includes('your_') || value.includes('YOUR_') || value.includes('REPLACE_WITH_')) {
      throw new Error(`Production requires a real ${variable} value.`);
    }
  }

  let appOrigin: URL;
  try {
    appOrigin = new URL(process.env.APP_ORIGIN!);
  } catch {
    throw new Error('Production APP_ORIGIN must be a valid absolute URL.');
  }
  if (appOrigin.protocol !== 'https:') throw new Error('Production APP_ORIGIN must use HTTPS.');

  const origins = process.env.CORS_ORIGIN!.split(',').map(origin => origin.trim()).filter(Boolean);
  if (origins.length === 0 || origins.some(origin => origin === '*' || !origin.startsWith('https://'))) {
    throw new Error('Production CORS_ORIGIN must contain explicit HTTPS origins only.');
  }

  const encryptionKey = process.env.INTEGRATION_ENCRYPTION_KEY!;
  const decodedKey = Buffer.from(encryptionKey, /^[0-9a-f]{64}$/i.test(encryptionKey) ? 'hex' : 'base64');
  if (decodedKey.length !== 32) throw new Error('Production INTEGRATION_ENCRYPTION_KEY must decode to exactly 32 bytes.');

  if (process.env.BILLING_ENABLED !== 'false') {
    for (const variable of ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']) {
      const value = process.env[variable];
      if (!value || value.includes('replace_me') || value.includes('REPLACE_WITH_')) {
        throw new Error(`Production billing requires a real ${variable} value, or set BILLING_ENABLED=false.`);
      }
    }
  }

  if (process.env.CLUSTER === 'true' || process.env.HORIZONTAL_SCALING_ENABLED === 'true') {
    throw new Error('Production horizontal scaling is disabled until a shared rate-limit, analytics queue, and event store are configured.');
  }
}

validateProductionConfig();

// Initialize SQLite database & seed demo data
initDatabase();

const configuredOrigins = (process.env.CORS_ORIGIN || process.env.APP_ORIGIN || 'http://localhost:3050')
  .split(',').map(origin => origin.trim()).filter(Boolean);
if (process.env.NODE_ENV === 'production' && configuredOrigins.includes('*')) {
  throw new Error('Production CORS_ORIGIN must list explicit trusted origins; wildcard CORS is not allowed.');
}
app.set('trust proxy', 1);
app.use(cors({
  origin: (origin, callback) => {
    const isLocalDevelopmentOrigin = process.env.NODE_ENV !== 'production'
      && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(origin || '');
    if (!origin || configuredOrigins.includes('*') || configuredOrigins.includes(origin) || isLocalDevelopmentOrigin) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
}));

// Correlation ID & Response Time Observability Middleware
app.use((req, res, next) => {
  const startHrTime = process.hrtime();
  const requestId = (req.headers['x-request-id'] as string) || createId('req');
  res.setHeader('X-Request-Id', requestId);

  const originalEnd = res.end;
  res.end = function(this: express.Response, ...args: any[]): any {
    if (!res.headersSent) {
      const elapsedHrTime = process.hrtime(startHrTime);
      const elapsedMs = (elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6).toFixed(2);
      res.setHeader('X-Response-Time', `${elapsedMs}ms`);
    }
    log(res.statusCode >= 500 ? 'error' : 'info', 'HTTP request completed', {
      requestId, method: req.method, path: req.path, status: res.statusCode,
      durationMs: Number(((process.hrtime(startHrTime)[0] * 1000 + process.hrtime(startHrTime)[1] / 1e6)).toFixed(2))
    });
    return originalEnd.apply(this, args as any);
  };

  next();
});

// Security Headers Middleware (OWASP / Production Hardening)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Content-Security-Policy', "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; img-src 'self' data: https:; media-src 'self' https:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net; connect-src 'self' https://www.google-analytics.com https://graph.instagram.com https://api.instagram.com; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://open.spotify.com https://player.vimeo.com https://w.soundcloud.com https://calendly.com https://embed.music.apple.com;");
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});

app.use(express.json({
  limit: '2mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

// Search Engine robots.txt
app.get('/robots.txt', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(`User-agent: *
Allow: /
Allow: /features
Allow: /templates
Allow: /pricing
Allow: /about
Allow: /contact
Allow: /privacy
Allow: /terms
Allow: /@*
Disallow: /studio
Disallow: /dashboard
Disallow: /api/
Disallow: /uploads/

Sitemap: https://liinx.app/sitemap.xml
`);
});

// Search Engine dynamic sitemap.xml
app.get('/sitemap.xml', (_req, res) => {
  try {
    // Sitemap protocol supports up to 50,000 URLs per file. Include all public
    // profiles instead of silently dropping older creators at an arbitrary 500.
    const profiles = db.prepare('SELECT username, updated_at FROM profiles WHERE username IS NOT NULL ORDER BY updated_at DESC LIMIT 50000').all() as { username: string; updated_at: number }[];
    const baseUrl = 'https://liinx.app';
    const nowIso = new Date().toISOString().split('T')[0];

    const staticRoutes = [
      { path: '', changefreq: 'daily', priority: '1.0' },
      { path: '/features', changefreq: 'weekly', priority: '0.9' },
      { path: '/templates', changefreq: 'weekly', priority: '0.9' },
      { path: '/pricing', changefreq: 'weekly', priority: '0.8' },
      { path: '/about', changefreq: 'monthly', priority: '0.7' },
      { path: '/contact', changefreq: 'monthly', priority: '0.6' },
      { path: '/privacy', changefreq: 'monthly', priority: '0.3' },
      { path: '/terms', changefreq: 'monthly', priority: '0.3' },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const route of staticRoutes) {
      xml += `  <url>\n    <loc>${baseUrl}${route.path}</loc>\n    <lastmod>${nowIso}</lastmod>\n    <changefreq>${route.changefreq}</changefreq>\n    <priority>${route.priority}</priority>\n  </url>\n`;
    }

    for (const p of profiles) {
      const pDate = p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : nowIso;
      xml += `  <url>\n    <loc>${baseUrl}/@${encodeURIComponent(p.username)}</loc>\n    <lastmod>${pDate}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    }

    xml += `</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.send(xml);
  } catch (err: any) {
    console.error('Sitemap error:', err);
    res.status(500).send('Failed to generate sitemap.');
  }
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>'\"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] || character));
}

// JSON is placed inside an HTML script element. Escaping the HTML-significant
// characters prevents user content such as `</script>` from breaking out of it.
export function safeJsonForHtml(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function sendProfileShell(res: express.Response, filePath: string, profile: { username: string; display_name: string; bio?: string | null; avatar_url?: string | null; share_title?: string | null; share_description?: string | null; share_image_url?: string | null }, canonical: string) {
  let html = fs.readFileSync(filePath, 'utf8');
  const title = profile.share_title || `${profile.display_name} (@${profile.username}) | LIINX`;
  const description = profile.share_description || profile.bio || `Explore ${profile.display_name}'s links, media and updates on Liinx.`;
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/i, `<meta name="description" content="${safeDescription}" />`)
    .replace(/<meta name="robots" content="[^"]*"\s*\/>/i, '<meta name="robots" content="index, follow" />')
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/i, `<link rel="canonical" href="${escapeHtml(canonical)}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/i, `<meta property="og:url" content="${escapeHtml(canonical)}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/i, `<meta property="og:title" content="${safeTitle}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/i, `<meta property="og:description" content="${safeDescription}" />`)
    .replace(/<meta property="og:image" content="[^"]*"\s*\/>/i, `<meta property="og:image" content="${escapeHtml(profile.share_image_url || profile.avatar_url || '')}" />`)
    .replace('</head>', `<script type="application/ld+json">${safeJsonForHtml({ '@context': 'https://schema.org', '@type': 'ProfilePage', url: canonical, name: title, description, image: profile.share_image_url || profile.avatar_url || undefined, mainEntity: { '@type': 'Person', name: profile.display_name, url: canonical, image: profile.avatar_url || undefined } })}</script></head>`);
  res.type('html').send(html);
}

// Custom Domain Host-Header Routing Engine (Milestone 6)
app.use((req, res, next) => {
  const host = (req.headers.host || '').split(':')[0].toLowerCase().trim();
  const defaultHosts = ['localhost', '127.0.0.1', '0.0.0.0', 'liinx.vercel.app', 'liinx.app'];

  if (host && !defaultHosts.includes(host) && !host.endsWith('.liinx.app')) {
    const profile = db.prepare('SELECT username FROM profiles WHERE lower(custom_domain) = ? AND custom_domain_verified = 1').get(host) as { username: string } | undefined;
    if (profile) {
      res.setHeader('X-Custom-Domain-User', profile.username);
      if (req.path === '/' || req.path === '') {
        const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');
        const shellFile = path.resolve(__dirname, '../dist/shell.html');
        const indexFile = path.resolve(__dirname, '../dist/index.html');
        const distIndex = fs.existsSync(shellFile) ? shellFile : indexFile;
        if (acceptsHtml && fs.existsSync(distIndex)) {
          const customProfile = db.prepare('SELECT username, display_name, bio, avatar_url, share_title, share_description, share_image_url FROM profiles WHERE username = ?').get(profile.username) as any;
          return customProfile ? sendProfileShell(res, distIndex, customProfile, `https://${host}/`) : res.sendFile(distIndex);
        }
        req.url = `/api/profiles/${encodeURIComponent(profile.username)}`;
      }
    }
  }
  next();
});

// Serve uploaded media with caching
const uploadsDir = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, '../public/uploads'));
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir, { maxAge: '30d' }));

// Link Redirector (e.g. /r/:blockId) and analytics routes
app.use(analyticsRouter);

// API Routes
app.use('/api/auth', authRouter);
app.use('/api', profilesRouter);
app.use('/api', pagesRouter);
app.use('/api', blocksRouter);
app.use(newsletterRouter);
app.use(uploadRouter);
app.use(formsRouter);
app.use('/api', instagramRouter);
app.use('/api', importerRouter);
app.use('/api', apiV1Router);
app.use('/api', billingRouter);
app.use('/api', contactRouter);

if (process.env.SENTRY_DSN) Sentry.setupExpressErrorHandler(app);

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
      error: process.env.NODE_ENV === 'production' ? 'Database unavailable' : err.message
    });
  }
});

// Centralized error handler middleware
app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found.' }));
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      error: 'Payload exceeds maximum allowed limit of 2MB'
    });
  }
  logError('Unhandled server error', err, { status: err.status || 500 });
  if (process.env.SENTRY_DSN) Sentry.captureException(err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (err.message || 'Internal server error')
  });
});

export async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode: Vite middleware mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      // Keep the embedded Vite HMR socket away from other local projects that
      // commonly claim Vite's default port.
      server: { middlewareMode: true, hmr: { port: Number(process.env.VITE_HMR_PORT) || 24679 } },
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
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
      const profileMatch = req.path.match(/^\/@([a-z0-9_]+)(?:\/([a-z0-9-]+))?$/i);
      if (profileMatch) {
        const publicProfile = db.prepare('SELECT username, display_name, bio, avatar_url, share_title, share_description, share_image_url FROM profiles WHERE lower(username) = ?').get(profileMatch[1].toLowerCase()) as any;
        const profileShell = path.join(distDir, 'shell.html');
        if (publicProfile && fs.existsSync(profileShell)) {
          const page = db.prepare('SELECT title, description FROM pages WHERE profile_id = (SELECT id FROM profiles WHERE lower(username) = ?) AND slug = ? AND published = 1').get(profileMatch[1].toLowerCase(), profileMatch[2] || 'home') as { title?: string; description?: string } | undefined;
          if (page && !publicProfile.share_title) publicProfile.share_title = page.title;
          if (page && !publicProfile.share_description) publicProfile.share_description = page.description || publicProfile.bio;
          const canonical = `https://${process.env.PUBLIC_DOMAIN || 'liinx.app'}/@${encodeURIComponent(publicProfile.username)}${profileMatch[2] ? `/${encodeURIComponent(profileMatch[2])}` : ''}`;
          return sendProfileShell(res, profileShell, publicProfile, canonical);
        }
      }
      const routeFile = req.path === '/' ? path.join(distDir, 'index.html') : pageTitles[req.path] ? path.join(distDir, `${req.path.slice(1)}.html`) : '';
      if (['/studio', '/login', '/register'].includes(req.path)) res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      const fallbackFile = fs.existsSync(path.join(distDir, 'shell.html'))
        ? path.join(distDir, 'shell.html')
        : path.join(distDir, 'index.html');
      res.sendFile(routeFile && fs.existsSync(routeFile) ? routeFile : fallbackFile);
  });
}

startMaintenanceScheduler();
startInstagramSyncScheduler();

  const server = app.listen(PORT, '0.0.0.0', 4096, () => {
    log('info', 'Server started', { environment: isProd ? 'production' : 'development', port: PORT });
  });

  // Keep-alive tuning for reverse proxies (Cloudflare, AWS ALB, Nginx)
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  return server;
}

// Cluster Mode or direct execution
if (process.env.NODE_ENV !== 'test') {
  process.on('uncaughtException', error => {
    logError('Uncaught exception', error);
    if (process.env.SENTRY_DSN) Sentry.captureException(error);
    process.exit(1);
  });
  process.on('unhandledRejection', reason => {
    logError('Unhandled promise rejection', reason);
    if (process.env.SENTRY_DSN) Sentry.captureException(reason);
  });
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
