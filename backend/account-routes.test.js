const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { keyFor } = require('./account-service');
const { fileRepository } = require('./repository');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'loomiq-account-'));
process.env.OFFER_DB_PATH = path.join(dir, 'offers.json');
process.env.ADMIN_API_TOKEN = 'test-operator-token';
process.env.SMTP_HOST = 'test.invalid'; process.env.SMTP_USER = 'test'; process.env.SMTP_PASS = 'test';
process.env.PUBLIC_SITE_URL = 'https://example.invalid/';
const messages = [];
let rejectMail = false;
require.cache[require.resolve('./mail')] = { id: require.resolve('./mail'), filename: require.resolve('./mail'), loaded: true, exports: { mailConfigured: () => true, sendMail: async message => { if (rejectMail) throw new Error('SMTP rejected email'); messages.push(message); } } };
const { app, useRepository } = require('./server');
const repo = fileRepository(process.env.OFFER_DB_PATH);
useRepository(repo);
let server, base;
before(async () => { server = app.listen(0); await new Promise(resolve => server.once('listening', resolve)); base = `http://127.0.0.1:${server.address().port}`; });
after(async () => { await new Promise(resolve => server.close(resolve)); fs.rmSync(dir, { recursive: true, force: true }); });
async function request(route, body, cookie = '', headers = {}) {
  const response = await fetch(base + '/api/' + route, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie, ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, data: await response.json().catch(() => null), cookie: response.headers.getSetCookie().map(c => c.split(';')[0]).join('; ') };
}
const credentials = { name: 'Account Test', company: 'Test Company', email: 'account@example.invalid', password: 'Testing-password-123', acceptTerms: true };
let cookie;
test('account data requires a session; logout revokes it on the server', async () => {
  assert.equal((await request('account/me')).status, 401);
  const signup = await request('account/signup', credentials); assert.equal(signup.status, 201); cookie = signup.cookie;
  const me = await request('account/me', undefined, cookie);
  assert.equal(me.data.customer.email, credentials.email); assert.equal(me.data.emailVerified, false);
  assert.equal(JSON.stringify(me.data).includes('passwordHash'), false);
  assert.equal((await request('account/logout', {}, cookie)).status, 200);
  assert.equal((await request('account/me', undefined, cookie)).status, 401);
  cookie = (await request('account/login', credentials)).cookie;
});
test('reset links are hashed, expire, are single-use and invalidate prior sessions', async () => {
  const missing = await request('account/forgot-password', { email: 'missing@example.invalid' });
  assert.equal(missing.status, 404);
  assert.equal(missing.data.message, 'No account exists with this email address. Please sign up first.');
  assert.equal(messages.length, 0);
  const found = await request('account/forgot-password', { email: credentials.email });
  assert.equal(found.status, 200);
  assert.equal(found.data.message, 'Your password reset link has been sent. Check your inbox and spam folder.');
  const url = new URL(messages.at(-1).text.split('\n')[1]);
  const token = new URLSearchParams(url.hash.slice(1)).get('token');
  assert.equal(url.search, '');
  assert.equal((await repo.get('customers', keyFor(credentials.email))).passwordReset.hash, keyFor(token));
  const body = { email: credentials.email, token, password: 'Replacement-password-123' };
  assert.equal((await request('account/reset-password', { ...body, token: 'a'.repeat(64) })).status, 400);
  assert.equal((await request('account/reset-password', body)).status, 200);
  assert.equal((await request('account/me', undefined, cookie)).status, 401);
  assert.equal((await request('account/reset-password', body)).status, 400);
  assert.equal((await request('account/login', credentials)).status, 401);
  credentials.password = body.password;
  cookie = (await request('account/login', credentials)).cookie;
  await repo.transaction(async tx => { const c = await tx.get('customers', keyFor(credentials.email)); c.passwordReset = { hash: keyFor(token), expiresAt: 0 }; await tx.put('customers', keyFor(credentials.email), c); });
  assert.equal((await request('account/reset-password', body)).status, 400);
});
test('email verification needs a valid single-use token', async () => {
  assert.equal((await request('account/send-verification', {})).status, 401);
  assert.equal((await request('account/send-verification', {}, cookie)).status, 200);
  const url = new URL(messages.at(-1).text.split('\n')[1]);
  const body = Object.fromEntries(new URLSearchParams(url.hash.slice(1)));
  assert.equal((await request('account/verify-email', { ...body, email: 'other@example.invalid' })).status, 400);
  assert.equal((await request('account/verify-email', body)).status, 200);
  assert.equal((await request('account/verify-email', body)).status, 400);
  assert.equal((await request('account/me', undefined, cookie)).data.emailVerified, true);
});
test('only operators can activate requested workspaces, and unsafe URLs are rejected', async () => {
  const body = { email: credentials.email, status: 'active', workspaceUrl: 'https://workspace.example.invalid/' };
  assert.equal((await request('operator/onboarding', body, cookie)).status, 403);
  await request('trial/select', { acceptConditions: true }, cookie);
  const headers = { Authorization: 'Bearer test-operator-token' };
  assert.equal((await request('operator/onboarding', { ...body, workspaceUrl: 'javascript:alert(1)' }, '', headers)).status, 400);
  assert.equal((await request('operator/onboarding', body, '', headers)).status, 200);
  assert.equal((await request('account/me', undefined, cookie)).data.workspaceUrl, body.workspaceUrl);
});
test('invoice emails require ownership and confirmed payments', async () => {
  await repo.transaction(tx => tx.put('orders', 'foreign', { status: 'paid', customerKey: keyFor('other@example.invalid'), invoice: {} }));
  assert.equal((await request('account/invoices/foreign/email', {}, cookie)).status, 404);
  assert.equal((await request('account/invoices/missing/email', {}, cookie)).status, 404);
  const invoice = { number: 'LIQ-TEST', orderId: 'owned', plan: 'Starter', amount: 99500, issuedAt: Date.now(), testMode: true, customer: { name: 'Tester', email: credentials.email }, seller: { name: 'LoomIQ', email: 'support@example.invalid' }, description: 'Test membership' };
  await repo.transaction(tx => tx.put('orders', 'owned', { status: 'paid', customerKey: keyFor(credentials.email), invoice }));
  assert.equal((await request('account/invoices/owned/email', {}, cookie)).status, 200);
  assert.equal(messages.at(-1).to, credentials.email);
  assert.match(messages.at(-1).attachments[0].content, /TEST INVOICE/);
});
test('account invoice history includes legacy paid orders and stays scoped to the owner', async () => {
  await repo.transaction(tx => tx.put('orders', 'legacy-paid', { status: 'paid', customerKey: keyFor(credentials.email), plan: 'Starter', amount: 99500, paidAt: Date.now(), paymentId: 'pay_legacy', testMode: true }));
  const me = await request('account/me', undefined, cookie);
  assert.equal(me.status, 200);
  assert.ok(me.data.invoices.some(i => i.orderId === 'legacy-paid'));
  assert.equal(me.data.invoices.some(i => i.orderId === 'foreign'), false);
  assert.ok((await repo.get('orders', 'legacy-paid')).invoice);
});
test('a reset email delivery failure returns an error instead of success', async () => {
  rejectMail = true;
  const count = messages.length;
  try {
    const result = await request('account/forgot-password', { email: credentials.email });
    assert.equal(result.status, 502);
    assert.equal(result.data.message, 'We could not send your reset email. Please try again shortly.');
    assert.equal(messages.length, count);
  } finally { rejectMail = false; }
});
