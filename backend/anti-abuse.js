const { fail } = require('./account-service');

async function verifyTurnstile(req) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // Keeping this optional makes local development work. In production, set the
  // secret and the matching VITE_TURNSTILE_SITE_KEY to make Turnstile required.
  if (!secret) return;
  const token = typeof req.body?.['cf-turnstile-response'] === 'string' ? req.body['cf-turnstile-response'] : '';
  if (!token) throw fail(400, 'Please complete the security check and try again.');
  let result;
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: req.ip }), signal: AbortSignal.timeout(5000),
    });
    result = await response.json();
  } catch { throw fail(503, 'The security check is temporarily unavailable. Please try again shortly.'); }
  if (!result?.success) throw fail(400, 'Security check failed. Please try again.');
}

function assertHumanSignup(req) {
  if (String(req.body?.website || '').trim()) throw fail(400, 'Unable to create this account.');
  const started = Number(req.body?.formStartedAt);
  if (!Number.isFinite(started) || started > Date.now() || Date.now() - started < 2500) {
    throw fail(400, 'Please take a moment to complete the form.');
  }
}

module.exports = { verifyTurnstile, assertHumanSignup };
