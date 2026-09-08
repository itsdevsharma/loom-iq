const crypto = require('node:crypto');
const keyFor = email => crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
const fail = (status, message) => Object.assign(new Error(message), { status });
const { dailyEligibility: eligibility } = require('./daily-offer');
function profile(c) { return { name: c.name, email: c.email, company: c.company }; }
async function enroll(tx, id, key, now) {
  const v = await tx.get('visitors', id) || { startedAt: null, trialAt: null };
  const c = await tx.get('customers', key) || { startedAt: null, trialAt: null, paidOrder: null };
  c.offerStartedAt ??= v.offerStartedAt ?? now;
  v.offerStartedAt = c.offerStartedAt;
  c.startedAt = Math.min(c.startedAt ?? Infinity, v.startedAt ?? Infinity, now);
  if (v.trialAt) c.trialAt ||= v.trialAt;
  v.startedAt = c.startedAt; v.customerKey = key;
  if (c.trialAt) v.trialAt = c.trialAt;
  await tx.put('customers', key, c);
  await tx.put('visitors', id, v);
  return { c, v };
}
module.exports = { keyFor, fail, eligibility, profile, enroll };
