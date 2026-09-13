const DAY = 86400000;
function dailyEligibility(v, c, now = Date.now()) {
  const startedAt = c?.offerStartedAt ?? v?.offerStartedAt;
  const expiresAt = startedAt == null ? null : startedAt + DAY;
  const purchased = Boolean(c?.paidOrder || v?.paidOrder);
  const eligible = !purchased && expiresAt !== null && now < expiresAt;
  return { eligible, reason: purchased ? 'purchased' : eligible ? 'eligible' : expiresAt === null ? 'unavailable' : 'expired', expiresAt, serverNow: now, trialSelected: Boolean(c?.trialAt || v?.trialAt), policy: '24-hour' };
}
module.exports = { dailyEligibility };
