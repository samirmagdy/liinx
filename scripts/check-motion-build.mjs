import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const origin = process.env.MOTION_BUILD_URL || 'http://127.0.0.1:4188';
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 900 } });
  await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  const page = await context.newPage();
  // Vite preview serves these emitted files directly. Express routing is a separate check.
  for (const path of ['/', '/features.html', '/templates.html', '/pricing.html']) {
    await page.goto(origin + path);
    assert.ok(await page.locator('h1').isVisible(), `${path}: missing readable prerendered heading`);
    assert.equal(await page.locator('main').evaluate(node => Number(getComputedStyle(node).opacity)), 1);
  }
  await context.close();
  const touch = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 375, height: 900 } });
  await touch.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"Unauthorized"}' });
    return route.continue();
  });
  const mobile = await touch.newPage();
  const errors = [];
  mobile.on('pageerror', e => errors.push(e.message));
  await mobile.goto(origin);
  await mobile.locator('[data-hero-preview]').waitFor();
  await mobile.waitForTimeout(1600);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  await mobile.locator('button[aria-controls="mobile-navigation"]').tap();
  assert.ok(await mobile.locator('#mobile-navigation').isVisible());
  await mobile.locator('button[aria-controls="mobile-navigation"]').tap();
  const choice = mobile.locator('[data-hero="controls"] button[aria-pressed]').nth(1);
  await choice.tap();
  assert.equal(await choice.getAttribute('aria-pressed'), 'true');
  await mobile.emulateMedia({ reducedMotion: 'reduce' });
  await mobile.waitForTimeout(150);
  assert.equal(await mobile.locator('[data-hero="visual"]').evaluate(node => Number(getComputedStyle(node).opacity)), 1);
  assert.deepEqual(errors, []);
  console.log('PASS: four production prerendered routes without JS; touch menu/preview selection, overflow, runtime errors and reduced-motion switch');
} finally {
  await browser.close();
}
