const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { fileRepository } = require('./repository');
const { keyFor } = require('./account-service');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'offer-status-'));
process.env.OFFER_DB_PATH = path.join(dir, 'offers.json');
const { app, useRepository } = require('./server');

// Counts write transactions so the tests can prove that a settled visitor and
// a returning customer never pay for a write on a page load.
const base = fileRepository(process.env.OFFER_DB_PATH);
const writes = { transactions: 0 };
useRepository({
  ...base,
  transaction(work) { writes.transactions++; return base.transaction(work); },
});

let server, url;
before(async () => { server = app.listen(0); await new Promise(resolve => server.once('listening', resolve)); url = `http://127.0.0.1:${server.address().port}`; });
after(async () => { await new Promise(resolve => server.close(resolve)); fs.rmSync(dir, { recursive: true, force: true }); });

async function post(route, body, cookie) {
  const response = await fetch(url + route, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : {}, cookie: response.headers.getSetCookie().map(item => item.split(';')[0]).join('; ') };
}
async function get(route, cookie) {
  const response = await fetch(url + route, { headers: cookie ? { Cookie: cookie } : {} });
  return { status: response.status, body: await response.json() };
}

test('a first visit stores the campaign start and returns the launch offer', async () => {
  writes.transactions = 0;
  const visit = await post('/api/offers/visit', {});
  assert.equal(visit.status, 200);
  assert.equal(visit.body.eligible, true);
  assert.equal(visit.body.policy, 'launch');
  assert.equal(visit.body.signedUp, false);
  assert.match(visit.cookie, /^loomiq_visitor=[a-f0-9]{64}$/);
  assert.equal(writes.transactions, 1);
  const visitorId = visit.cookie.split('=')[1];
  assert.ok((await base.get('visitors', visitorId)).offerStartedAt > 0);
});

test('a settled visitor is served without any further write transaction', async () => {
  const visit = await post('/api/offers/visit', {});
  const visitorId = visit.cookie.split('=')[1];
  const started = (await base.get('visitors', visitorId)).offerStartedAt;

  writes.transactions = 0;
  const again = await post('/api/offers/visit', {}, visit.cookie);
  assert.equal(again.body.eligible, true);
  assert.equal(writes.transactions, 0);
  const status = await get('/api/offers/status', visit.cookie);
  assert.equal(status.status, 200);
  assert.equal(status.body.signedUp, false);
  assert.equal(writes.transactions, 0);
  assert.equal((await base.get('visitors', visitorId)).offerStartedAt, started);
});

test('a signed-in customer keeps the account campaign start and joins it from the visitor', async () => {
  const email = 'returning@example.com';
  const customerKey = keyFor(email);
  const visitorId = crypto.randomBytes(32).toString('hex');
  const token = crypto.randomBytes(32).toString('hex');
  await base.put('customers', customerKey, { name: 'Returning', email, company: 'Acme', startedAt: 1, trialAt: null, paidOrder: null, offerStartedAt: 1_600_000_000_000 });
  await base.put('visitors', visitorId, { startedAt: null, trialAt: null, offerStartedAt: 1_700_000_000_000 });
  await base.put('sessions', keyFor(token), { customerKey, visitorId, expiresAt: Date.now() + 3_600_000 });
  const cookie = `loomiq_visitor=${visitorId}; loomiq_session=${token}`;

  writes.transactions = 0;
  const first = await post('/api/offers/visit', {}, cookie);
  assert.equal(first.body.signedUp, true);
  assert.equal(first.body.customer.email, email);
  assert.equal(writes.transactions, 1);
  // The account keeps its own start; the visitor is aligned to it.
  assert.equal((await base.get('customers', customerKey)).offerStartedAt, 1_600_000_000_000);
  assert.equal((await base.get('visitors', visitorId)).offerStartedAt, 1_600_000_000_000);

  writes.transactions = 0;
  const second = await get('/api/offers/status', cookie);
  assert.equal(second.body.customer.email, email);
  assert.equal(writes.transactions, 0);
});

test('an unknown visitor id is replaced with a fresh visitor instead of being written under the stale id', async () => {
  const missing = crypto.randomBytes(32).toString('hex');
  writes.transactions = 0;
  const visit = await post('/api/offers/visit', {}, `loomiq_visitor=${missing}`);
  assert.equal(visit.body.eligible, true);
  assert.equal(visit.body.signedUp, false);
  assert.equal(writes.transactions, 1);
  const issued = visit.cookie.split('=')[1];
  assert.notEqual(issued, missing);
  assert.equal(await base.get('visitors', missing), null);
  assert.ok((await base.get('visitors', issued)).offerStartedAt > 0);
});
