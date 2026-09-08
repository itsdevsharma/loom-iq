// Tunnel only the Razorpay webhook, keeping account and billing APIs local.
const http = require('node:http');
http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/api/purchase/webhook') {
    res.writeHead(404); res.end('Not found'); return;
  }
  const upstream = http.request({ hostname: '127.0.0.1', port: 3001, path: req.url, method: 'POST', headers: { 'content-type': 'application/json', ...(req.headers['x-razorpay-signature'] ? { 'x-razorpay-signature': req.headers['x-razorpay-signature'] } : {}) }, timeout: 15000 }, reply => {
    res.writeHead(reply.statusCode, { 'content-type': reply.headers['content-type'] || 'text/plain' });
    reply.pipe(res);
  });
  let size = 0;
  req.on('data', chunk => { size += chunk.length; if (size > 20480) { upstream.destroy(); if (!res.headersSent) res.writeHead(413); res.end(); } });
  upstream.on('timeout', () => upstream.destroy());
  upstream.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end('Webhook backend unavailable'); });
  req.pipe(upstream);
}).listen(3002, '127.0.0.1', () => console.log('Webhook proxy listening on 127.0.0.1:3002'));
