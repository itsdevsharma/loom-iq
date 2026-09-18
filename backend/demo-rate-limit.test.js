const { test, after } = require('node:test');
const assert = require('node:assert/strict');
process.env.RENDER = 'true';
delete process.env.TRUST_PROXY_HOPS;
const { app } = require('./server');
const server = app.listen(0);
after(() => new Promise(resolve => server.close(resolve)));
async function post(ip, body = {}) {
  return fetch(`http://127.0.0.1:${server.address().port}/api/demo-requests`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip }, body: JSON.stringify(body),
  });
}
test('Render visitors have separate quotas; verification does not consume code requests', async () => {
  assert.equal(app.get('trust proxy'), 1);
  for (let i = 0; i < 5; i++) assert.equal((await post('198.51.100.10')).status, 400);
  const blocked = await post('198.51.100.10');
  assert.equal(blocked.status, 429);
  const body = await blocked.json();
  assert.ok(body.retryAfter > 0);
  assert.equal(Number(blocked.headers.get('retry-after')), body.retryAfter);
  assert.equal((await post('198.51.100.11')).status, 400);
  assert.equal((await post('198.51.100.10', { action: 'verify' })).status, 400);
  // A forged leftmost value must not change the identity behind the nearest proxy.
  assert.equal((await post('203.0.113.1, 198.51.100.10')).status, 429);
});
