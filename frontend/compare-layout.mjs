import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 2000 } });

await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(3000);

const layoutInfo = await page.evaluate(() => {
  const sections = document.querySelectorAll('section');
  const results = [];
  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    const style = getComputedStyle(section);
    const id = section.id || section.className.substring(0, 30);
    results.push({
      id,
      className: section.className,
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      marginLeft: style.marginLeft,
      marginRight: style.marginRight,
      textAlign: style.textAlign,
    });
  }
  return results;
});

console.log('=== SECTION LAYOUT COMPARISON ===');
console.log(JSON.stringify(layoutInfo, null, 2));

await browser.close();
