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
process.env.ACCOUNT_NOTIFICATION_EMAIL = 'owner@example.invalid';
process.env.PUBLIC_SITE_URL = 'https://example.invalid/';
const messages = [];
let rejectMail = false;
let rejectedRecipient;
require.cache[require.resolve('./mail')] = { id: require.resolve('./mail'), filename: require.resolve('./mail'), loaded: true, exports: { mailConfigured: () => true, sendMail: async message => { if (rejectMail || message.to === rejectedRecipient) throw new Error('SMTP rejected email'); messages.push(message); } } };
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
const credentials = { name: 'Account Test', company: 'Test Company', phone: '+91 9876543210', address: '10 Loom Street', city: 'Surat', state: 'Gujarat', email: 'account@example.invalid', password: 'Testing-password-123', acceptTerms: true };
test('internal notification failure does not report verification failure', async () => {
  rejectedRecipient = 'owner@example.invalid';
  try {
    const result = await request('account/signup', { ...credentials, email: 'notification-failure@example.invalid' });
    assert.equal(result.status, 201);
    assert.ok(messages.some(message => message.to === 'notification-failure@example.invalid'));
    assert.equal((await request('account/me', undefined, result.cookie)).status, 200);
  } finally { rejectedRecipient = undefined; }
});

test('verification delivery failure preserves the account and allows resending', async () => {
  const email = 'verification-failure@example.invalid';
  rejectedRecipient = email;
  let result;
  try {
    result = await request('account/signup', { ...credentials, email });
    assert.equal(result.status, 502);
    assert.match(result.data.message, /request another code/);
    assert.equal((await request('account/me', undefined, result.cookie)).status, 200);
  } finally { rejectedRecipient = undefined; }
  assert.equal((await request('account/send-verification', {}, result.cookie)).status, 200);
  assert.equal(messages.at(-1).to, email);
});

test('resend reports email failure without a misleading storage error', async () => {
  const email = 'resend-failure@example.invalid';
  const result = await request('account/signup', { ...credentials, email });
  assert.equal(result.status, 201);
  rejectedRecipient = email;
  try {
    const resend = await request('account/send-verification', {}, result.cookie);
    assert.equal(resend.status, 502);
    assert.match(resend.data.message, /could not send your verification code/);
    assert.doesNotMatch(resend.data.message, /save or retrieve/);
  } finally { rejectedRecipient = undefined; }
});

test('signup notification includes the company contact and address details', async () => {
  const email = 'full-details@example.invalid';
  const result = await request('account/signup', { ...credentials, email });
  assert.equal(result.status, 201);
  const notification = messages.find(message => message.to === 'owner@example.invalid' && message.replyTo === email);
  assert.match(notification.text, /Phone: \+919876543210/);
  assert.match(notification.text, /Address: 10 Loom Street/);
  assert.match(notification.text, /City: Surat/);
  assert.match(notification.text, /State: Gujarat/);
});
