const BASE = process.env.BASE ?? 'http://127.0.0.1:5199';

import { chromium } from '@playwright/test';

const OFFER_DELAY = 2500;
const QUOTE_DELAY = 600;

function offerBody() {
  return { eligible: true, reason: 'available', expiresAt: null, serverNow: Date.now(), trialSelected: false, policy: 'launch', signedUp: true, customer: { name: 'Tester', email: 'tester@example.com', company: 'Acme' } };
}
function quoteBody(plan) {
  return { success: true, plan, currency: 'INR', amount: plan === 'Starter' ? 10000 : 299000, recurring: plan === 'Starter' ? 1990 : 2990, source: 'customer', discounted: false, expiresAt: null, pricingRevision: 1 };
}

// Records, inside the page, the first time checkout shows a price and every
// distinct price state after that. No round-trip polling skew.
const recorder = () => {
  window.__pricing = [];
  let last = '';
  const tick = () => {
    const cards = [...document.querySelectorAll('.payment-plan-price')].map(el => el.textContent.trim()).join(' | ');
    const total = document.querySelector('.payment-total > strong')?.textContent.trim() ?? '';
    const submit = document.querySelector('.payment-submit')?.textContent.trim() ?? '';
    const error = document.querySelector('.payment-consent-area p[role="alert"]')?.textContent.trim() ?? '';
    const line = `${cards} :: ${total} :: ${submit} :: ${error}`;
    if (line !== last || last === '') { window.__pricing.push({ t: Math.round(performance.now()), line }); last = line; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

const bootDiag = () => {
  const log = [];
  const start = performance.now();
  const check = () => {
    log.push({
      t: Math.round(performance.now() - start),
      ready: document.readyState,
      rootChildren: document.getElementById('root')?.childElementCount ?? -1,
      paymentContent: !!document.querySelector('.payment-content'),
      planPrice: document.querySelector('.payment-plan-price')?.textContent?.trim() ?? '',
      suspense: !!document.querySelector('.suspense, .app-loading, [data-loading]'),
    });
    if (log.length < 80) requestAnimationFrame(check);
  };
  requestAnimationFrame(check);
  window.__boot = log;
  window.addEventListener('load', () => {
    window.__nav = performance.getEntriesByType('navigation').map(n => ({ domInteractive: Math.round(n.domInteractive), domContentLoaded: Math.round(n.domContentLoadedEventEnd), loadEnd: Math.round(n.loadEventEnd) }));
    window.__resources = performance.getEntriesByType('resource').map(r => ({ name: r.name.replace(location.origin, ''), start: Math.round(r.startTime), end: Math.round(r.responseEnd) })).sort((a, b) => b.end - a.end).slice(0, 8);
  });
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(bootDiag);
await page.route('**/api/content/website', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ values: {}, revision: 0 }) }));
await page.route('**/api/offers/visit', async route => {
  await new Promise(r => setTimeout(r, 2500));
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(offerBody()) });
});
await page.route('**/api/purchase/quote', async route => {
  const plan = route.request().postDataJSON().plan;
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(quoteBody(plan)) });
});
await page.on('console', m => console.log('console:', m.type(), m.text()));
await page.goto(`${BASE}/payment`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4500);
const boot = await page.evaluate(() => window.__boot);
const nav = await page.evaluate(() => window.__nav);
const resources = await page.evaluate(() => window.__resources);
const first = boot.findIndex(b => b.rootChildren !== 0);
console.log('\n=== boot diagnostics ===');
console.log('nav', JSON.stringify(nav));
console.log('first root content', JSON.stringify(boot[first] ?? boot[0]));
console.log('first payment-content', JSON.stringify(boot.find(b => b.paymentContent) ?? null));
console.log('first plan price', JSON.stringify(boot.find(b => b.planPrice) ?? null));
console.log('resource tail', JSON.stringify(resources));
await browser.close();

async function run({ label, quoteStatus }) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(recorder);
  await page.route('**/api/content/website', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ values: {}, revision: 0 }) }));
  await page.route('**/api/offers/visit', async route => {
    await new Promise(r => setTimeout(r, OFFER_DELAY));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(offerBody()) });
  });
  await page.route('**/api/purchase/quote', async route => {
    const plan = route.request().postDataJSON().plan;
    await new Promise(r => setTimeout(r, QUOTE_DELAY));
    if (quoteStatus !== 200) return route.fulfill({ status: quoteStatus, contentType: 'application/json', body: JSON.stringify({ message: 'Unable to load your price.' }) });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(quoteBody(plan)) });
  });

  await page.goto(`${BASE}/payment`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  const events = await page.evaluate(() => window.__pricing);
  const requested = await page.evaluate(() => window.__quoteRequest).catch(() => null);
  void requested;
  console.log(`\n=== ${label} (quote HTTP ${quoteStatus}) ===`);
  events.forEach(e => console.log(`${String(e.t).padStart(5)}ms  ${e.line}`));
  console.log(`never showed "Loading…": ${!events.some(e => e.line.includes('Loading'))}`);
  await browser.close();
}

await run({ label: 'personalised price + slow offer check', quoteStatus: 200 });
await run({ label: 'quote API failing', quoteStatus: 500 });

