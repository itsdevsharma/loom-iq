import { test, expect } from '@playwright/test';

test('confirmed purchase explains credential delivery and offers support', async ({ page }) => {
  await page.route('**/api/purchase/receipt*', route => route.fulfill({ json: {
    number: 'LIQ-TEST', orderId: 'order_test', paymentId: 'pay_test', issuedAt: Date.now(),
    plan: 'Growth', amount: 149500, testMode: false,
    customer: { name: 'Test Customer', email: 'customer@example.com', company: 'Test Factory' },
  } }));
  await page.goto('/thank-you?type=purchase');
  await expect(page.getByRole('heading', { name: 'Your LoomIQ ERP login credentials are being created.' })).toBeVisible();
  await expect(page.locator('.confirmation-lead')).toContainText('customer@example.com');
  await expect(page.getByRole('link', { name: 'Contact us', exact: true })).toHaveAttribute('href', '#support');
  await expect(page.getByRole('link', { name: 'Email support@loomiq.com' })).toHaveAttribute('href', 'mailto:support@loomiq.com');
  await expect(page.getByRole('link', { name: /View & save invoice/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'We plan your setup' })).toHaveCount(0);
});

test('unverified payment does not claim credentials are being created', async ({ page }) => {
  await page.route('**/api/purchase/receipt*', route => route.fulfill({ status: 401, json: {} }));
  await page.goto('/thank-you?type=purchase');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your LoomIQ ERP login credentials are being created.' })).toHaveCount(0);
});
