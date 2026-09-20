const { test } = require('node:test');
const assert = require('node:assert/strict');
const { dailyEligibility } = require('./daily-offer');

const campaign = { enabled: true, discountPercent: 50, slotsTotal: 10, slotsRemaining: 3, endsAt: 1800000000000 + 36000000 };

test('campaign pricing has a shared deadline and remaining slots', () => {
  const offer = dailyEligibility({ offerStartedAt: 1 }, null, 1800000000000, campaign);
  assert.equal(offer.eligible, true);
  assert.equal(offer.expiresAt, campaign.endsAt);
  assert.equal(offer.reason, 'available');
  assert.equal(offer.policy, 'campaign');
  assert.equal(offer.slotsRemaining, 3);
});

test('trial status retains campaign eligibility', () => {
  const offer = dailyEligibility(null, { trialAt: 1 }, 1800000000000, campaign);
  assert.equal(offer.eligible, true);
  assert.equal(offer.trialSelected, true);
  assert.equal(offer.expiresAt, campaign.endsAt);
});

test('a completed purchase is not eligible', () => {
  const offer = dailyEligibility(null, { paidOrder: 'order_1' }, 1800000000000, campaign);
  assert.equal(offer.eligible, false);
  assert.equal(offer.reason, 'purchased');
});

test('campaign ends when its slots are exhausted', () => {
  const offer = dailyEligibility(null, null, 1800000000000, { ...campaign, slotsRemaining: 0 });
  assert.equal(offer.eligible, false);
  assert.equal(offer.reason, 'sold_out');
});
