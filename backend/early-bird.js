const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const DURATION = 86400000;
const pricing = { Starter: { firstMonth: 995, recurring: 1990 }, Growth: { firstMonth: 1495, recurring: 2990 } };
function signature(value, secret) { return crypto.createHmac('sha256', secret).update(value).digest('hex'); }
function equal(a, b) { return typeof a === 'string' && typeof b === 'string' && /^[a-f0-9]{64}$/.test(a) && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b)); }
function validCampaign(token, secret, now) {
  if (!secret || typeof token !== 'string') return false;
  const [campaign, expires, mac, extra] = token.split('.');
  return !extra && /^[\w-]+$/.test(campaign) && Number(expires) > now && equal(mac, signature(`${campaign}.${expires}`, secret));
}
function createStore(filename) {
  let state = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, 'utf8')) : { visitors: {}, customers: {}, orders: {} };
  state.sessions ||= {};
  const save = () => { fs.mkdirSync(path.dirname(filename), { recursive: true }); fs.writeFileSync(filename + '.tmp', JSON.stringify(state), { mode: 0o600 }); fs.renameSync(filename + '.tmp', filename); };
  const customerKey = email => crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
  function visitor(id, campaign, now = Date.now()) {
    let record = state.visitors[id];
    if (!record) { id = crypto.randomBytes(32).toString('hex'); record = state.visitors[id] = { startedAt: null, trialAt: null }; }
    // Landing visits never start the offer; enrollment happens after signup.
    save(); return { id, record };
  }
  function bind(id, email) {
    const v = state.visitors[id]; const key = customerKey(email);
    const c = state.customers[key] ||= { startedAt: v?.startedAt ?? null, trialAt: null, paidOrder: null };
    if (v?.startedAt) c.startedAt = Math.min(c.startedAt ?? Infinity, v.startedAt);
    if (v?.trialAt) c.trialAt = c.trialAt || v.trialAt;
    if (v) { v.customerKey = key; if (c.trialAt) v.trialAt = c.trialAt; }
    save(); return key;
  }
  function enroll(id, email, now = Date.now()) {
    const key = bind(id, email);
    const c = state.customers[key];
    c.startedAt ??= now;
    state.visitors[id].startedAt = c.startedAt;
    save();
    return key;
  }
  function status(id, key, now = Date.now()) {
    const v = state.visitors[id]; const c = state.customers[key || v?.customerKey];
    return require('./daily-offer').dailyEligibility(v, c, now);
  }
  function trial(id, email) {
    const v = state.visitors[id]; if (!v) throw new Error('Visit session required.');
    v.trialAt ||= Date.now(); if (email) bind(id, email);
    if (v.customerKey) state.customers[v.customerKey].trialAt ||= v.trialAt;
    save(); return status(id);
  }
  return { state, save, visitor, bind, enroll, status, trial };
}
module.exports = { createStore, pricing, signature, equal, validCampaign, DURATION };
