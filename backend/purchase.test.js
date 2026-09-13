const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { signature } = require('./early-bird');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'purchase-'));
process.env.OFFER_DB_PATH = path.join(dir, 'offers.json');
process.env.RAZORPAY_KEY_ID = 'test'; process.env.RAZORPAY_KEY_SECRET = 'secret';
process.env.EARLY_BIRD_CAMPAIGN_SECRET = 'campaign'; process.env.RAZORPAY_WEBHOOK_SECRET = 'webhook';
const payments = {}; let count = 0; let refunds = 0;
require.cache[require.resolve('razorpay')] = { id: require.resolve('razorpay'), filename: require.resolve('razorpay'), loaded: true, exports: class {
  orders = { create: async data => ({ ...data, id: `order_${++count}` }) };
  payments = { fetch: async id => payments[id], refund: async id => { refunds++; payments[id].amount_refunded = payments[id].amount; return {}; } };
} };
const { app, useRepository } = require('./server');
const testRepository = require('./repository').fileRepository(process.env.OFFER_DB_PATH);
useRepository(testRepository); let server, base;
before(async () => { server = app.listen(0); await new Promise(resolve => server.once('listening', resolve)); base = `http://127.0.0.1:${server.address().port}`; });
after(async () => { await new Promise(resolve => server.close(resolve)); fs.rmSync(dir, { recursive: true, force: true }); });
async function post(route, body, cookie, headers = {}) { const res = await fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...headers }, body: JSON.stringify(body) }); const text = await res.text(); return { status: res.status, body: text.startsWith('{') ? JSON.parse(text) : text, cookie: res.headers.getSetCookie().map(c => c.split(';')[0]).join('; ') }; }
async function visit(email, login = false) {
 const v = await post('/api/offers/visit', {});
 if (!email) return v;
 const auth = await post('/api/account/' + (login ? 'login' : 'signup'), { name: 'Tester', company: 'Acme', email, password: 'Test-password-123', acceptTerms: true }, v.cookie);
 assert.ok([200, 201].includes(auth.status), JSON.stringify(auth.body));
 return auth;
}
function orderBody(email, amount) { return { plan: 'Starter', acceptConditions: true, expectedAmount: amount, customer: { name: 'Tester', email, phone: '1234567890', company: 'Acme', address: 'Road', city: 'City', state: 'State' } }; }
async function verify(order, cookie, id) { payments[id] = { order_id: order.orderId, amount: order.amount, currency: 'INR', status: 'captured' }; return post('/api/purchase/verify', { razorpay_order_id: order.orderId, razorpay_payment_id: id, razorpay_signature: signature(`${order.orderId}|${id}`, 'secret') }, cookie); }
test('anonymous visitor cannot bypass signup to create an order', async () => {
 const v = await visit(); const r = await post('/api/purchase/order', orderBody('organic@example.com', 99500), v.cookie); assert.equal(r.status, 401);
});
test('captured payment is idempotent and repeat purchases require the regular price', async () => {
 const v = await visit('paid@example.com'); const o = await post('/api/purchase/order', orderBody('paid@example.com', 99500), v.cookie); assert.equal(o.status, 201);
 assert.equal((await verify(o.body, v.cookie, 'pay_1')).body.success, true);
 assert.equal((await verify(o.body, v.cookie, 'pay_1')).body.success, true);
 const next = await post('/api/purchase/order', orderBody('paid@example.com', 99500), v.cookie); assert.equal(next.status, 409);
 const regular = await post('/api/purchase/order', orderBody('paid@example.com', 199000), v.cookie); assert.equal(regular.status, 201); assert.equal(regular.body.amount, 199000);
});
test('trial selection keeps discounted checkout eligible, including after login', async () => {
 const v = await visit('trial@example.com'); const o = await post('/api/purchase/order', orderBody('trial@example.com', 99500), v.cookie);
 await post('/api/trial/select', { acceptConditions: true }, v.cookie);
 const r = await verify(o.body, v.cookie, 'pay_trial'); assert.equal(r.status, 200); assert.equal(refunds, 0);
 const payload = { event: 'payment.captured', created_at: Math.floor(Date.now()/1000), payload: { payment: { entity: { id: 'pay_trial', order_id: o.body.orderId } } } };
 const hook = await post('/api/purchase/webhook', payload, null, { 'x-razorpay-signature': signature(JSON.stringify(payload), 'webhook') }); assert.equal(hook.status, 200); assert.equal(refunds, 0);
 const other = await visit('trial@example.com', true); assert.equal((await post('/api/purchase/order', orderBody('TRIAL@example.com', 199000), other.cookie)).status, 201);
});
test('unsigned webhook and forged payment signatures cannot confirm payment', async () => {
 assert.equal((await post('/api/purchase/webhook', { event: 'payment.captured' })).status, 401);
 assert.equal((await post('/api/purchase/verify', { razorpay_order_id: 'fake', razorpay_payment_id: 'fake', razorpay_signature: 'a'.repeat(64) })).status, 400);
});
test('an open checkout paid after 24 hours is refunded by the signed webhook', async t => {
 const realNow = Date.now();
 const v = await visit('late@example.com'); const o = await post('/api/purchase/order', orderBody('late@example.com', 99500), v.cookie);
 t.mock.method(Date, 'now', () => realNow + 86400000 + 10000);
 payments.pay_late = { order_id: o.body.orderId, amount: o.body.amount, currency: 'INR', status: 'captured' };
 const payload = { event: 'payment.captured', created_at: Math.floor(Date.now()/1000), payload: { payment: { entity: { id: 'pay_late', order_id: o.body.orderId } } } };
 const previous = refunds;
 const result = await post('/api/purchase/webhook', payload, null, { 'x-razorpay-signature': signature(JSON.stringify(payload), 'webhook') });
 assert.equal(result.status, 200); assert.equal(refunds, previous + 1);
});
test('delayed webhook honors an on-time captured payment; authorization alone never succeeds', async t => {
 const realNow = Date.now(); const v = await visit('delayed@example.com'); const o = await post('/api/purchase/order', orderBody('delayed@example.com', 99500), v.cookie);
 payments.pay_delayed = { order_id: o.body.orderId, amount: o.body.amount, currency: 'INR', status: 'authorized' };
 const body = { razorpay_order_id: o.body.orderId, razorpay_payment_id: 'pay_delayed', razorpay_signature: signature(`${o.body.orderId}|pay_delayed`, 'secret') };
 assert.equal((await post('/api/purchase/verify', body, v.cookie)).status, 409);
 payments.pay_delayed.status = 'captured';
 t.mock.method(Date, 'now', () => realNow + 86400000 + 10000);
 assert.equal((await post('/api/purchase/verify', body, v.cookie)).status, 409);
 const payload = { event: 'payment.captured', created_at: Math.floor((realNow + 1000)/1000), payload: { payment: { entity: { id: 'pay_delayed', order_id: o.body.orderId } } } };
 const previous = refunds;
 assert.equal((await post('/api/purchase/webhook', payload, null, { 'x-razorpay-signature': signature(JSON.stringify(payload), 'webhook') })).status, 200);
 assert.equal(refunds, previous);
 assert.equal((await post('/api/purchase/verify', body, v.cookie)).body.success, true);
});
test('concurrent discounted purchases settle only once and refund the second capture', async () => {
 const v = await visit('race@example.com');
 const [a, b] = await Promise.all([post('/api/purchase/order', orderBody('race@example.com', 99500), v.cookie), post('/api/purchase/order', orderBody('race@example.com', 99500), v.cookie)]);
 const previous = refunds;
 const results = await Promise.all([verify(a.body, v.cookie, 'pay_race_a'), verify(b.body, v.cookie, 'pay_race_b')]);
 assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
 assert.equal(refunds, previous + 1);
});

test('signup requires conditions; duplicate signup cannot reset deadline; login restores account', async () => {
 const data = { name: 'Tester', company: 'Acme', email: 'auth@example.com', password: 'Test-password-123' };
 assert.equal((await post('/api/account/signup', data)).status, 400);
 const a = await post('/api/account/signup', { ...data, acceptTerms: true });
 assert.equal(a.status, 201); assert.equal(a.body.signedUp, true); assert.equal(a.body.eligible, true);
 const duplicate = await post('/api/account/signup', { ...data, acceptTerms: true });
 assert.equal(duplicate.status, 409);
 assert.equal((await post('/api/account/login', { ...data, password: 'Wrong-password-123' })).status, 401);
 const login = await post('/api/account/login', data);
 assert.equal(login.status, 200); assert.equal(login.body.expiresAt, a.body.expiresAt);
 assert.equal((await post('/api/trial/select', {}, login.cookie)).status, 400);
 assert.equal((await post('/api/trial/select', { acceptConditions: true })).status, 401);
});
test('signed-in customer cannot substitute another account email or skip purchase conditions', async () => {
 const v = await visit('identity@example.com');
 assert.equal((await post('/api/purchase/order', orderBody('someone@example.com', 99500), v.cookie)).status, 400);
 const data = orderBody('identity@example.com', 99500);
 assert.equal((await post('/api/purchase/order', { ...data, acceptConditions: false }, v.cookie)).status, 400);
 assert.equal((await post('/api/purchase/order', { ...data, expectedAmount: 1 }, v.cookie)).status, 409);
});
test('invoices require a paid order and its owner; invoice is stable and escapes customer text', async () => {
 const v = await visit('invoice@example.com');
 const data = orderBody('invoice@example.com', 99500); data.customer.company = '<script>alert(1)</script>';
 const o = await post('/api/purchase/order', data, v.cookie);
 const url = base + '/api/purchase/invoice/' + o.body.orderId;
 assert.equal((await fetch(url)).status, 401);
 assert.equal((await fetch(url, { headers: { Cookie: v.cookie } })).status, 404);
 assert.equal((await verify(o.body, v.cookie, 'pay_invoice')).status, 200);
 const response = await fetch(url, { headers: { Cookie: v.cookie } });
 assert.equal(response.status, 200);
 const html = await response.text();
 assert.ok(html.includes('TEST INVOICE')); assert.ok(html.includes('&lt;script&gt;')); assert.ok(!html.includes('<script>alert'));
 const receiptUrl = base + '/api/purchase/receipt/' + o.body.orderId;
 const receipt = await (await fetch(receiptUrl, { headers: { Cookie: v.cookie } })).json();
 assert.equal(receipt.amount, 99500); assert.equal(receipt.customer.address, 'Road');
 assert.equal((await (await fetch(receiptUrl, { headers: { Cookie: v.cookie } })).json()).number, receipt.number);
 const other = await visit('paid@example.com', true);
 assert.equal((await fetch(url, { headers: { Cookie: other.cookie } })).status, 404);
});

test('visits and login preserve the window; expired accounts cannot order at a discount', async t => {
 const v = await visit('expiry@example.com');
 const repeated = await post('/api/offers/visit', {}, v.cookie);
 assert.equal(repeated.body.expiresAt, v.body.expiresAt);
 t.mock.method(Date, 'now', () => v.body.expiresAt);
 const status = await post('/api/offers/visit', {}, v.cookie);
 assert.equal(status.body.eligible, false);
 assert.equal(status.body.expiresAt, v.body.expiresAt);
 assert.equal((await post('/api/purchase/order', orderBody('expiry@example.com', 99500), v.cookie)).status, 409);
 assert.equal((await post('/api/purchase/order', orderBody('expiry@example.com', 199000), v.cookie)).status, 201);
 const loggedIn = await visit('expiry@example.com', true);
 assert.equal(loggedIn.body.expiresAt, v.body.expiresAt);
 assert.equal(loggedIn.body.eligible, false);
});

test('admin customer pricing is enforced by quotes, order validation and captured payment verification', async () => {
 const email='custom-price@example.com',customerKey=require('./account-service').keyFor(email);
 const v=await visit(email);
 await testRepository.put('admins','pricing-admin',{email:'admin@example.invalid',roles:['superadmin']});
 const token='f'.repeat(64);
 await testRepository.put('sessions',require('./account-service').keyFor(token),{adminKey:'pricing-admin',expiresAt:Date.now()+60000});
 const response=await fetch(base+'/api/admin/customers/'+email+'/pricing/Starter',{method:'PUT',headers:{'Content-Type':'application/json',Cookie:'loomiq_admin_session='+token},body:JSON.stringify({amount:800.25,reason:'Agreed customer price',revision:0})});
 assert.equal(response.status,200);
 assert.equal((await post('/api/purchase/quote',{plan:'Starter'},v.cookie)).body.amount,80025);
 assert.equal((await post('/api/purchase/order',orderBody(email,99500),v.cookie)).status,409);
 const order=await post('/api/purchase/order',orderBody(email,80025),v.cookie);assert.equal(order.status,201);assert.equal(order.body.amount,80025);
 assert.equal((await testRepository.get('orders',order.body.orderId)).discounted,false);
 assert.equal((await verify(order.body,v.cookie,'pay_customer')).status,200);
 assert.equal((await testRepository.get('customers',customerKey)).paidOrder,order.body.orderId);
});

test('conversion claims require ownership, consent, and real captured payment; claims are atomic', async () => {
 const v = await visit('conversion@example.com');
 const o = await post('/api/purchase/order', orderBody('conversion@example.com',99500),v.cookie);
 const route = '/api/purchase/conversion/' + o.body.orderId;
 assert.equal((await post(route,{consent:true})).status,401);
 assert.equal((await post(route,{consent:false},v.cookie)).status,400);
 assert.equal((await post(route,{consent:true},v.cookie)).body.conversion,null);
 await verify(o.body,v.cookie,'pay_conversion');
 assert.equal((await post(route,{consent:true},v.cookie)).body.conversion,null); // test payments excluded
 await testRepository.transaction(async tx => { const order=await tx.get('orders',o.body.orderId); order.testMode=false;await tx.put('orders',order.id,order); });
 const other = await visit('not-owner@example.com');
 assert.equal((await post(route,{consent:true},other.cookie)).body.conversion,null);
 const claims=await Promise.all([post(route,{consent:true},v.cookie),post(route,{consent:true},v.cookie)]);
 const accepted=claims.map(r=>r.body.conversion).filter(Boolean);
 assert.equal(accepted.length,1);assert.equal(accepted[0].amount,99500);assert.equal(accepted[0].eventId,'purchase_'+o.body.orderId);
 assert.equal((await post(route,{consent:true},v.cookie)).body.conversion,null);
});
