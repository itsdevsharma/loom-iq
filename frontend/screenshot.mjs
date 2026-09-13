import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ 
  viewport: { width: 1440, height: 2500 } 
});

await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(3000);

// Hide the offers popup if present
await page.evaluate(() => {
  const popup = document.querySelector('.offers-popup');
  if (popup) popup.remove();
  const trigger = document.querySelector('.offers-trigger');
  if (trigger) trigger.remove();
});

await page.screenshot({ path: '/tmp/features-bug.png', fullPage: true });
console.log('Screenshot saved to /tmp/features-bug.png');

// Also get the section positions for verification
const info = await page.evaluate(() => {
  const features = document.getElementById('features');
  const howItWorks = document.getElementById('how-it-works');
  const featuresRect = features.getBoundingClientRect();
  const howRect = howItWorks.getBoundingClientRect();
  return {
    features: { left: featuresRect.left, width: featuresRect.width, right: featuresRect.right },
    howItWorks: { left: howRect.left, width: howRect.width, right: howRect.right },
    pageWidth: window.innerWidth,
    featuresIsLeftAligned: featuresRect.left === 0,
    howIsCentered: howRect.left > 0,
  };
});
console.log('Layout info:', JSON.stringify(info, null, 2));

await browser.close();
