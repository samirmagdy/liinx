import { expect, test, type Page } from 'playwright/test';

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
  await page.getByRole('button', { name: 'Launch My Page' }).click();
  await expect(page).toHaveURL(/\/studio(?:\?|$)/);
}

test.describe('public discovery and localization', () => {
  test('public guide and privacy content render in English and Arabic RTL', async ({ page }) => {
    await page.goto('/guides');
    await expect(page.getByRole('heading', { name: 'Make your mini-site useful' })).toBeVisible();
    await expect(page.getByRole('link', { name: /How to build an Arabic mini-site/ })).toBeVisible();

    await page.goto('/ar/privacy');
    await expect(page.getByRole('heading', { name: 'الخصوصية' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('public navigation remains usable at a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Liinx/ }).first()).toBeVisible();
    await page.getByRole('link', { name: /Practical guides/ }).click();
    await expect(page).toHaveURL(/\/guides$/);
    await expect(page.getByRole('heading', { name: 'Make your mini-site useful' })).toBeVisible();
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
    await page.getByRole('button', { name: 'Launch My Page' }).click();
    await expect(page).toHaveURL(/\/studio(?:\?|$)/);

    await page.goto('/');
    await page.locator('#hero-claim-btn').click();
    await page.getByLabel('Choose your handle').fill(uniqueName('duplicate'));
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Choose password').fill(password);
    await page.getByRole('button', { name: 'Continue to Step 2' }).click();
    await page.getByRole('button', { name: 'Launch My Page' }).click();
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

test.describe('creator publishing and account operations', () => {
  test('creates a real public link, exercises newsletter consent and delivery failure, and opens referral settings', async ({ page }) => {
    const username = uniqueName('creator');
    const email = `${username}@example.test`;
    await completeRegistration(page, { username, email, password: 'SecureBrowserPass2026!' });

    await page.getByRole('button', { name: 'Add New Link or Block to Profile' }).click();
    await page.getByRole('button', { name: /^Link/ }).click();
    const title = page.getByRole('textbox', { name: 'Title' }).last();
    const destination = page.getByRole('textbox', { name: 'Destination URL' }).last();
    await title.fill('Portfolio');
    await destination.fill('https://example.org/portfolio');
    await expect.poll(async () => page.getByRole('textbox', { name: 'Title' }).last().inputValue()).toBe('Portfolio');
    await expect.poll(async () => page.request.get(`/api/profiles/${username}`).then(response => response.json())).toMatchObject({
      blocks: expect.arrayContaining([expect.objectContaining({ subtitle: 'Portfolio', url: 'https://example.org/portfolio' })])
    });

    await page.getByRole('button', { name: 'Add New Link or Block to Profile' }).click();
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
    await expect(page.getByRole('heading', { name: 'Share Liinx. Earn 90 days of Pro.' })).toBeVisible();
    await expect(page.getByLabel('Your referral link')).toHaveValue(new RegExp(`/\?ref=${username}`));

    await page.getByRole('button', { name: 'Agency referrals' }).click();
    await expect(page.getByRole('heading', { name: 'Earn account credit for each new agency' })).toBeVisible();
    await expect(page.getByLabel('Your agency referral link')).toHaveValue(new RegExp(`/\?agency_ref=${username}`));
    await expect(page.getByText(/Maximum 3 credits in any 12-month period/)).toBeVisible();
  });

  test('unauthenticated creator tools show a sign-in gate', async ({ page }) => {
    await page.goto('/studio');
    await expect(page.getByRole('heading', { name: 'Sign in to edit your page' })).toBeVisible();
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
  });
});
