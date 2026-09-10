// Isolated test fixture: no real database, email, or payment connections.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRequire } = require('node:module');
const backend = createRequire(path.resolve(__dirname, '../../backend/server.js'));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'loomiq-browser-'));
Object.assign(process.env, { SMTP_HOST: 'smtp.test.invalid', SMTP_USER: 'test', SMTP_PASS: 'test' });
Object.assign(process.env, { NODE_ENV: 'test', PORT: '3101', STORAGE_DRIVER: 'file', SERVE_FRONTEND: 'true', OFFER_DB_PATH: path.join(dir, 'offers.json'), FRONTEND_ORIGIN: 'http://127.0.0.1:3101', PUBLIC_SITE_URL: 'http://127.0.0.1:3101/', SALES_EMAIL: '', EMAIL_API_KEY: '', RAZORPAY_KEY_ID: 'rzp_test_browser', RAZORPAY_KEY_SECRET: 'browser-secret', RAZORPAY_WEBHOOK_SECRET: 'browser-webhook', ADMIN_API_TOKEN: 'browser-operator' });
backend.cache[backend.resolve('nodemailer')] = { exports: { createTransport: () => ({ sendMail: async () => ({ accepted: ['test@example.invalid'] }), close() {} }) } };
backend.cache[backend.resolve('razorpay')] = { exports: class { orders = { create: async data => ({ ...data, id: 'order_browser' }) }; payments = { fetch: async () => ({ order_id: 'order_browser', amount: 99500, currency: 'INR', status: 'captured' }) }; } };
const { app } = backend('./server');
const server = app.listen(3101, '127.0.0.1');
function close() { server.close(() => { fs.rmSync(dir, { recursive: true, force: true }); process.exit(0); }); }
process.once('SIGINT', close); process.once('SIGTERM', close);
