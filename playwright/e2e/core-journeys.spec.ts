import { expect, test, type Page } from 'playwright/test';
import { brand } from '../../shared/config/brand';

function uniqueName(prefix = 'pw') {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.slice(0, 25);
}

async function completeRegistration(page: Page, values: { username: string; email: string; password: string }) {
  await page.goto('/');
  await page.locator('#hero-claim-btn').click();
  await page.getByLabel('Choose your handle').fill(values.username);
  await page.getByLabel('Email address').fill(values.email);
  await page.getByLabel('Choose password').fill(values.password);
  await page.getByRole('button', { name: 'Continue to Step 2' }).click();
  await expect(page.getByText('What are you building?')).toBeVisible();
  await page.getByRole('button', { name: /Photographer \/ Visual Artist/ }).click();
  await page.getByRole('button', { name: 'Create my site' }).click();
  await expect(page).toHaveURL(/\/studio(?:\?|$)/);
}

test.describe('contextual upgrades', () => {
  test('a locked control names the capability and reaches the real checkout endpoint', async ({ page }) => {
    const username = uniqueName('upg');
    await completeRegistration(page, { username, email: `${username}@example.test`, password: 'UpgradePath2026pass!' });

    const requests: { url: string; body: string }[] = [];
    // The Stripe round trip is external; the routing and the payload are not.
    await page.route('**/api/billing/create-checkout-session', route => {
      requests.push({ url: route.request().url(), body: route.request().postData() ?? '' });
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'https://checkout.invalid/upgrade', sessionId: 'cs_test_upgrade' })
      });
    });
    await page.route('https://checkout.invalid/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>stub checkout</body></html>' }));

    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('button', { name: 'Domain & SEO' }).click();
    await expect(page.getByRole('button', { name: 'Needs Pro' }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Needs Pro' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Connect your own domain')).toBeVisible();
    await expect(dialog.getByText(/links\.yourbrand\.com/)).toBeVisible();

    await dialog.getByRole('button', { name: /Upgrade to Pro/ }).click();
    await expect.poll(() => requests.length).toBe(1);
    expect(requests[0].url).toContain('/api/billing/create-checkout-session');
    expect(JSON.parse(requests[0].body)).toMatchObject({ plan: 'pro' });
  });
});

test.describe('the saved and live claim', () => {
  test('says Live only for the page a visitor can actually reach', async ({ page }) => {
    const username = uniqueName('live');
    await completeRegistration(page, { username, email: `${username}@example.test`, password: 'SavedLive2026pass!' });

    const status = page.locator('.save-status');
    const chips = page.locator('nav[aria-label="Profile pages"] button');
    const openChip = page.locator('nav[aria-label="Profile pages"] button[aria-current="page"]');
    // The page a creator opened is the page the toolbar describes. The home page carries the
    // creator's display name, so the title is read from the chip rather than assumed.
    const assertDescribesOpenPage = async () => {
      const title = (await openChip.getAttribute('title')) ?? '';
      expect(title, 'the chip names its own page').toBeTruthy();
      await expect(status, `the toolbar says "${title}"`).toContainText(title);
    };
    await expect(status).toContainText('Saved · Live');
    await assertDescribesOpenPage();
    await expect(status).toHaveAttribute('title', 'Changes are published automatically');

    await page.getByLabel('New page title').fill('Archive');
    await page.getByLabel('New page URL slug').fill('archive');
    await page.getByRole('button', { name: 'Add page' }).click();
    const archive = chips.filter({ hasText: 'Archive' });
    await expect(archive).toHaveAttribute('title', 'Archive is live');

    await page.locator('#page-manager-edit-published').uncheck();
    await page.getByRole('button', { name: 'Save page settings' }).click();
    await expect(archive).toHaveAttribute('title', 'Archive is unpublished');

    await chips.filter({ hasText: '(Home)' }).click();
    await expect(status).toContainText('Saved · Live');
    await archive.click();
    await expect(status).not.toContainText('Live');
    await assertDescribesOpenPage();

    // The Studio only says "unpublished" because the server agrees. The public HTML route is
    // served by the production server, so the assertion goes to the payload that route reads.
    const publicPageStatus = () => page.request.get(`/api/profiles/${username}?page=archive`).then(r => r.status());
    await expect.poll(publicPageStatus, 'an unpublished page is not reachable').toBe(404);

    await page.locator('#page-manager-edit-published').check();
    await page.getByRole('button', { name: 'Save page settings' }).click();
    await expect(status).toContainText('Saved · Live');
    await expect(status).toContainText('Archive is live');
    await expect.poll(publicPageStatus, 'publishing makes it reachable').toBe(200);
  });
});

test.describe('guided custom domain', () => {
  test('shows the record, names what is missing, and confirms what matches', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const username = uniqueName('dom');
    let authHeader = '';
    page.on('request', request => {
      const header = request.headers()['authorization'];
      if (header && !authHeader) authHeader = header;
    });
    await completeRegistration(page, { username, email: `${username}@example.test`, password: 'DomainFlow2026pass!' });

    // The card is a paid capability, so the tier has to be real. This uses the test-only plan
    // bridge the server already exposes; nothing about the domain flow is faked.
    const upgrade = await page.request.put('/api/studio/plan', {
      headers: { authorization: authHeader, 'x-admin-key': 'playwright-plan-bridge' },
      data: { plan: 'pro' }
    });
    expect(upgrade.status()).toBe(200);

    await page.goto('/studio');
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('button', { name: 'Domain & SEO' }).click();

    const hostField = page.locator('#settings-custom-domain');
    const outcome = page.locator('.domain-outcome');
    const connect = async (host: string) => {
      await hostField.fill(host);
      await page.getByRole('button', { name: 'Continue to the DNS record' }).click();
      await expect(page.locator('.domain-records')).toBeVisible();
    };

    await connect('dns-missing.procreator.test');
    const rows = page.locator('.domain-records dd');
    await expect(rows).toHaveText(['CNAME', 'dns-missing.procreator.test', brand.cnameTarget]);
    await expect(page.locator('.domain-records button[aria-label^="Copy"]')).toHaveCount(3);
    await expect(outcome).toContainText('No CNAME record was found for dns-missing.procreator.test');
    await expect(outcome).not.toContainText('Connected');

    await page.getByRole('button', { name: 'Edit address' }).click();
    await connect('dns-wrong.procreator.test');
    await expect(outcome).toContainText('This host currently points to old-host.example.com');
    await expect(outcome, 'a wrong pointer is not reported as a missing record')
      .not.toContainText('No CNAME record was found');

    await page.getByRole('button', { name: 'Edit address' }).click();
    await connect('dns-live.procreator.test');
    await expect(outcome).toContainText('Connected. Visitors reach your site at dns-live.procreator.test');

    // The copy control is the thing a creator actually uses to fill the DNS form.
    await page.locator('.domain-records button[aria-label="Copy Points to"]').click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(brand.cnameTarget);

    await page.locator('.domain-advanced summary').click();
    await expect(page.locator('.domain-advanced')).toContainText('never holds the private key');
  });
});

test.describe('mobile studio navigation', () => {
  for (const width of [360, 390, 414]) {
    test(`keeps the bottom tab bar usable at ${width}px`, async ({ page }) => {
      const username = uniqueName(`m${width}`);
      await page.setViewportSize({ width, height: 844 });
      await completeRegistration(page, { username, email: `${username}@example.test`, password: 'MobileBar2026pass!' });

      const bar = page.locator('.studio-mobile-tabs');
      await expect(bar).toBeVisible();
      // The desktop strip must not double up with the bottom bar on a phone.
      await expect(page.locator('.studio-tabs')).toBeHidden();
      const labels = await bar.locator('.studio-mobile-nav button > span').allTextContents();
      expect(labels).toEqual(['Content', 'Design', 'Stats', 'More']);

      const fit = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: window.innerWidth }));
      expect(fit.scroll, 'no horizontal scroll').toBeLessThanOrEqual(fit.viewport);

      const taps = await bar.locator('.studio-mobile-nav button').evaluateAll(els => els.map(el => {
        const r = el.getBoundingClientRect();
        const size = parseFloat(getComputedStyle(el.querySelector('span') as Element).fontSize);
        return { h: r.height, w: r.width, size };
      }));
      taps.forEach(tap => {
        expect(tap.h, 'tap target height').toBeGreaterThanOrEqual(44);
        expect(tap.w, 'tap target width').toBeGreaterThanOrEqual(44);
        expect(tap.size, 'label size stays readable').toBeGreaterThanOrEqual(13);
      });

      // The preview switch has to live inside the reserved chrome. A pill floating over the
      // page instead sits on top of whichever control happens to scroll beneath it.
      await expect(bar.locator('.studio-mobile-switcher button')).toHaveCount(2);
      await expect(bar.locator('.studio-mobile-switcher')).toBeVisible();

      // The bottom chrome is fixed, so scrolled to the end the page must have reserved its
      // band — otherwise the last footer row is trapped underneath it forever.
      const clearance = await page.evaluate(() => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
        const chrome = document.querySelector('.studio-mobile-switcher');
        const links = Array.from(document.querySelectorAll('.studio-page footer a, .studio-page footer button'));
        if (!chrome || links.length === 0) throw new Error('studio page missing');
        const lowest = Math.max(...links.map(el => el.getBoundingClientRect().bottom));
        return { lowest, chromeTop: chrome.getBoundingClientRect().top };
      });
      expect(clearance.lowest, 'the page end clears the fixed bottom chrome').toBeLessThan(clearance.chromeTop);

      // "More" holds the two tabs that do not fit as full labels.
      await bar.getByRole('button', { name: 'More' }).click();
      // Scoped to the bar: the desktop tab strip is display:none here but a page-wide
      // role query still resolves to it.
      await bar.getByRole('button', { name: 'Audience' }).click();
      await expect(page.getByRole('heading', { name: 'Form responses' })).toBeVisible();
    });
  }
});

test.describe('public discovery and localization', () => {
  test('public guide and privacy content render in English and Arabic RTL', async ({ page }) => {
    await page.goto('/guides');
    await expect(page.getByRole('heading', { name: 'Make your site useful' })).toBeVisible();
    await expect(page.getByRole('link', { name: /How to build an Arabic mini-site/ })).toBeVisible();

    await page.goto('/ar/privacy');
    await expect(page.getByRole('heading', { name: 'الخصوصية' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('public navigation remains usable at a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.getByRole('link', { name: /RALOA/ }).first()).toBeVisible();
    await page.getByRole('link', { name: /Practical guides/ }).click();
    await expect(page).toHaveURL(/\/guides$/);
    await expect(page.getByRole('heading', { name: 'Make your site useful' })).toBeVisible();
    const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.viewport);
  });
});

test.describe('account acquisition and session lifecycle', () => {
  test('rejects invalid form states, creates an account, rejects duplicate email, and handles bad login', async ({ page }) => {
    const username = uniqueName();
    const email = `${username}@example.test`;
    const password = 'SecureBrowserPass2026!';
    await page.goto('/');
    await page.locator('#hero-claim-btn').click();

    await page.getByLabel('Choose your handle').fill('A!b');
    await expect(page.getByLabel('Choose your handle')).toHaveValue('ab');
    await page.getByLabel('Choose your handle').fill('admin');
    await expect(page.getByRole('button', { name: 'Continue to Step 2' })).toBeDisabled();

    await page.getByLabel('Choose your handle').fill(username);
    await page.getByLabel('Email address').fill('not-an-email');
    await page.getByLabel('Choose password').fill('short');
    await page.getByRole('button', { name: 'Continue to Step 2' }).click();
    await expect(page.getByLabel('Email address')).toBeFocused();
    await expect(page.getByText('What are you building?')).toHaveCount(0);

    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Choose password').fill(password);
    await page.getByRole('button', { name: 'Continue to Step 2' }).click();
    await expect(page.getByText('What are you building?')).toBeVisible();
    await page.getByRole('button', { name: 'Create my site' }).click();
    await expect(page).toHaveURL(/\/studio(?:\?|$)/);

    await page.goto('/');
    await page.locator('#hero-claim-btn').click();
    await page.getByLabel('Choose your handle').fill(uniqueName('duplicate'));
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Choose password').fill(password);
    await page.getByRole('button', { name: 'Continue to Step 2' }).click();
    await page.getByRole('button', { name: 'Create my site' }).click();
    await expect(page.getByText('An account with this email already exists.')).toBeVisible();

    await page.getByRole('link', { name: /sign in here/i }).click();
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password').fill('IncorrectPassword2026!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText(/session has expired/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/studio(?:\?|$)/);
  });
});

test.describe('creator preview and first-win analytics', () => {
  const stats = async (page: Page) => (await page.request.get('/api/analytics/stats')).json();

  test('the creator\'s own full-screen preview records no visit while a visitor load does', async ({ page }) => {
    const username = uniqueName('pv');
    await completeRegistration(page, { username, email: `${username}@example.test`, password: 'SecureBrowserPass2026!' });

    await page.getByRole('button', { name: 'View Live Page' }).click();
    await expect(page).toHaveURL(new RegExp(`/@${username}$`));
    await expect(page.locator('#public-bio-view')).toBeVisible();
    // The setup milestones tell a creator that somebody visited, so the creator's own preview
    // must not be the row behind that sentence.
    await expect.poll(async () => (await stats(page)).totalViews).toBe(0);

    await page.goto(`/@${username}`);
    await expect(page.locator('#public-bio-view')).toBeVisible();
    await expect.poll(async () => (await stats(page)).totalViews).toBe(1);
  });
});

test.describe('creator publishing and account operations', () => {
  test('creates a real public link, exercises newsletter consent and delivery failure, and opens referral settings', async ({ page }) => {
    const username = uniqueName('creator');
    const email = `${username}@example.test`;
    await completeRegistration(page, { username, email, password: 'SecureBrowserPass2026!' });

    await page.getByRole('button', { name: 'Add new link or block' }).click();
    await page.getByRole('button', { name: /^Custom Link/ }).click();
    const title = page.getByRole('textbox', { name: 'Title' }).last();
    const destination = page.getByRole('textbox', { name: 'Destination URL' }).last();
    await title.fill('Portfolio');
    await destination.fill('https://example.org/portfolio');
    await expect.poll(async () => page.getByRole('textbox', { name: 'Title' }).last().inputValue()).toBe('Portfolio');
    await expect.poll(async () => page.request.get(`/api/profiles/${username}`).then(response => response.json())).toMatchObject({
      blocks: expect.arrayContaining([expect.objectContaining({ subtitle: 'Portfolio', url: 'https://example.org/portfolio' })])
    });

    await page.getByRole('button', { name: 'Add new link or block' }).click();
    await page.getByRole('button', { name: /^Newsletter/ }).click();
    await expect.poll(async () => {
      const response = await page.request.get(`/api/profiles/${username}`);
      const profile = await response.json();
      return profile.blocks.some((block: { type: string }) => block.type === 'newsletter');
    }).toBe(true);
    await page.goto(`/@${username}`);
    await expect(page.getByRole('textbox', { name: 'Enter your email address' })).toBeVisible();
    await page.getByLabel('Enter your email address').fill(`reader-${Date.now()}@example.test`);
    await page.locator('form button[type="submit"]').last().click();
    await expect(page.getByRole('alert')).toContainText(/confirm that you want to receive updates/i);
    await expect(page.getByRole('textbox', { name: 'Enter your email address' })).toBeVisible();

    await page.getByRole('checkbox', { name: /I agree to receive email updates/ }).check();
    await page.locator('form button[type="submit"]').last().click();
    await expect(page.getByRole('alert')).toContainText(/service is temporarily unavailable/i);

    await page.goto('/account');
    await page.getByRole('button', { name: 'Refer creators' }).click();
    await expect(page.getByRole('heading', { name: 'Share RALOA. Earn 90 days of Pro.' })).toBeVisible();
    await expect(page.getByLabel('Your referral link')).toHaveValue(new RegExp(`/\\?ref=${username}`));

    await page.getByRole('button', { name: 'Agency referrals' }).click();
    await expect(page.getByRole('heading', { name: 'Earn account credit for each new agency' })).toBeVisible();
    await expect(page.getByLabel('Your agency referral link')).toHaveValue(new RegExp(`/\\?agency_ref=${username}`));
    await expect(page.getByText(/Maximum 3 credits in any 12-month period/)).toBeVisible();
  });

  test('unauthenticated creator tools show a sign-in gate', async ({ page }) => {
    await page.goto('/studio');
    await expect(page.getByRole('heading', { name: 'Sign in to edit your page' })).toBeVisible();
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
  });
});

test.describe('arabic studio reading order', () => {
  test('keeps latin handles and typed values on the side the reader expects', async ({ page }) => {
    const username = uniqueName('ar');
    await completeRegistration(page, { username, email: `${username}@example.test`, password: 'SecureBrowserPass2026!' });
    await page.goto('/ar/studio');
    await page.waitForSelector('#builder-profile-displayName');

    await expect(page.getByRole('heading', { name: 'الصفحات' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'إضافة صفحة' })).toBeVisible();

    const handle = await page.evaluate((name) => {
      const span = [...document.querySelectorAll('.studio-toolbar span')].find(s => s.textContent.trim() === `@${name}`);
      if (!span) return null;
      const positions: { at: number; name: number } = { at: -1, name: -1 };
      for (const node of [...span.childNodes]) {
        if (node.nodeType !== Node.TEXT_NODE || !node.textContent) continue;
        const text = node.textContent;
        const at = text.indexOf('@');
        const named = text.search(/[A-Za-z0-9]/);
        const measure = (index: number) => {
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + 1);
          return range.getBoundingClientRect().left;
        };
        if (at >= 0 && positions.at === -1) positions.at = measure(at);
        if (named >= 0 && positions.name === -1) positions.name = measure(named);
      }
      return positions;
    }, username);
    expect(handle, 'the toolbar handle chip').not.toBeNull();
    expect(handle!.at).toBeGreaterThanOrEqual(0);
    // An Arabic paragraph would push the '@' to the right of the name, so the handle must stay an LTR island.
    expect(handle!.at).toBeLessThan(handle!.name);

    const typed = await page.evaluate(() => {
      const el = document.getElementById('builder-profile-displayName') as HTMLInputElement | null;
      const cs = getComputedStyle(el);
      return { direction: cs.direction, value: el.value };
    });
    expect(typed.direction, `display name "${typed.value}"`).toBe('ltr');
  });
});

test.describe('made-with-RALOA gallery', () => {
  test('lists a page only while its owner keeps the offer standing', async ({ page }) => {
    const username = uniqueName('gal');
    await completeRegistration(page, { username, email: `${username}@example.test`, password: 'GalleryConsent2026!' });

    const listed = async () => {
      const response = await page.request.get('/api/showcase');
      expect(response.status()).toBe(200);
      const body = await response.json() as { profiles: { username: string }[] };
      return body.profiles.some(entry => entry.username === username);
    };

    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('button', { name: 'Site', exact: true }).click();
    const consent = page.getByRole('switch', { name: 'Show my page in the gallery' });
    await expect(consent).toHaveAttribute('aria-checked', 'false');
    expect(await listed(), 'nobody is listed before they agree').toBe(false);

    await consent.click();
    await expect(consent).toHaveAttribute('aria-checked', 'true');
    await expect.poll(listed, 'the offer reaches the server listing').toBe(true);

    // The switch must read the stored answer, not whatever the click set.
    await page.reload();
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('button', { name: 'Site', exact: true }).click();
    await expect(consent).toHaveAttribute('aria-checked', 'true');

    await page.goto('/');
    // The signed-in navbar also links to the same page, so the assertion stays inside the gallery.
    const card = page.locator('#showcase').locator(`a[href="/@${username}"]`);
    await expect(card, 'the gallery card links to the real page').toBeVisible();
    await expect(card.locator('h3')).toHaveText('Galmubvhqoucugo'.replace('Galmubvhqoucugo', username.charAt(0).toUpperCase() + username.slice(1)));

    await page.goto('/studio');
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('button', { name: 'Site', exact: true }).click();
    await consent.click();
    await expect(consent).toHaveAttribute('aria-checked', 'false');
    await expect.poll(listed, 'withdrawing takes the page out again').toBe(false);
  });
});
