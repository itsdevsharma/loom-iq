const apiUrl = () => String(process.env.ERP_API_URL || '').replace(/\/$/, '');
const token = () => String(process.env.ERP_MARKETING_INTEGRATION_TOKEN || '');
const loginUrl = () => String(process.env.ERP_LOGIN_URL || '');

const configured = () => Boolean(apiUrl() && token());

async function request(path, payload) {
  if (!configured()) throw Object.assign(new Error('The ERP demo service is not configured. Please contact LoomIQ.'), { status: 503 });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${apiUrl()}${path}`, {
      method: 'POST',
      // A redirected POST can turn into a successful HTML page, hiding an
      // incorrect API URL. Never forward the integration credential elsewhere.
      redirect: 'manual',
      headers: { 'Content-Type': 'application/json', 'x-loomiq-integration-key': token() },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.success) {
      const rawRetry = response.headers.get('retry-after');
      const seconds = rawRetry && /^\d+$/.test(rawRetry) ? Number(rawRetry) : rawRetry ? Math.ceil((Date.parse(rawRetry) - Date.now()) / 1000) : Number(body?.retryAfter);
      const retryAfter = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : undefined;
      const fallback = response.status === 429
        ? 'The ERP demo service is receiving too many requests. Please wait before trying again.'
        : 'The ERP demo service is unavailable.';
      const redirected = response.status >= 300 && response.status < 400;
      const code = redirected ? 'ERP_REDIRECT' : response.ok ? 'ERP_INVALID_RESPONSE' : 'ERP_HTTP_ERROR';
      // Do not log response bodies, request payloads, URLs with credentials,
      // integration tokens, or OTPs. These fields identify routing failures.
      console.error('ERP integration request failed:', {
        code, path, upstreamStatus: response.status,
        contentType: response.headers.get('content-type'), retryAfter,
      });
      throw Object.assign(new Error(typeof body?.message === 'string' && body.message ? body.message : fallback), {
        status: response.ok || redirected ? 502 : response.status, retryAfter, code,
      });
    }
    return body.data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('ERP integration request failed:', { code: 'ERP_TIMEOUT', path });
      throw Object.assign(new Error('The ERP demo service timed out. Please try again.'), { status: 504, code: 'ERP_TIMEOUT' });
    }
    if (!error.status) {
      console.error('ERP integration request failed:', { code: 'ERP_CONNECTION_FAILED', path, networkCode: error.cause?.code });
      throw Object.assign(new Error('Unable to connect to the ERP demo service. Please try again shortly.'), { status: 502, code: 'ERP_CONNECTION_FAILED' });
    }
    throw error;
  } finally { clearTimeout(timeout); }
}

const startDemo = payload => request('/api/integrations/marketing/demo-requests', payload);
const verifyDemo = payload => request('/api/integrations/marketing/demo-requests', { action: 'verify', ...payload });
const convertDemo = async payload => {
  const result = await request('/api/integrations/marketing/demo-conversions', payload);
  return { ...result, workspaceUrl: result.workspaceUrl || loginUrl() };
};

module.exports = { configured, startDemo, verifyDemo, convertDemo };
