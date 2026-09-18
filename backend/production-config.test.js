const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateProduction } = require('./production-config');
const valid = { NODE_ENV: 'production', PUBLIC_SITE_URL: 'https://example.invalid/', FRONTEND_ORIGIN: 'https://example.invalid', ADMIN_API_TOKEN: 'a'.repeat(32), SMTP_HOST: 'smtp.invalid', SMTP_USER: 'user', SMTP_PASS: 'secret', SALES_EMAIL: 'ops@example.invalid', INVOICE_BUSINESS_NAME: 'Example', INVOICE_BUSINESS_ADDRESS: 'Example address', RAZORPAY_KEY_ID: 'rzp_live_example', RAZORPAY_KEY_SECRET: 'secret', RAZORPAY_WEBHOOK_SECRET: 'secret', MONGODB_HOST: 'cluster.invalid', ERP_API_URL: 'https://erp-api.example.invalid', ERP_LOGIN_URL: 'https://erp.example.invalid/login', ERP_MARKETING_INTEGRATION_TOKEN: 'b'.repeat(32) };
test('production rejects incomplete settings, test payments and unsafe origin/storage', () => {
  assert.doesNotThrow(() => validateProduction(valid));
  assert.throws(() => validateProduction({ NODE_ENV: 'production' }), /Missing production/);
  assert.throws(() => validateProduction({ ...valid, RAZORPAY_KEY_ID: 'rzp_test_example' }), /live Razorpay/);
  assert.doesNotThrow(() => validateProduction({ ...valid, RAZORPAY_KEY_ID: 'rzp_test_example', ALLOW_TEST_PAYMENTS: 'true' }));
  assert.throws(() => validateProduction({ ...valid, FRONTEND_ORIGIN: 'https://other.invalid' }), /matching/);
  assert.throws(() => validateProduction({ ...valid, ERP_LOGIN_URL: 'http://erp.example.invalid/login' }), /ERP_LOGIN_URL/);
  assert.throws(() => validateProduction({ ...valid, STORAGE_DRIVER: 'file' }), /MongoDB/);
});

test('production accepts HTTPS email without SMTP and rejects incomplete provider settings', () => {
  const env = { ...valid, MAIL_PROVIDER: 'resend', RESEND_API_KEY: 're_test', EMAIL_FROM: 'LoomIQ <mail@example.invalid>' };
  delete env.SMTP_HOST; delete env.SMTP_USER; delete env.SMTP_PASS;
  assert.doesNotThrow(() => validateProduction(env));
  assert.throws(() => validateProduction({ ...env, RESEND_API_KEY: '' }), /RESEND_API_KEY/);
  assert.throws(() => validateProduction({ ...env, EMAIL_FROM: '' }), /EMAIL_FROM/);
  assert.throws(() => validateProduction({ ...env, MAIL_PROVIDER: 'unknown' }), /MAIL_PROVIDER/);
});
