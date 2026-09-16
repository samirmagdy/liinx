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
import { brand } from '../src/config/brand.js';
import * as Sentry from '@sentry/node';
import { log, logError } from './logger.js';
import { startMaintenanceScheduler } from './maintenance.js';
import { createId } from './utils/ids.js';
import { startInstagramSyncScheduler } from './instagramScheduler.js';
import { detectDocument, detectImageMagicBytes } from './routes/upload.js';
import { isHttpUrl } from './utils/urlValidation.js';
import { hasEntitlement } from './entitlements.js';

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
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  const isLocalDevelopmentOrigin = process.env.NODE_ENV !== 'production'
    && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(origin || '');
  if (isMutation && origin && !configuredOrigins.includes('*') && !configuredOrigins.includes(origin) && !isLocalDevelopmentOrigin) {
    return res.status(403).json({ error: 'Request origin is not allowed.' });
  }
  next();
});
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
  res.setHeader('Content-Security-Policy', "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; img-src 'self' data: https:; media-src 'self' https:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net; connect-src 'self' https://api.qrserver.com https://www.google-analytics.com https://graph.instagram.com https://api.instagram.com; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://open.spotify.com https://player.vimeo.com https://w.soundcloud.com https://calendly.com https://embed.music.apple.com;");
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
  const origin = publicOrigin(_req);
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

Sitemap: ${origin}/sitemap.xml
`);
});

// Search Engine dynamic sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  try {
    // Sitemap protocol supports up to 50,000 URLs per file. Include all public
    // profiles instead of silently dropping older creators at an arbitrary 500.
    const pages = db.prepare(`
      SELECT profiles.username, pages.slug, pages.is_home as isHome, pages.updated_at as updatedAt
      FROM profiles INNER JOIN pages ON pages.profile_id = profiles.id
      WHERE profiles.username IS NOT NULL AND pages.published = 1
      ORDER BY pages.updated_at DESC, pages.created_at ASC
      LIMIT 50000
    `).all() as { username: string; slug: string; isHome: number; updatedAt: number }[];
    const baseUrl = publicOrigin(req);
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

    for (const page of pages) {
      const pDate = page.updatedAt ? new Date(page.updatedAt).toISOString().split('T')[0] : nowIso;
      const path = `/@${encodeURIComponent(page.username)}${page.isHome ? '' : `/${encodeURIComponent(page.slug)}`}`;
      xml += `  <url>\n    <loc>${escapeXml(`${baseUrl}${path}`)}</loc>\n    <lastmod>${pDate}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
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

function escapeXml(value: string): string {
  return escapeHtml(value);
}

function publicOrigin(req: express.Request): string {
  const configured = process.env.PUBLIC_ORIGIN || process.env.APP_ORIGIN;
  if (configured) {
    try { return new URL(configured).origin; } catch { /* fall through to the deployment host */ }
  }
  if (process.env.PUBLIC_DOMAIN) {
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : req.protocol;
    return `${protocol}://${process.env.PUBLIC_DOMAIN}`.replace(/\/$/, '');
  }
  if (process.env.NODE_ENV === 'production') return `https://${brand.domain}`;
  return `${req.protocol}://${req.get('host')}`;
}

function safeRedirectTarget(raw: unknown, req: express.Request, username: string, customDomain: boolean): string | null {
  if (!isHttpUrl(raw) || typeof username !== 'string') return null;
  const target = new URL(raw as string);
  const requestHost = (req.headers.host || '').split(':')[0].toLowerCase();
  if (customDomain && target.hostname.toLowerCase() === requestHost) return null;
  const platformHost = new URL(publicOrigin(req)).hostname.toLowerCase();
  const targetPath = target.pathname.toLowerCase();
  const ownPlatformPath = `/@${username.toLowerCase()}`;
  if (!customDomain && [platformHost, requestHost].includes(target.hostname.toLowerCase()) && (targetPath === ownPlatformPath || targetPath.startsWith(`${ownPlatformPath}/`))) return null;
  return target.toString();
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

export function renderProfileShellHtml(sourceHtml: string, profile: { username: string; display_name: string; bio?: string | null; avatar_url?: string | null; share_title?: string | null; share_description?: string | null; share_image_url?: string | null }, canonical: string, page?: { title?: string | null; description?: string | null }): string {
  let html = sourceHtml;
  const title = page?.title || profile.share_title || `${profile.display_name} (@${profile.username}) | LIINX`;
  const description = page?.description || profile.share_description || profile.bio || `Explore ${profile.display_name}'s links, media and updates on Liinx.`;
  const image = profile.share_image_url || profile.avatar_url || '';
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/i, `<meta name="description" content="${safeDescription}" />`)
    .replace(/<meta name="robots" content="[^"]*"\s*\/>/i, '<meta name="robots" content="index, follow" />')
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/i, `<link rel="canonical" href="${escapeHtml(canonical)}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/i, `<meta property="og:url" content="${escapeHtml(canonical)}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/i, `<meta property="og:title" content="${safeTitle}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/i, `<meta property="og:description" content="${safeDescription}" />`)
    .replace(/<meta property="og:image" content="[^"]*"\s*\/>/i, image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : '')
    .replace(/<meta property="og:image:secure_url" content="[^"]*"\s*\/>/i, image ? `<meta property="og:image:secure_url" content="${escapeHtml(image)}" />` : '')
    .replace(/<meta property="og:image:alt" content="[^"]*"\s*\/>/i, image ? `<meta property="og:image:alt" content="${escapeHtml(profile.display_name)}" />` : '')
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/i, `<meta name="twitter:title" content="${safeTitle}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/i, `<meta name="twitter:description" content="${safeDescription}" />`)
    .replace(/<meta name="twitter:image" content="[^"]*"\s*\/>/i, image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, `<script type="application/ld+json">${safeJsonForHtml({ '@context': 'https://schema.org', '@type': 'ProfilePage', url: canonical, name: title, description, ...(image ? { image } : {}), mainEntity: { '@type': 'Person', name: profile.display_name, url: canonical, ...(profile.avatar_url ? { image: profile.avatar_url } : {}) } })}</script>`);
  return html;
}

function sendProfileShell(res: express.Response, filePath: string, profile: { username: string; display_name: string; bio?: string | null; avatar_url?: string | null; share_title?: string | null; share_description?: string | null; share_image_url?: string | null }, canonical: string, page?: { title?: string | null; description?: string | null }) {
  const html = renderProfileShellHtml(fs.readFileSync(filePath, 'utf8'), profile, canonical, page);
  res.type('html').send(html);
}

// Custom Domain Host-Header Routing Engine (Milestone 6)
app.use((req, res, next) => {
  const host = (req.headers.host || '').split(':')[0].toLowerCase().trim();
  const defaultHosts = ['localhost', '127.0.0.1', '0.0.0.0', 'liinx.vercel.app', 'liinx.app'];

  if (host && !defaultHosts.includes(host) && !host.endsWith('.liinx.app')) {
    const profile = db.prepare('SELECT username, plan FROM profiles WHERE lower(custom_domain) = ? AND custom_domain_verified = 1').get(host) as { username: string; plan: string } | undefined;
    if (profile && !hasEntitlement(profile.plan, 'customDomain')) return res.status(404).send('This custom domain is not available.');
    if (profile) {
      res.setHeader('X-Custom-Domain-User', profile.username);
      const customPageMatch = req.path.match(/^\/([a-z0-9-]+)$/i);
      if (req.path === '/' || req.path === '' || customPageMatch) {
        const pageSlug = customPageMatch?.[1];
        const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');
        const shellFile = path.resolve(__dirname, '../dist/shell.html');
        const indexFile = path.resolve(__dirname, '../dist/index.html');
        const distIndex = fs.existsSync(shellFile) ? shellFile : indexFile;
        if (acceptsHtml && fs.existsSync(distIndex)) {
          const customProfile = db.prepare('SELECT username, display_name, bio, avatar_url, share_title, share_description, share_image_url, page_redirect_url, page_redirect_until FROM profiles WHERE username = ?').get(profile.username) as any;
          const page = pageSlug ? db.prepare('SELECT title, description FROM pages WHERE profile_id = (SELECT id FROM profiles WHERE username = ?) AND slug = ? AND published = 1').get(profile.username, pageSlug) as { title?: string; description?: string } | undefined : undefined;
          if (pageSlug && !page) return res.status(404).send('This page is not available.');
          const redirect = safeRedirectTarget(customProfile?.page_redirect_url, req, customProfile?.username, true);
          if (redirect && (!customProfile.page_redirect_until || customProfile.page_redirect_until > Date.now())) {
            res.setHeader('Cache-Control', 'no-store');
            return res.redirect(302, redirect);
          }
          return customProfile ? sendProfileShell(res, distIndex, customProfile, `https://${host}${pageSlug ? `/${encodeURIComponent(pageSlug)}` : '/'}`, page) : res.sendFile(distIndex);
        }
        req.url = `/api/profiles/${encodeURIComponent(profile.username)}${pageSlug ? `?page=${encodeURIComponent(pageSlug)}` : ''}`;
        // Express may have cached req.query while evaluating req.path above;
        // keep the rewritten tenant/page selection authoritative for the
        // downstream profile route.
        if (pageSlug) req.query.page = pageSlug;
      }
    }
  }
  next();
});

// Serve only content that can be classified from its bytes. In particular,
// never let a legacy or manually placed .html/.svg file execute on the app
// origin just because it lives below the uploads directory.
const uploadsDir = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, '../public/uploads'));
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  if (!filename || filename !== path.basename(filename) || filename.includes('\\') || filename.length > 255) {
    return res.status(404).end();
  }

  const targetPath = path.resolve(uploadsDir, filename);
  if (!targetPath.startsWith(`${uploadsDir}${path.sep}`)) return res.status(404).end();

  let stat: fs.Stats;
  let probe: Buffer;
  try {
    stat = fs.statSync(targetPath);
    if (!stat.isFile() || stat.size > 25 * 1024 * 1024) return res.status(404).end();
    const probeLength = Math.min(stat.size, 64 * 1024);
    probe = Buffer.alloc(probeLength);
    const fd = fs.openSync(targetPath, 'r');
    try { fs.readSync(fd, probe, 0, probeLength, 0); } finally { fs.closeSync(fd); }
  } catch {
    return res.status(404).end();
  }

  const extension = path.extname(filename).toLowerCase();
  const image = detectImageMagicBytes(probe);
  const document = detectDocument(probe);
  const isMatchingImage = Boolean(image && (extension === image.ext || (extension === '.jpeg' && image.ext === '.jpg')));
  const detected = isMatchingImage ? image : document;
  if (!detected) return res.status(404).end();

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Content-Type', detected.mime);
  if (!isMatchingImage) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
  } else {
    res.setHeader('Content-Disposition', 'inline');
  }
  res.setHeader('Content-Length', stat.size);
  return res.sendFile(targetPath);
});

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
        const publicProfile = db.prepare('SELECT username, display_name, bio, avatar_url, share_title, share_description, share_image_url, page_redirect_url, page_redirect_until FROM profiles WHERE lower(username) = ?').get(profileMatch[1].toLowerCase()) as any;
          const profileShell = path.join(distDir, 'shell.html');
        if (!publicProfile) return res.status(404).send('This profile is not available.');
        if (fs.existsSync(profileShell)) {
          const page = db.prepare('SELECT title, description FROM pages WHERE profile_id = (SELECT id FROM profiles WHERE lower(username) = ?) AND slug = ? AND published = 1').get(profileMatch[1].toLowerCase(), profileMatch[2] || 'home') as { title?: string; description?: string } | undefined;
          if (!page) return res.status(404).send('This page is not available.');
          const redirect = safeRedirectTarget(publicProfile.page_redirect_url, req, publicProfile.username, false);
          if (redirect && (!publicProfile.page_redirect_until || publicProfile.page_redirect_until > Date.now())) {
            res.setHeader('Cache-Control', 'no-store');
            return res.redirect(302, redirect);
          }
          const canonical = `${publicOrigin(req)}/@${encodeURIComponent(publicProfile.username)}${profileMatch[2] ? `/${encodeURIComponent(profileMatch[2])}` : ''}`;
          return sendProfileShell(res, profileShell, publicProfile, canonical, page);
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
