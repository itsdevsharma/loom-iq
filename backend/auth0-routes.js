const crypto = require('node:crypto');
const { keyFor, enroll } = require('./account-service');

const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
const configured = () => Boolean(process.env.AUTH0_DOMAIN && process.env.AUTH0_CLIENT_ID && process.env.AUTH0_CLIENT_SECRET && process.env.AUTH0_CALLBACK_URL);
const auth0Origin = () => `https://${String(process.env.AUTH0_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/$/, '')}`;

function safeReturnTo(value) {
  const site = new URL(process.env.PUBLIC_SITE_URL || 'http://localhost:5173/');
  try {
    const target = new URL(value || '/', site);
    return target.origin === site.origin && target.pathname.startsWith('/') ? target.pathname + target.search + target.hash : '/signup';
  } catch {
    return '/signup';
  }
}

function cookie(req, name) {
  return new RegExp(`(?:^|; )${name}=([^;]+)(?:;|$)`).exec(req.headers.cookie || '')?.[1];
}

function registerAuth0Routes(app, { store, visitorId, visitorCookie }) {
  app.get('/api/auth0/login', (req, res) => {
    if (!configured()) return res.status(503).send('Single sign-on is not configured. Please contact LoomIQ support.');
    const state = crypto.randomBytes(32).toString('hex');
    const returnTo = safeReturnTo(req.query.returnTo);
    res.cookie('loomiq_auth0_state', state, { ...cookieOptions(), maxAge: 10 * 60 * 1000 });
    res.cookie('loomiq_auth0_return_to', Buffer.from(returnTo).toString('base64url'), { ...cookieOptions(), maxAge: 10 * 60 * 1000 });
    res.cookie('loomiq_auth0_terms', req.query.terms === '1' ? '1' : '0', { ...cookieOptions(), maxAge: 10 * 60 * 1000 });
    const authorize = new URL('/authorize', auth0Origin());
    authorize.search = new URLSearchParams({
      response_type: 'code', client_id: process.env.AUTH0_CLIENT_ID, redirect_uri: process.env.AUTH0_CALLBACK_URL,
      scope: 'openid profile email', state,
      ...(req.query.signup === '1' ? { screen_hint: 'signup' } : {}),
    }).toString();
    res.redirect(authorize.toString());
  });

  app.get('/api/auth0/callback', async (req, res) => {
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const expectedState = cookie(req, 'loomiq_auth0_state');
    const returnTo = safeReturnTo(Buffer.from(cookie(req, 'loomiq_auth0_return_to') || '', 'base64url').toString() || '/signup');
    const clear = () => {
      res.clearCookie('loomiq_auth0_state', cookieOptions());
      res.clearCookie('loomiq_auth0_return_to', cookieOptions());
      res.clearCookie('loomiq_auth0_terms', cookieOptions());
    };
    if (!configured() || !expectedState || state.length !== expectedState.length || !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(expectedState))) {
      clear();
      return res.redirect(`${safeReturnTo('/signup')}?auth_error=invalid_state`);
    }
    if (typeof req.query.error === 'string' || typeof req.query.code !== 'string') {
      clear();
      return res.redirect(`${returnTo}${returnTo.includes('?') ? '&' : '?'}auth_error=cancelled`);
    }
    try {
      const tokenResponse = await fetch(new URL('/oauth/token', auth0Origin()), {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'authorization_code', client_id: process.env.AUTH0_CLIENT_ID, client_secret: process.env.AUTH0_CLIENT_SECRET, code: req.query.code, redirect_uri: process.env.AUTH0_CALLBACK_URL }),
      });
      const tokens = await tokenResponse.json();
      if (!tokenResponse.ok || typeof tokens.access_token !== 'string') throw new Error('Auth0 token exchange failed.');
      const profileResponse = await fetch(new URL('/userinfo', auth0Origin()), { headers: { Authorization: `Bearer ${tokens.access_token}` } });
      const identity = await profileResponse.json();
      const email = typeof identity.email === 'string' ? identity.email.trim().toLowerCase() : '';
      if (!profileResponse.ok || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Auth0 did not provide a valid email address.');
      const id = visitorId(req) || crypto.randomBytes(32).toString('hex');
      const token = crypto.randomBytes(32).toString('hex');
      const now = Date.now();
      const termsAccepted = cookie(req, 'loomiq_auth0_terms') === '1';
      const key = keyFor(email);
      await store().transaction(async tx => {
        const existing = await tx.get('customers', key);
        const { c } = await enroll(tx, id, key, now);
        c.name ||= typeof identity.name === 'string' ? identity.name.slice(0, 100) : email.split('@')[0];
        c.company ||= '';
        c.auth0UserId = identity.sub;
        c.registeredAt ||= now;
        if (termsAccepted) c.termsAcceptedAt ||= now;
        if (identity.email_verified) c.emailVerifiedAt ||= now;
        await tx.put('customers', key, c);
        await tx.put('sessions', keyFor(token), { customerKey: key, visitorId: id, version: c.sessionVersion || 0, expiresAt: now + 30 * 86400000 });
      });
      visitorCookie(res, id);
      res.cookie('loomiq_session', token, { ...cookieOptions(), maxAge: 30 * 86400000 });
      clear();
      res.redirect(returnTo);
    } catch (error) {
      console.error('Auth0 sign-in failed:', error.message);
      clear();
      res.redirect(`${returnTo}${returnTo.includes('?') ? '&' : '?'}auth_error=failed`);
    }
  });
}

module.exports = { registerAuth0Routes };
