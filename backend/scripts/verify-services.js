// Read-only connection checks; sends no emails and creates no payment orders.
require('dotenv').config({ path: require('node:path').join(__dirname, '../.env'), quiet: true });
const { connectDatabase, closeDatabase } = require('../database');
async function check(name, work) {
  try { await work(); console.log(name + ': connection verified'); }
  catch { console.error(name + ': verification failed; check service configuration and connectivity'); process.exitCode = 1; }
}
async function main() {
  await check('MongoDB', async () => { try { await connectDatabase(); } finally { await closeDatabase(); } });
  await check('SMTP', async () => {
    const e = process.env;
    if (!e.SMTP_HOST || !e.SMTP_USER || !e.SMTP_PASS) throw new Error('Missing SMTP');
    const transport = require('nodemailer').createTransport({ host: e.SMTP_HOST, port: Number(e.SMTP_PORT || 587), secure: e.SMTP_SECURE === 'true', auth: { user: e.SMTP_USER, pass: e.SMTP_PASS }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 10000 });
    try { await transport.verify(); } finally { transport.close(); }
  });
  await check('Razorpay (' + (process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? 'live' : 'test') + ')', async () => {
    const gateway = new (require('razorpay'))({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET, timeout: 10000 });
    await gateway.orders.all({ count: 1 });
  });
}
main().catch(() => { console.error('Service verification could not finish.'); process.exitCode = 1; });
