import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';

// Frontend-only checks. No account creation, provider calls, or database writes.
const origin = process.env.MOTION_TEST_URL || 'http://127.0.0.1:4187';
const engine = process.env.MOTION_TEST_BROWSER || 'chromium';
const browser = await ({ chromium, firefox, webkit }[engine]).launch({ channel: process.env.MOTION_TEST_CHANNEL || undefined });
const evidence = await mkdtemp(join(tmpdir(), 'liinx-motion-'));
let cases = 0;
try {
  for (const language of ['en', 'ar']) {
    for (const reducedMotion of ['no-preference', 'reduce']) {
      const context = await browser.newContext({ reducedMotion });
      await context.addInitScript(lang => localStorage.setItem('liinx_lang', lang), language);
      // Isolated anonymous-session fixture; do not contact the real API or providers.
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.origin !== origin) return route.abort();
        if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"Unauthorized"}' });
        return route.continue();
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => { errors.push(error.message); console.error(engine, language, reducedMotion, error.message); });
      for (const width of [320, 375, 430, 768, 1024, 1280, 1440, 1920]) {
        console.log(`${engine} ${language} ${reducedMotion} ${width}`);
        await page.setViewportSize({ width, height: 900 });
        await page.goto(origin);
        await page.locator('[data-hero-preview]').waitFor();
        await page.waitForTimeout(1600);
        await page.locator('h1').waitFor({ state: 'visible' });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `overflow ${language}/${reducedMotion}/${width}`);
        assert.equal(await page.locator('h1').count(), 1);
        for (const section of ['#features', '#templates', '#pricing']) {
          await page.locator(section).scrollIntoViewIfNeeded();
          await page.waitForFunction(selector => [...document.querySelectorAll(selector)].every(node => Number(getComputedStyle(node).opacity) === 1), `${section} .motion-card`, { timeout: 8000 });
          assert.equal(await page.locator(`${section} .motion-card`).evaluateAll(nodes => nodes.every(node => Number(getComputedStyle(node).opacity) === 1)), true, `hidden cards ${section}`);
        }
        await page.locator('#faq-question-1').focus();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(450);
        assert.equal(await page.locator('#faq-answer-1').isVisible(), true);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(450);
        assert.equal(await page.locator('#faq-answer-1').isVisible(), false);
        if (width < 1280) {
          const toggle = page.locator('button[aria-controls="mobile-navigation"]');
          await toggle.click();
          await page.locator('#mobile-navigation').waitFor();
          await toggle.click();
          await page.locator('#mobile-navigation').waitFor({ state: 'detached' });
          assert.equal(await page.locator('#mobile-navigation').count(), 0);
        }
        assert.deepEqual(errors, [], 'browser runtime errors');
        cases++;
      }
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(origin);
      await page.locator('[data-hero-preview]').waitFor();
      await page.waitForTimeout(1600);
      await page.screenshot({ path: join(evidence, `${language}-${reducedMotion}.png`) });
      // Dev-module inspection verifies cleanup of this engine, not implementation strings.
      const count = () => page.evaluate(async () => (await import('/src/animations/gsap.ts')).ScrollTrigger.getAll().length);
      const before = await count();
      if (reducedMotion === 'reduce') assert.equal(before, 0);
      await page.locator('#hero-claim-input').fill('motionfixture');
      await page.locator('#hero-claim-input').press('Enter');
      await page.waitForURL('**/register?username=motionfixture');
      assert.equal(await count(), 0, 'route leaked ScrollTriggers');
      await page.goBack();
      await page.locator('[data-hero-preview]').waitFor();
      await page.waitForTimeout(1600);
      assert.ok(await count() <= before, 'duplicate triggers after route return');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForTimeout(150);
      assert.equal(await count(), 0, 'preference change left triggers active');
      assert.equal(await page.locator('[data-hero="visual"]').evaluate(node => Number(getComputedStyle(node).opacity)), 1);
      await context.close();
    }
  }
  console.log(JSON.stringify({ engine, cases, evidence, result: 'PASS', coverage: 'widths, Arabic/English, normal/reduced motion, keyboard FAQ, menu, overflow, route cleanup, live preference changes' }));
} finally {
  await browser.close();
}
