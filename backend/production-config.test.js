const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateProduction } = require('./production-config');
const valid = { NODE_ENV: 'production', PUBLIC_SITE_URL: 'https://example.invalid/', FRONTEND_ORIGIN: 'https://example.invalid', ADMIN_API_TOKEN: 'a'.repeat(32), SMTP_HOST: 'smtp.invalid', SMTP_USER: 'user', SMTP_PASS: 'secret', SALES_EMAIL: 'ops@example.invalid', INVOICE_BUSINESS_NAME: 'Example', INVOICE_BUSINESS_ADDRESS: 'Example address', RAZORPAY_KEY_ID: 'rzp_live_example', RAZORPAY_KEY_SECRET: 'secret', RAZORPAY_WEBHOOK_SECRET: 'secret', MONGODB_HOST: 'cluster.invalid' };
test('production rejects incomplete settings, test payments and unsafe origin/storage', () => {
  assert.doesNotThrow(() => validateProduction(valid));
  assert.throws(() => validateProduction({ NODE_ENV: 'production' }), /Missing production/);
  assert.throws(() => validateProduction({ ...valid, RAZORPAY_KEY_ID: 'rzp_test_example' }), /live Razorpay/);
  assert.doesNotThrow(() => validateProduction({ ...valid, RAZORPAY_KEY_ID: 'rzp_test_example', ALLOW_TEST_PAYMENTS: 'true' }));
  assert.throws(() => validateProduction({ ...valid, FRONTEND_ORIGIN: 'https://other.invalid' }), /matching/);
  assert.throws(() => validateProduction({ ...valid, STORAGE_DRIVER: 'file' }), /MongoDB/);
});
