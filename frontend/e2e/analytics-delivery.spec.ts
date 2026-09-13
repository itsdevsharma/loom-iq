// Google Analytics end-to-end delivery checks.
// Default runs are fully mocked so automated suites never send test data to the real
// property; set RUN_GA_LIVE_TEST=1 to verify live delivery to the production ID.
import { test, expect } from '@playwright/test';

const measurementId = 'G-0H0Z4CLD5Z';
const gtagScript = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
const collectUrl = /https:\/\/(www\.google-analytics\.com|[^/]*\.analytics\.google\.com)\/g\/collect/;

test.beforeEach(async ({ page }) => {
  await page.route('https://connect.facebook.net/**', route => route.fulfill({contentType:'application/javascript',body:'/* isolated Pixel stub */'}));
  await page.route('https://www.facebook.com/**', route => route.abort());
  await page.addInitScript(() => localStorage.setItem('loomiq-analytics', 'denied'));
});

test('analytics loads after consent and delivers page views and custom events', async ({ page }) => {
  const live = process.env.RUN_GA_LIVE_TEST === '1';
  await page.addInitScript(() => localStorage.removeItem('loomiq-analytics'));
  const gtagRequests: string[] = [];
  const collectRequests: { params: () => URLSearchParams }[] = [];
  const hitParams = (url: URL, body: string | null) => {
    const params = new URLSearchParams(url.search);
    for (const [key, value] of new URLSearchParams(body || '')) params.append(key, value);
    return params;
  };
  page.on('request', request => {
    const url = request.url();
    if (url.startsWith('https://www.googletagmanager.com/gtag/js')) gtagRequests.push(url);
    if (collectUrl.test(url)) {
      const params = hitParams(new URL(url), request.postData());
      collectRequests.push({ params: () => params });
    }
  });
  if (!live) {
    // Hermetic mode: the tag script is a no-op and delivery hits are answered locally.
    await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ contentType: 'application/javascript', body: '/* mocked for tests */' }));
    await page.route('**/g/collect?**', route => route.fulfill({ status: 204 }));
  }

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Run your garment factory from one place.' })).toBeVisible();
  expect(gtagRequests).toHaveLength(0);
  expect(collectRequests).toHaveLength(0);

  await page.getByRole('button', { name: 'Allow analytics' }).click();
  await expect.poll(() => gtagRequests.some(url => url.startsWith(gtagScript))).toBe(true);

  // Click the visible purchase CTA to fire a real custom event through the tag.
  await page.locator('#hero .hero-actions .button-primary').click();

  if (live) {
    await expect.poll(() => collectRequests.length, { timeout: 20000 }).toBeGreaterThanOrEqual(1);
    await expect.poll(() => collectRequests.some(hit => hit.params().get('tid') === measurementId), { timeout: 20000 }).toBe(true);
    await expect.poll(() => collectRequests.some(hit => hit.params().get('en') === 'page_view'), { timeout: 20000 }).toBe(true);
    await expect.poll(() => collectRequests.some(hit => hit.params().get('en') === 'direct_purchase_clicked'), { timeout: 20000 }).toBe(true);
  } else {
    const commands = await page.evaluate(() => (window.dataLayer || []).map(entry => Array.from(entry as ArrayLike<unknown>).slice(0, 2)));
    expect(commands).toContainEqual(['config', measurementId]);
    expect(commands).toContainEqual(['event', 'direct_purchase_clicked']);
  }

  // Recovery pages never load the tag, so private tokens stay out of analytics.
  const gtagHitsBeforeReset = gtagRequests.length;
  const collectHitsBeforeReset = collectRequests.length;
  await page.addInitScript(() => localStorage.setItem('loomiq-analytics', 'granted'));
  await page.goto('/reset-password#token=private-token&email=test@example.invalid');
  await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible();
  expect(gtagRequests).toHaveLength(gtagHitsBeforeReset);
  expect(collectRequests).toHaveLength(collectHitsBeforeReset);
});
