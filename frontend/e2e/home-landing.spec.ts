import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('loomiq-analytics', 'denied'));
});

test('agency homepage leads with marketing, has accessible content and working ERP paths', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle('LoomiQ | Digital Marketing & Business Solutions');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Give every campaign a clear goal.');
  await expect(page.locator('.mobile-purchase')).toHaveCount(0);
  await expect(page.locator('#services article')).toHaveCount(6);
  await expect(page.locator('#contact a[href="tel:+918222088524"]')).toBeAttached();
  const broken = await page.locator('a[href^="#"]').evaluateAll(links => links.map(link => link.getAttribute('href')!).filter(href => href.length > 1 && !document.getElementById(href.slice(1))));
  expect(broken).toEqual([]);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(axe.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) }))).toEqual([]);
  await page.getByRole('link', { name: 'Compare ERP plans', exact: true }).click();
  await expect(page).toHaveURL(/erp\/pricing$/);
  await page.getByRole('link', { name: 'Choose Starter', exact: true }).click();
  await expect(page).toHaveURL(/signup\?plan=Starter/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto('/');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.screenshot({ path: testInfo.outputPath('homepage.png'), fullPage: true, animations: 'disabled' });
  expect(errors).toEqual([]);
});

test('mobile menu, services dropdown and responsive layout work', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await page.locator('.agency-services-menu summary').click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeFocused();
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await page.locator('.agency-services-menu summary').click();
  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'SEO Services', exact: true }).click();
  await expect(page).toHaveURL(/services\/seo$/);
  await expect(page.getByLabel('Service you’re interested in')).toHaveValue('Website Audit');
  await page.goto('/#consultation');
  await expect(page.getByRole('heading', { name: 'Get a free digital growth consultation.', exact: true })).toBeInViewport();
  await page.goto('/');
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `viewport ${width}`).toBe(true);
    const clipped = await page.locator('.agency-site').evaluate(element => Array.from(element.querySelectorAll('input, select, textarea, .agency-consultation, .agency-header, .agency-service-item')).filter(node => { const box = node.getBoundingClientRect(); return box.width > 0 && (box.left < -1 || box.right > innerWidth + 1); }).map(node => node.tagName));
    expect(clipped, `viewport ${width}`).toEqual([]);
  }
});

test('ERP mobile purchase bar keeps the price and button inside the screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/erp#pricing');
  const bar = page.getByRole('complementary', { name: 'Quick purchase' });
  await expect(bar).toBeVisible();
  expect(await bar.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    return Array.from(element.children).every(child => { const rect = child.getBoundingClientRect(); return rect.left >= bounds.left && rect.right <= bounds.right && rect.bottom <= bounds.bottom; });
  })).toBe(true);
  await expect(bar.getByRole('link', { name: 'View ERP plans' })).toBeVisible();
});


test('sample deliverables and ERP product evaluation work', async ({ page }, testInfo) => {
  await page.goto('/#results');
  await page.getByRole('button', { name: 'SEO review', exact: true }).click();
  await expect(page.getByRole('button', { name: 'SEO review', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: 'Turn a website review into a prioritised worklist.' })).toBeVisible();
  await page.goto('/erp');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A clearer view of your business.');
  await page.getByRole('button', { name: 'Show Inventory', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open inventory full-size preview' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'ERP plan comparison' })).toBeAttached();
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
  await page.screenshot({ path: testInfo.outputPath('erp-evaluation.png'), fullPage: true, animations: 'disabled' });
  for (const width of [360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `ERP viewport ${width}`).toBe(true);
  }
  const broken = await page.locator('a[href^="#"]').evaluateAll(links => links.map(link => link.getAttribute('href')!).filter(href => href.length > 1 && !document.getElementById(href.slice(1))));
  expect(broken).toEqual([]);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
});
