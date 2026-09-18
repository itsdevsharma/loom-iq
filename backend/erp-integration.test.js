const { test } = require('node:test');
const assert = require('node:assert/strict');
const integration = require('./erp-integration');

test('ERP failures preserve throttling and reject unsuccessful HTTP 200 responses', async t => {
  const previous = { url: process.env.ERP_API_URL, token: process.env.ERP_MARKETING_INTEGRATION_TOKEN };
  process.env.ERP_API_URL = 'https://erp.example.invalid';
  process.env.ERP_MARKETING_INTEGRATION_TOKEN = 'test';
  t.after(() => {
    for (const [key, value] of Object.entries({ ERP_API_URL: previous.url, ERP_MARKETING_INTEGRATION_TOKEN: previous.token })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  const stub = t.mock.method(global, 'fetch');
  stub.mock.mockImplementation(async () => new Response('Too many requests', { status: 429, headers: { 'Retry-After': '120' } }));
  await assert.rejects(integration.startDemo({}), e => e.status === 429 && e.retryAfter === 120 && /too many requests/.test(e.message));
  stub.mock.mockImplementation(async () => new Response('{}', { status: 429, headers: { 'Retry-After': new Date(Date.now() + 120000).toUTCString() } }));
  await assert.rejects(integration.verifyDemo({}), e => e.status === 429 && e.retryAfter >= 119 && e.retryAfter <= 120);
  stub.mock.mockImplementation(async () => new Response(JSON.stringify({ success: false, message: 'Wait for your network limit to reset.' }), { status: 429 }));
  await assert.rejects(integration.startDemo({}), e => e.status === 429 && e.retryAfter === undefined && e.message === 'Wait for your network limit to reset.');
  stub.mock.mockImplementation(async () => new Response('null', { status: 200 }));
  await assert.rejects(integration.startDemo({}), e => e.status === 502);
});
