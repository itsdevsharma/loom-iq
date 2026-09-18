import { test, expect } from '@playwright/test';

test('demo form respects throttling and can resume after the retry delay', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/demo-requests', async route => {
    requests++;
    await route.fulfill(requests === 1 ? {
      status: 429, contentType: 'application/json', headers: { 'Retry-After': '3' },
      body: JSON.stringify({ success: false, message: 'Please wait before trying again.', retryAfter: 3 }),
    } : {
      status: 202, contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { requestId: 'demo_test' } }),
    });
  });
  await page.goto('/demo');
  await page.getByLabel('Full name').fill('Demo Tester');
  await page.getByLabel('Mobile number').fill('+919876543210');
  await page.getByLabel('Work email').fill('tester@example.invalid');
  await page.getByLabel('Business name', { exact: true }).fill('Test Business');
  await page.getByRole('button', { name: 'Send verification code' }).click();
  await expect(page.getByRole('button', { name: /Try again in/ })).toBeDisabled();
  await expect(page.getByRole('alert')).toHaveText('Please wait before trying again.');
  expect(requests).toBe(1);
  await expect(page.getByRole('button', { name: 'Send verification code' })).toBeEnabled({ timeout: 6000 });
  expect(requests).toBe(1); // No automatic OTP resend.
  await page.getByRole('button', { name: 'Send verification code' }).click();
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
});
