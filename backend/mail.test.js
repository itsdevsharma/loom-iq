const { test } = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');
const { sendMail } = require('./mail');
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
