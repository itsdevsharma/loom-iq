const crypto = require('node:crypto');
const { keyFor, fail } = require('./account-service');
function registerOperatorRoutes(app, store) {
  app.use('/api/operator', (req, res, next) => {
    const expected = process.env.ADMIN_API_TOKEN;
    const provided = req.get('authorization')?.replace(/^Bearer /, '');
    const hash = value => crypto.createHash('sha256').update(value).digest();
    if (!expected || !provided || !crypto.timingSafeEqual(hash(expected), hash(provided))) return res.sendStatus(403);
    next();
  });
  app.get('/api/operator/onboarding', async (_req, res) => {
    const customers = await store().list('customers');
    res.json({ customers: customers.filter(c => c.trialRequest || c.paidOrder).map(c => ({ name: c.name, email: c.email, company: c.company, trialRequested: Boolean(c.trialRequest), paidOrder: c.paidOrder || null, onboarding: c.onboarding || { status: 'requested' } })) });
  });
  app.post('/api/operator/onboarding', async (req, res) => {
    const { email, status, workspaceUrl } = req.body || {};
    if (typeof email !== 'string' || !['requested', 'in-progress', 'active'].includes(status)) throw fail(400, 'Provide an account email and a valid onboarding status.');
    let url = null;
    if (status === 'active') {
      try { url = new URL(workspaceUrl); } catch { throw fail(400, 'Provide the provisioned HTTPS workspace URL.'); }
      if (url.protocol !== 'https:' || url.username || url.password) throw fail(400, 'Workspace must use HTTPS without embedded credentials.');
    }
    await store().transaction(async tx => {
      const key = keyFor(email), c = await tx.get('customers', key);
      if (!c || !c.trialRequest && !c.paidOrder) throw fail(404, 'No onboarding request for this account.');
      c.onboarding = { status, workspaceUrl: url?.href || null, updatedAt: Date.now() };
      await tx.put('customers', key, c);
    });
    res.json({ success: true });
  });
}
module.exports = { registerOperatorRoutes };
