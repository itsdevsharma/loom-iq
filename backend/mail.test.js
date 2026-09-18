const { test } = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');
const { sendMail } = require('./mail');
function resendEnv(t) {
  const values = { MAIL_PROVIDER: 'resend', RESEND_API_KEY: 're_private_test', EMAIL_FROM: 'LoomIQ <mail@example.invalid>' };
  const previous = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  Object.assign(process.env, values);
  t.after(() => { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
}
test('HTTPS email preserves reply-to and PDF attachments without using SMTP', async t => {
  resendEnv(t);
  t.mock.method(nodemailer, 'createTransport', () => { throw new Error('SMTP must not be used'); });
  let calls = 0;
  t.mock.method(global, 'fetch', async (url, options) => {
    calls++;
    assert.equal(url, 'https://api.resend.com/emails');
    assert.equal(options.headers.Authorization, 'Bearer re_private_test');
    assert.equal(options.redirect, 'error');
    assert.ok(options.signal);
    const body = JSON.parse(options.body);
    assert.deepEqual(body.to, ['test@example.invalid']);
    assert.equal(body.reply_to, 'reply@example.invalid');
    assert.equal(body.text, 'Verification code: 123456');
    assert.equal(Buffer.from(body.attachments[0].content, 'base64').toString(), '%PDF-test');
    assert.equal(body.attachments[0].content_type, 'application/pdf');
    return new Response(JSON.stringify({ id: 'email_test' }), { status: 200 });
  });
  await sendMail({ to: 'test@example.invalid', replyTo: 'reply@example.invalid', subject: 'Test', text: 'Verification code: 123456', attachments: [{ filename: 'invoice.pdf', content: Buffer.from('%PDF-test'), contentType: 'application/pdf' }] });
  assert.equal(calls, 1);
});
test('HTTPS failures are sanitized and never retry or fall back to SMTP', async t => {
  resendEnv(t);
  const logs = [];
  t.mock.method(console, 'error', (...args) => logs.push(args));
  t.mock.method(nodemailer, 'createTransport', () => { throw new Error('Unexpected SMTP fallback'); });
  const mock = t.mock.method(global, 'fetch');
  for (const status of [401, 403, 429, 500, 200]) {
    mock.mock.mockImplementation(async () => new Response(JSON.stringify({ message: 'private recipient and secret' }), { status }));
    await assert.rejects(sendMail({ to: 'test@example.invalid', text: '123456' }), e => e.status === 502 && !e.message.includes('private'));
  }
  mock.mock.mockImplementation(async () => { throw Object.assign(new Error('private secret'), { name: 'TimeoutError' }); });
  await assert.rejects(sendMail({ to: 'test@example.invalid' }), e => e.status === 502);
  assert.equal(mock.mock.callCount(), 6);
  assert.doesNotMatch(JSON.stringify(logs), /private|secret|123456/);
  process.env.RESEND_API_KEY = '';
  await assert.rejects(sendMail({ to: 'test@example.invalid' }), e => e.status === 503);
  assert.equal(mock.mock.callCount(), 6);
});
test('mail reports provider failures and closes the transport without exposing credentials', async t => {
  Object.assign(process.env, { SMTP_HOST: 'smtp.invalid', SMTP_USER: 'test', SMTP_PASS: 'secret' });
  let closed = 0;
  t.mock.method(nodemailer, 'createTransport', () => ({ sendMail: async () => { throw new Error('provider detail secret'); }, close: () => closed++ }));
  await assert.rejects(() => sendMail({ to: 'test@example.invalid', text: 'test' }), error => error.status === 502 && !error.message.includes('secret'));
  assert.equal(closed, 1);
});
test('installed mailer creates an invoice attachment without opening a network connection', async () => {
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true });
  const result = await transport.sendMail({ from: 'support@example.invalid', to: 'test@example.invalid', subject: 'Invoice', text: 'Invoice attached', attachments: [{ filename: 'invoice.html', content: '<html>Test invoice</html>' }] });
  assert.match(result.message.toString(), /filename=invoice.html/);
  transport.close();
});
