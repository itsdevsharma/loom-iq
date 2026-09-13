const { test } = require('node:test');
const assert = require('node:assert/strict');
const { dailyEligibility } = require('./daily-offer');
const start = 1800000000000;
test('first-time customers including trial accounts qualify within 24 hours', () => {
 for (const extra of [{}, { trialAt: start }]) {
  const offer = dailyEligibility(null, { offerStartedAt: start, ...extra }, start + 1000);
  assert.equal(offer.eligible, true);
  assert.equal(offer.expiresAt, start + 86400000);
 }
});
test('anonymous visitor receives the same fixed window', () => {
 assert.equal(dailyEligibility({offerStartedAt: start}, null, start).expiresAt, start + 86400000);
});
test('deadline expires exactly at 24 hours and does not renew', () => {
 for (const elapsed of [86400000, 172800000]) {
  const offer = dailyEligibility(null, {offerStartedAt: start}, start + elapsed);
  assert.equal(offer.eligible, false);
  assert.equal(offer.reason, 'expired');
  assert.equal(offer.expiresAt, start + 86400000);
 }
 assert.equal(dailyEligibility(null, {offerStartedAt: start}, start + 86399999).eligible, true);
});
test('account deadline takes precedence over a new browser', () => {
 assert.equal(dailyEligibility({offerStartedAt: start + 1000}, {offerStartedAt: start}, start + 2000).expiresAt, start + 86400000);
});

test('paid customers and returning paid visitors cannot reuse the discount', () => {
 assert.equal(dailyEligibility(null, {offerStartedAt:start,paidOrder:'previous'},start+1000).reason,'purchased');
 assert.equal(dailyEligibility({offerStartedAt:start,paidOrder:'previous'},null,start+1000).eligible,false);
});
