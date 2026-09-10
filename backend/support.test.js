const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const nodemailer = require('nodemailer');
const { registerSupport } = require('./support');
test('support validates input, reports unavailable SMTP, delivers and handles rejection', async t => {
  const messages = [];
  let reject = false;
  t.mock.method(nodemailer, 'createTransport', () => ({ sendMail: async message => { messages.push(message); return { accepted: reject ? [] : ['support@example.invalid'] }; } }));
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
