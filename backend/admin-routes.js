const crypto = require('node:crypto');
const bcrypt = require('bcrypt');
const { keyFor, fail } = require('./account-service');

function registerAdminRoutes(app, { store, addAudit }) {
  // Simple admin auth using admins collection and separate admin sessions
  app.post('/api/admin/login', async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });
    const admin = await store().get('admins', keyFor(email));
    if (!admin || !admin.passwordHash) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    // create session token
    const token = crypto.randomBytes(32).toString('hex');
    const session = { adminKey: keyFor(email), createdAt: Date.now(), expiresAt: Date.now() + 24*60*60*1000 };
    await store().transaction(async tx => { await tx.put('sessions', keyFor(token), session); });
    res.cookie('loomiq_admin_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 24*60*60*1000, path: '/' });
    await addAudit({ admin: email, action: 'admin.login', resource: 'session', resourceId: keyFor(token), success: true });
    res.json({ success: true });
  });

  app.post('/api/admin/logout', async (req, res) => {
    const token = /(?:^|; )loomiq_admin_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
    if (token) await store().transaction(async tx => {
      const session = await tx.get('sessions', keyFor(token));
      if (session) await tx.put('sessions', keyFor(token), { ...session, expiresAt: 0 });
    });
    res.clearCookie('loomiq_admin_session', { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    res.json({ success: true });
  });

  app.get('/api/admin/me', async (req, res) => {
    const token = /(?:^|; )loomiq_admin_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
    if (!token) return res.status(401).json({ success: false, message: 'Not authenticated' });
    const session = await store().get('sessions', keyFor(token));
    if (!session || session.expiresAt <= Date.now()) return res.status(401).json({ success: false, message: 'Session expired' });
    const admin = await store().get('admins', session.adminKey);
    if (!admin) return res.status(401).json({ success: false, message: 'Admin not found' });
    // The client uses this only to tailor navigation. Every API route remains
    // responsible for enforcing its own permission check.
    res.json({ success: true, admin: { email: admin.email, roles: admin.roles || [], permissions: admin.permissions || [] } });
  });
}

module.exports = { registerAdminRoutes };
