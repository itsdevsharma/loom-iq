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
      headers: { 'Content-Type': 'application/json', 'x-loomiq-integration-key': token() },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body?.success) {
      const rawRetry = response.headers.get('retry-after');
      const seconds = rawRetry && /^\d+$/.test(rawRetry) ? Number(rawRetry) : rawRetry ? Math.ceil((Date.parse(rawRetry) - Date.now()) / 1000) : Number(body?.retryAfter);
      const retryAfter = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : undefined;
      const fallback = response.status === 429
        ? 'The ERP demo service is receiving too many requests. Please wait before trying again.'
        : 'The ERP demo service is unavailable.';
      throw Object.assign(new Error(typeof body?.message === 'string' && body.message ? body.message : fallback), { status: response.ok ? 502 : response.status, retryAfter });
    }
    return body.data;
  } catch (error) {
    if (error.name === 'AbortError') throw Object.assign(new Error('The ERP demo service timed out. Please try again.'), { status: 504 });
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
