const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { signature } = require('./early-bird');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'purchase-'));
process.env.OFFER_DB_PATH = path.join(dir, 'offers.json');
process.env.RAZORPAY_KEY_ID = 'test'; process.env.RAZORPAY_KEY_SECRET = 'secret';
const payments = {}; let count = 0;
require.cache[require.resolve('razorpay')] = { id: require.resolve('razorpay'), filename: require.resolve('razorpay'), loaded: true, exports: class {
  orders = { create: async data => ({ ...data, id: `order_${++count}` }) };
  payments = { fetch: async id => payments[id], refund: async () => ({}) };
} };
const { app, useRepository } = require('./server');
const repository = require('./repository').fileRepository(process.env.OFFER_DB_PATH);
useRepository(repository); let server, base;
before(async () => { server = app.listen(0); await new Promise(resolve => server.once('listening', resolve)); base = `http://127.0.0.1:${server.address().port}`; });
after(async () => { await new Promise(resolve => server.close(resolve)); fs.rmSync(dir, { recursive: true, force: true }); });
async function post(route, body, cookie) { const response = await fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) }); const text = await response.text(); return { status: response.status, body: text ? JSON.parse(text) : {}, cookie: response.headers.getSetCookie().map(item => item.split(';')[0]).join('; ') }; }
async function signup(email) { const visit = await post('/api/offers/visit', {}); return post('/api/account/signup', { name: 'Tester', company: 'Acme', email, password: 'Test-password-123', acceptTerms: true }, visit.cookie); }
function orderBody(email, amount) { return { plan: 'Starter', acceptConditions: true, expectedAmount: amount, customer: { name: 'Tester', email, phone: '1234567890', company: 'Acme', address: 'Road', city: 'City', state: 'State' } }; }

test('public pricing has no 24-hour expiry', async () => {
  const visit = await post('/api/offers/visit', {});
  assert.equal(visit.body.expiresAt, null);
  assert.equal(visit.body.policy, 'launch');
  const quote = await post('/api/purchase/quote', { plan: 'Starter' }, visit.cookie);
  assert.equal(quote.body.amount, 199000);
  assert.equal(quote.body.discounted, false);
});

test('checkout uses the published monthly price and creates a three-month price lock after payment', async () => {
  const account = await signup('launch-price@example.com');
  const order = await post('/api/purchase/order', orderBody('launch-price@example.com', 199000), account.cookie);
  assert.equal(order.status, 201);
  payments.pay_1 = { order_id: order.body.orderId, amount: order.body.amount, currency: 'INR', status: 'captured' };
  const verified = await post('/api/purchase/verify', { razorpay_order_id: order.body.orderId, razorpay_payment_id: 'pay_1', razorpay_signature: signature(`${order.body.orderId}|pay_1`, 'secret') }, account.cookie);
  assert.equal(verified.status, 200);
  const customer = await repository.get('customers', require('./account-service').keyFor('launch-price@example.com'));
  assert.equal(customer.launchPriceLock.Starter.amount, 199000);
  assert.ok(customer.launchPriceLock.Starter.expiresAt > Date.now());
});

test('an expired demo conversion is durably retried and activates the customer workspace', async () => {
  const account = await signup('expired-demo@example.com');
  const order = await post('/api/purchase/order', orderBody('expired-demo@example.com', 199000), account.cookie);
  const customerKey = require('./account-service').keyFor('expired-demo@example.com');
  await repository.transaction(tx => tx.put('demoRequests', 'demo_expired', { id: 'demo_expired', email: 'expired-demo@example.com', status: 'expired', erp: { userId: 'erp-user' }, updatedAt: new Date().toISOString() }));
  payments.pay_expired = { order_id: order.body.orderId, amount: order.body.amount, currency: 'INR', status: 'captured' };
  const originalFetch = global.fetch;
  const previous = { api: process.env.ERP_API_URL, token: process.env.ERP_MARKETING_INTEGRATION_TOKEN, login: process.env.ERP_LOGIN_URL };
  process.env.ERP_API_URL = 'https://erp.example.invalid'; process.env.ERP_MARKETING_INTEGRATION_TOKEN = 'x'.repeat(32); process.env.ERP_LOGIN_URL = 'https://erp.example.invalid/login';
  try {
    global.fetch = async (input, init) => String(input).startsWith(process.env.ERP_API_URL)
      ? { ok: false, status: 503, json: async () => ({ success: false, message: 'ERP unavailable' }) }
      : originalFetch(input, init);
    const first = await post('/api/purchase/verify', { razorpay_order_id: order.body.orderId, razorpay_payment_id: 'pay_expired', razorpay_signature: signature(`${order.body.orderId}|pay_expired`, 'secret') }, account.cookie);
    assert.equal(first.status, 200);
    assert.match(first.body.message, /activation is in progress/i);
    const pending = await repository.get('orders', order.body.orderId);
    assert.equal(pending.erpConversion.status, 'pending');
    assert.equal(pending.erpConversion.attempts, 1);
    await repository.transaction(async tx => { const current = await tx.get('orders', order.body.orderId); current.erpConversion.nextAttemptAt = 0; await tx.put('orders', current.id, current); });
    global.fetch = async (input, init) => String(input).startsWith(process.env.ERP_API_URL)
      ? { ok: true, status: 200, json: async () => ({ success: true, data: { workspaceUrl: 'https://erp.example.invalid/login' } }) }
      : originalFetch(input, init);
    const retried = await post('/api/purchase/verify', { razorpay_order_id: order.body.orderId, razorpay_payment_id: 'pay_expired', razorpay_signature: signature(`${order.body.orderId}|pay_expired`, 'secret') }, account.cookie);
    assert.equal(retried.status, 200);
    assert.match(retried.body.message, /workspace is now active/i);
    assert.equal((await repository.get('customers', customerKey)).onboarding.workspaceUrl, 'https://erp.example.invalid/login');
    assert.equal((await repository.get('demoRequests', 'demo_expired')).status, 'converted');
  } finally {
    global.fetch = originalFetch;
    for (const [key, value] of Object.entries({ ERP_API_URL: previous.api, ERP_MARKETING_INTEGRATION_TOKEN: previous.token, ERP_LOGIN_URL: previous.login })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('an account is required before order creation and a mismatched price is rejected', async () => {
  const anonymous = await post('/api/offers/visit', {});
  assert.equal((await post('/api/purchase/order', orderBody('anonymous@example.com', 199000), anonymous.cookie)).status, 401);
  const account = await signup('identity@example.com');
  assert.equal((await post('/api/purchase/order', orderBody('identity@example.com', 1), account.cookie)).status, 409);
});
