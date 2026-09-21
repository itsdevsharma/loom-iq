const DAY = 24 * 60 * 60 * 1000;

// `endsAt` anchors the campaign's first window. Once a window closes, the
// campaign immediately begins the next 24-hour window at the same daily time.
// This is calculated rather than persisted, so concurrent visitors cannot
// accidentally race to renew the campaign.
function currentWindowEndsAt(endsAt, now) {
  if (!Number.isSafeInteger(endsAt)) return null;
  if (endsAt > now) return endsAt;
  return endsAt + (Math.floor((now - endsAt) / DAY) + 1) * DAY;
}

function dailyEligibility(v, c, now = Date.now(), campaign = {}) {
  const purchased = Boolean(c?.paidOrder || v?.paidOrder);
  const enabled = campaign.enabled === true, slotsRemaining = Number.isInteger(campaign.slotsRemaining) ? campaign.slotsRemaining : 0;
  const expiresAt = currentWindowEndsAt(campaign.endsAt, now);
  const active = enabled && slotsRemaining > 0 && Boolean(expiresAt);
  const reason = purchased ? 'purchased' : !enabled ? 'disabled' : slotsRemaining < 1 ? 'sold_out' : !active ? 'expired' : 'available';
  return { eligible: !purchased && active, reason, expiresAt, serverNow: now, trialSelected: Boolean(c?.trialAt || v?.trialAt), policy: 'campaign', discountPercent: campaign.discountPercent || 0, slotsRemaining, slotsTotal: campaign.slotsTotal || 0 };
}
module.exports = { DAY, currentWindowEndsAt, dailyEligibility };
//
