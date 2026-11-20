const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const nodemailer = require('nodemailer');
const { registerSupport } = require('./support');
test('support validates input, reports unavailable SMTP, delivers and handles rejection', async t => {
  const messages = [];
  let reject = false;
  t.mock.method(nodemailer, 'createTransport', () => ({ sendMail: async message => { messages.push(message); return { accepted: reject ? [] : ['support@example.invalid'] }; }, close() {} }));
  Object.assign(process.env, { SALES_EMAIL: 'support@example.invalid', SMTP_HOST: 'smtp.invalid', SMTP_USER: 'test', SMTP_PASS: 'test' });
  const app = express(); app.use(express.json()); registerSupport(app, (_req, _res, next) => next());
  const server = app.listen(0); await new Promise(resolve => server.once('listening', resolve));
  try {
    const body = { name: 'Test User', email: 'test@example.invalid', subject: 'Account help', message: 'Please help me access my account.' };
    const post = data => fetch(`http://127.0.0.1:${server.address().port}/api/support`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    assert.equal((await post({ ...body, subject: 'Header\r\nInjected: value' })).status, 400);
    assert.equal((await post(body)).status, 200);
    assert.equal(messages[0].replyTo, body.email);
    reject = true; assert.equal((await post(body)).status, 502);
    process.env.SMTP_PASS = ''; assert.equal((await post(body)).status, 503);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('phone consultation validates, persists attribution and survives notification failure', async t => {
  const rows = new Map();
  const store = { transaction: async action => action({ put: async (collection, id, row) => { assert.equal(collection, 'supportRequests'); rows.set(id, row); } }) };
  t.mock.method(nodemailer, 'createTransport', () => ({ sendMail: async () => { throw new Error('offline'); }, close() {} }));
  Object.assign(process.env, { SALES_EMAIL: 'support@example.invalid', SMTP_HOST: 'smtp.invalid', SMTP_USER: 'test', SMTP_PASS: 'test' });
  const app = express(); app.use(express.json()); registerSupport(app, (_req, _res, next) => next(), () => store);
  const server = app.listen(0); await new Promise(resolve => server.once('listening', resolve));
  const body = { name: 'Sales Enquiry', phone: '+91 82220 88524', service: 'Google Ads Management', business: '', sourcePage: '/services/google-ads?email=private', attribution: { utm_source: 'search', arbitrary: 'discard' } };
  const post = data => fetch(`http://127.0.0.1:${server.address().port}/api/consultations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  try {
    for (const invalid of [{ phone: 'invalid number' }, { phone: '123' }, { service: 'Invented Service' }, { name: 'A' }, { website: 'spam.example' }]) assert.equal((await post({ ...body, ...invalid })).status, 400);
    assert.equal(rows.size, 0);
    assert.equal((await post(body)).status, 201);
    const row = [...rows.values()][0];
    assert.equal(row.kind, 'consultation'); assert.equal(row.phone, body.phone); assert.equal(row.email, ''); assert.equal(row.status, 'new');
    assert.equal(row.sourcePage, '/'); assert.deepEqual(row.attribution, { utm_source: 'search' });
    store.transaction = async () => { throw new Error('storage offline'); };
    assert.equal((await post(body)).status, 503);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
