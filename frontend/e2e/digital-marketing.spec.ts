import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('marketing service navigation, layout and accessibility', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Essential only' }).click();
  const toggle = page.getByRole('button', { name: 'Open navigation menu' });
  if (await toggle.isVisible()) await toggle.click();
  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Digital marketing', exact: true }).click();
  await expect(page).toHaveTitle('Digital Marketing & Meta Ads Services | LoomIQ');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('good ad away');
  await expect(page.getByRole('link', { name: 'Call 93543555930', exact: true })).toHaveAttribute('href', 'tel:93543555930');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByText('How much does it cost?', { exact: true }).click();
  await expect(page.getByText('We scope the work around your goals', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'Discuss your campaign', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'What would growth look like for you?' })).toBeInViewport();
  expect((await new AxeBuilder({ page }).include('.marketing-page').analyze()).violations).toEqual([]);
  expect(errors).toEqual([]);
});

for (const failure of [false, true]) test(`consultation ${failure ? 'handles errors without losing input' : 'is accepted by the backend'}`, async ({ page }) => {
  if (failure) await page.route('**/api/support', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Temporarily unavailable. Please try again.' }) }));
  await page.goto('/digital-marketing');
  await page.getByRole('button', { name: 'Essential only' }).click();
  await page.getByLabel('Your name', { exact: true }).fill('Campaign Test');
  await page.getByLabel('Email address', { exact: true }).fill('campaign@example.invalid');
  await page.getByLabel('Business name or website').fill('Test Business');
  await page.getByLabel('Primary goal').selectOption('Generate enquiries');
  await page.getByLabel('Monthly ad budget').selectOption('Help me plan a budget');
  await page.getByLabel('What would you like to achieve?').fill('We want more enquiries for our local business.');
  await page.getByRole('button', { name: 'Send my enquiry' }).click();
  if (failure) {
    await expect(page.getByRole('alert')).toHaveText('Temporarily unavailable. Please try again.');
    await expect(page.getByLabel('Business name or website')).toHaveValue('Test Business');
    await expect(page.getByRole('button', { name: 'Send my enquiry' })).toBeEnabled();
  } else await expect(page.getByRole('status')).toContainText('Your enquiry is with us.');
});
