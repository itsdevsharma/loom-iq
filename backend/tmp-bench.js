const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { fileRepository } = require('./repository');
const { configuredPricing } = require('./website-content');
const { customerQuote } = require('./customer-pricing');

const src = path.join(__dirname, 'data', 'offers.json');
const copy = path.join(os.tmpdir(), 'loomiq-bench-offers.json');
fs.copyFileSync(src, copy);
const repository = fileRepository(copy, undefined);

const time = async (label, fn, runs = 5) => {
  const samples = [];
  for (let i = 0; i < runs; i++) { const s = process.hrtime.bigint(); await fn(); samples.push(Number(process.hrtime.bigint() - s) / 1e6); }
  samples.sort((a, b) => a - b);
  console.log(`${label.padEnd(34)} median ${samples[Math.floor(runs / 2)].toFixed(2)}ms  min ${samples[0].toFixed(2)}ms  max ${samples[runs - 1].toFixed(2)}ms`);
};

(async () => {
  console.log('state size', (fs.statSync(copy).size / 1024).toFixed(0) + 'KB');
  const visitor = '7c1d1bb13caa922ebfb62473a7d70069e7a6573acb972a36a76a5be610fe2660';
  await time('repository.get(visitors, id)', () => repository.get('visitors', visitor));
  await time('repository.get(website_content)', () => repository.get('website_content', 'site'));
  await time('configuredPricing', () => configuredPricing(repository));
  await time('offerStatus transaction', () => repository.transaction(async tx => {
    const v = await tx.get('visitors', visitor);
    if (v) { v.offerStartedAt = v.offerStartedAt || Date.now(); await tx.put('visitors', visitor, v); }
  }));
  await time('customerQuote(Starter)', () => customerQuote(repository, undefined, 'Starter', {}), 3);
  await time('whole visit request', async () => { await repository.transaction(tx => tx.put('visitors', visitor, { startedAt: null, trialAt: null, offerStartedAt: Date.now() })); }, 3);
  fs.rmSync(copy, { force: true });
})();