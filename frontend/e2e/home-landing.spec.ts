import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage services, contact, accessibility and ERP purchase path', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('loomiq-analytics', 'denied'));
  await page.goto('/');
  await expect(page).toHaveTitle('LoomIQ | Business ERP & Digital Marketing Services');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Grow your businesswith Meta ads.');
  await page.getByRole('link', { name: 'Explore our services', exact: true }).click();
  await expect(page.locator('#solutions')).toBeInViewport();
  await expect(page.getByRole('link', { name: 'Explore Meta ads services', exact: true })).toHaveAttribute('href', '/digital-marketing');
  await expect(page.locator('#home-contact').getByRole('link', { name: '+91 82220 88524', exact: true })).toHaveAttribute('href', 'tel:+918222088524');
  const brokenAnchors = await page.locator('a[href^="#"]').evaluateAll(links => links.map(link => link.getAttribute('href')!).filter(href => href.length > 1 && !document.getElementById(href.slice(1))));
  expect(brokenAnchors).toEqual([]);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.getByRole('link', { name: 'View software plans', exact: true }).click();
  await page.getByRole('link', { name: 'Choose Starter', exact: true }).click();
  await expect(page).toHaveURL(/signup\?plan=Starter/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto('/');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.screenshot({ path: testInfo.outputPath('homepage.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('homepage fits mobile, tablet and desktop widths', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('loomiq-analytics', 'denied'));
  await page.goto('/');
  for (const width of [360, 768, 950, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const overflow = await page.locator('.homepage').evaluate(element => Array.from(element.querySelectorAll('.home-intro, .home-solution, .home-contact, .topbar, .topbar a')).filter(node => {
      const box = node.getBoundingClientRect();
      return box.width > 0 && (box.right > window.innerWidth + 1 || box.left < -1);
    }).map(node => node.className));
    expect(overflow, `viewport ${width}`).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});
