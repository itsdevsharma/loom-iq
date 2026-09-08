require('dotenv').config({ quiet: true });
const { signature } = require('../early-bird');
const [url, campaign, expires] = process.argv.slice(2);
const secret = process.env.EARLY_BIRD_CAMPAIGN_SECRET;
if (!secret || !url || !/^[\w-]+$/.test(campaign || '') || !Number.isFinite(Date.parse(expires)) || Date.parse(expires) <= Date.now()) {
  console.error('Set EARLY_BIRD_CAMPAIGN_SECRET; run: node scripts/campaign-link.js https://www.loomiq.com/ meta-launch 2026-12-31T23:59:59Z');
  process.exit(1);
}
const payload = `${campaign}.${Date.parse(expires)}`;
const link = new URL(url);
link.searchParams.set('early_bird', `${payload}.${signature(payload, secret)}`);
link.searchParams.set('utm_source', 'meta');
link.searchParams.set('utm_medium', 'paid_social');
link.searchParams.set('utm_campaign', campaign);
console.log(link.toString());
