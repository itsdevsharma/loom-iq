import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHmac } from 'node:crypto';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('loomiq-analytics', 'denied'));
});

test('public routes refresh correctly; unknown routes return 404', async ({ page }) => {
  for (const route of ['/', '/privacy', '/terms', '/refunds', '/signup', '/forgot-password']) {
    expect((await page.goto(route))?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    expect((await page.reload())?.status()).toBe(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect.soft(accessibility.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })), route).toEqual([]);
  }
  expect((await page.goto('/missing-page'))?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('signup, checkout, invoice, account and logout', async ({ page }, testInfo) => {
  const email = `browser-${Date.now()}@example.invalid`;
  await page.goto('/signup');
  await page.getByLabel('Full name').fill('Browser Tester');
  await page.getByLabel('Company name').fill('Browser Company');
  await page.getByLabel('Work email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Browser-password-123');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create my account' }).click();
  await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
  await page.getByRole('link', { name: 'My account & invoices' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome, Browser Tester' })).toBeVisible();
  await page.getByRole('link', { name: 'Review plans' }).click();
  await expect(page.getByRole('heading', { name: 'Complete your purchase' })).toBeVisible();
  await page.route('https://checkout.razorpay.com/v1/checkout.js', route => route.fulfill({ contentType: 'application/javascript', body: `window.Razorpay = class { constructor(options) { this.options = options; } open() { this.options.handler({ razorpay_order_id: 'order_browser', razorpay_payment_id: 'pay_browser', razorpay_signature: '${createHmac('sha256', 'browser-secret').update('order_browser|pay_browser').digest('hex')}' }); } };` }));
  await page.getByLabel('Full name').fill('Browser Tester');
  await page.getByLabel('Phone number').fill('9876543210');
  await page.getByLabel('Business name').fill('Browser Company');
  await page.getByLabel('Billing address').fill('123 Test Street');
  await page.getByLabel('City', { exact: true }).fill('Mumbai');
  await page.getByLabel('State', { exact: true }).fill('Maharashtra');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /^Pay / }).click();
  await expect(page.getByText('Test payment complete', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /View & save invoice/ })).toBeVisible();
  await page.goto('/account');
  await expect(page.getByRole('link', { name: 'View / save invoice' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('account.png'), fullPage: true });
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
  await page.goto('/account');
  await expect(page).toHaveURL(/signup\?login=1/);
});

test('account recovery and service failures remain usable', async ({ page }) => {
  await page.goto('/forgot-password');
  await page.getByLabel('Email', { exact: true }).fill('missing@example.invalid');
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByRole('alert')).toContainText('No account exists with this email address. Please sign up first.');
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.getByLabel('Email', { exact: true })).toBeEditable();
  await expect(page.getByRole('button', { name: 'Send reset link' })).toBeEnabled();
  await page.goto('/reset-password#token=invalid&email=test@example.invalid');
  await page.getByLabel('New password').fill('New-password-123');
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page.getByRole('alert')).toContainText('valid reset link');
  await page.route('**/api/account/me', route => route.fulfill({ status: 503, json: { message: 'Service temporarily unavailable' } }));
  await page.goto('/account');
  await expect(page.getByRole('alert')).toContainText('Service temporarily unavailable');
  await expect(page.getByRole('button', { name: 'Retry loading account' })).toBeVisible();
});

test('analytics requires consent and never loads on private token pages', async ({ page }) => {
  const tags: string[] = [];
  await page.route('https://www.googletagmanager.com/**', route => { tags.push(route.request().url()); return route.fulfill({ contentType: 'application/javascript', body: '' }); });
  await page.goto('/');
  expect(tags).toHaveLength(0);
  await page.getByRole('button', { name: 'Cookie preferences' }).click();
  await page.getByRole('button', { name: 'Allow analytics' }).click();
  await expect.poll(() => tags.length).toBe(1);
  await page.addInitScript(() => localStorage.setItem('loomiq-analytics', 'granted'));
  await page.goto('/reset-password#token=private-token&email=test@example.invalid');
  await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible();
  expect(tags).toHaveLength(1);
});

test('trial requests appear in the account and the operator queue', async ({ page }) => {
  const email = `trial-browser-${Date.now()}@example.invalid`;
  const signup = await page.request.post('/api/account/signup', { data: { name: 'Trial Tester', email, company: 'Trial Company', password: 'Trial-password-123', acceptTerms: true } });
  expect(signup.status()).toBe(201);
  await page.goto('/account');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Request trial access' }).click();
  await expect(page.getByRole('status')).toContainText('trial request is received');
  await expect(page.getByRole('button', { name: 'Request trial access' })).toHaveCount(0);
  const queue = await page.request.get('/api/operator/onboarding', { headers: { Authorization: 'Bearer browser-operator' } });
  expect((await queue.json()).customers.some((c: { email: string }) => c.email === email)).toBe(true);
});

test('offer initialization retries after a temporary API outage', async ({ page }) => {
  let visits = 0;
  await page.route('**/api/offers/visit', async route => {
    visits++;
    if (visits === 1) await route.fulfill({ status: 503, json: { message: 'API starting' } });
    else await route.continue();
  });
  await page.goto('/');
  await expect.poll(() => visits).toBe(1);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect.poll(() => visits).toBe(2);
  await expect.poll(async () => (await page.context().cookies()).some(cookie => cookie.name === 'loomiq_visitor')).toBe(true);
});
