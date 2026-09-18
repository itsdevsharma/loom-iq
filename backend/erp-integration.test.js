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

test('ERP routing and connection failures have safe diagnostics and never follow redirects', async t => {
  const previous = { url: process.env.ERP_API_URL, token: process.env.ERP_MARKETING_INTEGRATION_TOKEN };
  process.env.ERP_API_URL = 'https://erp.example.invalid';
  process.env.ERP_MARKETING_INTEGRATION_TOKEN = 'secret-integration-token';
  t.after(() => {
    for (const [key, value] of Object.entries({ ERP_API_URL: previous.url, ERP_MARKETING_INTEGRATION_TOKEN: previous.token })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  const logs = [];
  t.mock.method(console, 'error', (...args) => logs.push(args));
  const stub = t.mock.method(global, 'fetch', async (_url, options) => {
    assert.equal(options.redirect, 'manual');
    return new Response('<html>Login</html>', { status: 200, headers: { 'Content-Type': 'text/html' } });
  });
  await assert.rejects(integration.startDemo({ email: 'private@example.invalid' }), e => e.status === 502 && e.code === 'ERP_INVALID_RESPONSE');
  assert.equal(logs[0][1].upstreamStatus, 200);
  assert.equal(logs[0][1].contentType, 'text/html');
  stub.mock.mockImplementation(async () => new Response('', { status: 302, headers: { Location: 'https://other.example.invalid/' } }));
  await assert.rejects(integration.startDemo({}), e => e.status === 502 && e.code === 'ERP_REDIRECT');
  stub.mock.mockImplementation(async () => { throw new TypeError('fetch failed', { cause: { code: 'ENOTFOUND' } }); });
  await assert.rejects(integration.startDemo({}), e => e.status === 502 && e.code === 'ERP_CONNECTION_FAILED');
  assert.equal(logs.at(-1)[1].networkCode, 'ENOTFOUND');
  stub.mock.mockImplementation(async () => { throw Object.assign(new Error('aborted'), { name: 'AbortError' }); });
  await assert.rejects(integration.startDemo({}), e => e.status === 504 && e.code === 'ERP_TIMEOUT');
  assert.doesNotMatch(JSON.stringify(logs), /secret-integration-token|private@example|<html>/);
});
