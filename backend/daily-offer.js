function dailyEligibility(v, c, now = Date.now(), campaign = {}) {
  const purchased = Boolean(c?.paidOrder || v?.paidOrder);
  const enabled = campaign.enabled === true, slotsRemaining = Number.isInteger(campaign.slotsRemaining) ? campaign.slotsRemaining : 0;
  const expiresAt = Number.isSafeInteger(campaign.endsAt) ? campaign.endsAt : null;
  const active = enabled && slotsRemaining > 0 && Boolean(expiresAt && expiresAt > now);
  const reason = purchased ? 'purchased' : !enabled ? 'disabled' : slotsRemaining < 1 ? 'sold_out' : !active ? 'expired' : 'available';
  return { eligible: !purchased && active, reason, expiresAt, serverNow: now, trialSelected: Boolean(c?.trialAt || v?.trialAt), policy: 'campaign', discountPercent: campaign.discountPercent || 0, slotsRemaining, slotsTotal: campaign.slotsTotal || 0 };
}
module.exports = { dailyEligibility };
//
