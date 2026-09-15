function dailyEligibility(v, c, now = Date.now()) {
  const purchased = Boolean(c?.paidOrder || v?.paidOrder);
  // Pricing is public and stable; it is no longer tied to an artificial visitor timer.
  return { eligible: !purchased, reason: purchased ? 'purchased' : 'available', expiresAt: null, serverNow: now, trialSelected: Boolean(c?.trialAt || v?.trialAt), policy: 'launch' };
}
module.exports = { dailyEligibility };
//
