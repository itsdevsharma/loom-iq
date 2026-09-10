function validateProduction(env = process.env) {
  if (env.NODE_ENV !== 'production') return;
  const required = ['PUBLIC_SITE_URL', 'FRONTEND_ORIGIN', 'ADMIN_API_TOKEN', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SALES_EMAIL', 'INVOICE_BUSINESS_NAME', 'INVOICE_BUSINESS_ADDRESS', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'];
  const missing = required.filter(key => !env[key]);
  if (missing.length) throw new Error('Missing production settings: ' + missing.join(', '));
  const site = new URL(env.PUBLIC_SITE_URL);
  if (site.protocol !== 'https:' || site.username || site.password || site.pathname !== '/' || site.search || site.hash || site.origin !== env.FRONTEND_ORIGIN) throw new Error('Production PUBLIC_SITE_URL must be an HTTPS root URL matching FRONTEND_ORIGIN.');
  if (env.STORAGE_DRIVER === 'file' || !(env.MONGODB_URI || env.MONGODB_HOST)) throw new Error('Production requires MongoDB storage.');
  if (env.ADMIN_API_TOKEN.length < 32) throw new Error('Use an ADMIN_API_TOKEN of at least 32 characters.');
  if (!env.RAZORPAY_KEY_ID.startsWith('rzp_live_') && env.ALLOW_TEST_PAYMENTS !== 'true') throw new Error('Production requires live Razorpay keys, or ALLOW_TEST_PAYMENTS=true for staging.');
  if (env.TRUST_PROXY_HOPS && !/^[1-9]\d*$/.test(env.TRUST_PROXY_HOPS)) throw new Error('TRUST_PROXY_HOPS must be a positive integer matching your proxy setup.');
}
module.exports = { validateProduction };
