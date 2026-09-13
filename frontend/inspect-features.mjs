import { chromium } from '@playwright/test';
import { resolve } from 'node:path';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', msg => console.log('CONSOLE:', msg.text()));

try {
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 15000 });
} catch(e) {
  console.log('Navigation error (expected if API down):', e.message);
  await page.waitForTimeout(3000);
}

// Get the FeaturesSection HTML
const featuresHTML = await page.evaluate(() => {
  const section = document.getElementById('features');
  if (!section) return 'NO FEATURES SECTION FOUND';
  return section.outerHTML;
});

console.log('=== FEATURES SECTION HTML ===');
console.log(featuresHTML.substring(0, 5000));

// Get computed styles of key elements
const computedStyles = await page.evaluate(() => {
  const section = document.getElementById('features');
  if (!section) return { error: 'no section' };
  
  const cards = section.querySelectorAll('.fs03__card');
  const top = section.querySelector('.fs03__top');
  const grid = section.querySelector('.fs03__grid');
  
  const result = {
    section: {
      display: getComputedStyle(section).display,
      width: getComputedStyle(section).width,
      maxWidth: getComputedStyle(section).maxWidth,
      marginLeft: getComputedStyle(section).marginLeft,
      marginRight: getComputedStyle(section).marginRight,
      paddingLeft: getComputedStyle(section).paddingLeft,
      paddingRight: getComputedStyle(section).paddingRight,
      borderRadius: getComputedStyle(section).borderRadius,
      backgroundColor: getComputedStyle(section).backgroundColor,
    },
    top: top ? {
      display: getComputedStyle(top).display,
      gridTemplateColumns: getComputedStyle(top).gridTemplateColumns,
      gap: getComputedStyle(top).gap,
    } : null,
    grid: grid ? {
      display: getComputedStyle(grid).display,
      gridTemplateColumns: getComputedStyle(grid).gridTemplateColumns,
    } : null,
    cards: Array.from(cards).map(card => {
      const style = getComputedStyle(card);
      return {
        display: style.display,
        flexDirection: style.flexDirection,
        minHeight: style.minHeight,
        borderRadius: style.borderRadius,
        padding: style.padding,
        innerText: card.textContent.substring(0, 100),
      };
    }),
  };
  return result;
});

console.log('=== COMPUTED STYLES ===');
console.log(JSON.stringify(computedStyles, null, 2));

await browser.close();
