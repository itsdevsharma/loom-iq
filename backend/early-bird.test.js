const { test } = require('node:test');
const assert = require('node:assert/strict');
const { dailyEligibility } = require('./daily-offer');

test('public launch pricing has no visitor deadline', () => {
  const offer = dailyEligibility({ offerStartedAt: 1 }, null, 1800000000000);
  assert.equal(offer.eligible, true);
  assert.equal(offer.expiresAt, null);
  assert.equal(offer.reason, 'available');
  assert.equal(offer.policy, 'launch');
});

test('trial status does not create a timed discount', () => {
  const offer = dailyEligibility(null, { trialAt: 1 }, 1800000000000);
  assert.equal(offer.eligible, true);
  assert.equal(offer.trialSelected, true);
  assert.equal(offer.expiresAt, null);
});

test('a completed purchase is represented without an expiry window', () => {
  const offer = dailyEligibility(null, { paidOrder: 'order_1' });
  assert.equal(offer.eligible, false);
  assert.equal(offer.reason, 'purchased');
  assert.equal(offer.expiresAt, null);
});
