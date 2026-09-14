import { test, expect } from '@playwright/test';

test('homepage and built-in images load while the content API is unavailable', async ({ page }) => {
  await page.route('**/api/content/website', () => { /* Simulate a stalled backend. */ });
  await page.route('**/api/content/assets/**', route => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#hero-title')).toBeVisible({ timeout: 1000 });
  for (const selector of ['.brand-logo', '.analytics-dashboard-image']) {
    const image = page.locator(selector).first();
    await expect(image).toHaveAttribute('src', /^\/cms-defaults\//);
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
  }
});
