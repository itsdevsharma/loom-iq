const crypto = require('node:crypto');
const bcrypt = require('bcrypt');
const { keyFor, fail, profile } = require('./account-service');
const { sendMail, mailConfigured } = require('./mail');
const { createInvoice, renderInvoice } = require('./invoice');

function registerAccountRoutes(app, { store, account, limiter }) {
  const signedIn = async req => {
    const session = await account(req);
    if (!session) throw fail(401, 'Please sign in again.');
    return session;
  };
  app.get('/api/account/me', async (req, res) => {
    const session = await signedIn(req);
    const customer = await store().get('customers', session.customerKey);
    const orders = await store().paidOrders(session.customerKey);
    for (const order of orders) {
      if (!order.invoice) order.invoice = await store().transaction(async tx => {
        const current = await tx.get('orders', order.id);
        if (!current || current.status !== 'paid' || current.customerKey !== session.customerKey) return null;
        current.invoice ||= createInvoice(order.id, current, customer);
        await tx.put('orders', order.id, current);
        return current.invoice;
      });
    }
    res.json({ customer: profile(customer), emailVerified: Boolean(customer.emailVerifiedAt),
      trialRequested: Boolean(customer.trialRequest), onboarding: customer.onboarding?.status || (customer.trialRequest || orders.length ? 'requested' : 'not-requested'),
      workspaceUrl: customer.onboarding?.status === 'active' && /^https:\/\//.test(customer.onboarding?.workspaceUrl || '') ? customer.onboarding.workspaceUrl : null,
      invoices: orders.filter(o => o.invoice).map(o => ({ orderId: o.invoice.orderId, number: o.invoice.number, plan: o.plan, amount: o.amount, issuedAt: o.invoice.issuedAt, testMode: o.invoice.testMode })).sort((a, b) => b.issuedAt - a.issuedAt),
    });
  });
  app.post('/api/account/logout', async (req, res) => {
    const token = /(?:^|; )loomiq_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
    if (token) await store().transaction(async tx => {
      const session = await tx.get('sessions', keyFor(token));
      if (session) await tx.put('sessions', keyFor(token), { ...session, expiresAt: 0 });
    });
    res.clearCookie('loomiq_session', { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    res.json({ success: true });
  });
  app.post('/api/account/forgot-password', limiter, async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail(400, 'Enter a valid email address.');
    const key = keyFor(email);
    const customer = await store().get('customers', key);
    if (!customer?.passwordHash) throw fail(404, 'No account exists with this email address. Please sign up first.');
    if (!mailConfigured()) throw fail(503, 'Account email is temporarily unavailable. Please contact support.');
    {
      const token = crypto.randomBytes(32).toString('hex');
      await store().transaction(async tx => {
        const current = await tx.get('customers', key);
        current.passwordReset = { hash: keyFor(token), expiresAt: Date.now() + 30 * 60000 };
        await tx.put('customers', key, current);
      });
      // Fragment tokens stay out of HTTP access logs and referrer headers.
      const url = new URL('reset-password', process.env.PUBLIC_SITE_URL || 'http://localhost:5173/');
      url.hash = new URLSearchParams({ token, email }).toString();
      try { await sendMail({ to: email, subject: 'Reset your LoomIQ password', text: `Open this link to reset your password within 30 minutes:\n${url}\nIf you did not request this, ignore this email.` }); }
      catch {
        console.error('Password reset email delivery failed.');
        return res.status(502).json({ message: 'We could not send your reset email. Please try again shortly.' });
      }
    }
    res.json({ message: 'Your password reset link has been sent. Check your inbox and spam folder.' });
  });
  app.post('/api/account/reset-password', limiter, async (req, res) => {
    const { email, token, password } = req.body || {};
    if (typeof email !== 'string' || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || typeof password !== 'string' || password.length < 10 || Buffer.byteLength(password) > 72) throw fail(400, 'Use a valid reset link and a password of at least 10 characters (maximum 72 bytes).');
    const passwordHash = await bcrypt.hash(password, 12);
    await store().transaction(async tx => {
      const key = keyFor(email), customer = await tx.get('customers', key);
      if (!customer?.passwordReset || customer.passwordReset.expiresAt <= Date.now() || customer.passwordReset.hash !== keyFor(token)) throw fail(400, 'This reset link is invalid or expired. Request another link.');
      customer.passwordHash = passwordHash;
      customer.sessionVersion = (customer.sessionVersion || 0) + 1;
      delete customer.passwordReset;
      await tx.put('customers', key, customer);
    });
    res.json({ message: 'Password updated. Sign in with your new password.' });
  });
  app.post('/api/account/send-verification', limiter, async (req, res) => {
    const session = await signedIn(req);
    if (!mailConfigured()) throw fail(503, 'Account email is temporarily unavailable. Please contact support.');
    const token = crypto.randomBytes(32).toString('hex');
    const email = await store().transaction(async tx => {
      const c = await tx.get('customers', session.customerKey);
      if (c.emailVerifiedAt) return null;
      c.emailVerification = { hash: keyFor(token), expiresAt: Date.now() + 86400000 };
      await tx.put('customers', session.customerKey, c);
      return c.email;
    });
    if (email) {
      const url = new URL('verify-email', process.env.PUBLIC_SITE_URL || 'http://localhost:5173/');
      url.hash = new URLSearchParams({ token, email }).toString();
      await sendMail({ to: email, subject: 'Verify your LoomIQ email', text: `Confirm your email address within 24 hours:\n${url}` });
    }
    res.json({ message: email ? 'Verification link sent. Check your inbox.' : 'Your email is already verified.' });
  });
  app.post('/api/account/verify-email', limiter, async (req, res) => {
    const { email, token } = req.body || {};
    if (typeof email !== 'string' || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw fail(400, 'Invalid verification link.');
    await store().transaction(async tx => {
      const key = keyFor(email), c = await tx.get('customers', key);
      if (!c?.emailVerification || c.emailVerification.expiresAt <= Date.now() || c.emailVerification.hash !== keyFor(token)) throw fail(400, 'Verification link is invalid or expired. Request another link from your account.');
      c.emailVerifiedAt = Date.now(); delete c.emailVerification;
      await tx.put('customers', key, c);
    });
    res.json({ message: 'Email verified. You can return to your account.' });
  });
  app.post('/api/account/invoices/:orderId/email', limiter, async (req, res) => {
    const session = await signedIn(req);
    const order = await store().get('orders', req.params.orderId);
    if (!order || order.customerKey !== session.customerKey || order.status !== 'paid' || !order.invoice) throw fail(404, 'Invoice not found.');
    const customer = await store().get('customers', session.customerKey);
    if (!customer.emailVerifiedAt) throw fail(403, 'Verify your email before requesting an invoice email.');
    await sendMail({ to: customer.email, subject: `LoomIQ invoice ${order.invoice.number}`, text: 'Your membership payment invoice is attached. Open the HTML file in your browser to print or save as PDF.', attachments: [{ filename: `${order.invoice.number}.html`, content: renderInvoice(order.invoice), contentType: 'text/html' }] });
    res.json({ message: 'Invoice sent to your verified email.' });
  });
}
module.exports = { registerAccountRoutes };
