import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const routes = ['digital-marketing', 'services/meta-ads', 'services/google-ads', 'services/seo', 'services/social-media-marketing', 'services/performance-marketing', 'services/lead-generation', 'erp', 'erp/pricing'];
test.beforeEach(async ({ page }) => { await page.addInitScript(() => localStorage.setItem('loomiq-analytics', 'denied')); });

test('dedicated service and ERP routes load, refresh and expose indexable metadata', async ({ page }) => {
  test.setTimeout(60000);
  for (const route of routes) {
    const response = await page.goto('/' + route);
    expect(response?.status(), route).toBe(200);
    expect(response?.headers()['x-robots-tag'] || '', route).not.toContain('noindex');
    const html = await response!.text();
    expect(html).not.toContain('<title>Page Not Found');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route).toBe(true);
  }
  expect((await page.reload())?.status()).toBe(200);
  await page.goto('/services/meta-ads');
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
});

for (const failure of [false, true]) test(`consultation ${failure ? 'retains details after an error' : 'saves a service-specific enquiry'}`, async ({ page }) => {
  if (failure) await page.route('**/api/support', route => route.fulfill({ status: 503, json: { message: 'Temporarily unavailable. Please try again.' } }));
  await page.goto('/services/google-ads');
  await page.getByLabel('Your name', { exact: true }).fill('Campaign Tester');
  await page.getByLabel('Email address', { exact: true }).fill('agency@example.invalid');
  await page.getByLabel('Business or website').fill('Example Business');
  await expect(page.getByLabel('Service you’re interested in')).toHaveValue('Google Ads Management');
  await page.getByLabel('Your goals').fill('We want relevant enquiries for our local services.');
  const response = page.waitForResponse(item => item.url().endsWith('/api/support') && item.request().method() === 'POST');
  await page.getByRole('button', { name: 'Get a Free Consultation', exact: true }).click();
  const result = await response;
  expect(result.request().postDataJSON().subject).toBe('Google Ads Management consultation');
  if (failure) {
    await expect(page.getByRole('alert')).toHaveText('Temporarily unavailable. Please try again.');
    await expect(page.getByLabel('Business or website')).toHaveValue('Example Business');
  } else {
    expect(result.ok()).toBe(true);
    await expect(page.getByRole('status')).toContainText('Your enquiry is with us.');
  }
});
