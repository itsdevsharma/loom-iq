// Server-side tool: the operator token is never exposed to a browser.
require('dotenv').config({ path: require('node:path').join(__dirname, '../.env'), quiet: true });
async function main() {
  if (!process.env.ADMIN_API_TOKEN) throw new Error('Set ADMIN_API_TOKEN.');
  const [email, status, workspaceUrl] = process.argv.slice(2);
  const base = process.env.OPERATOR_API_URL || `http://127.0.0.1:${process.env.PORT || 3001}`;
  const response = await fetch(base + '/api/operator/onboarding', {
    method: email ? 'POST' : 'GET', headers: { Authorization: `Bearer ${process.env.ADMIN_API_TOKEN}`, 'Content-Type': 'application/json' },
    ...(email ? { body: JSON.stringify({ email, status, workspaceUrl }) } : {}),
  });
  if (!response.ok) throw new Error('Operator request failed with status ' + response.status);
  console.log(JSON.stringify(await response.json(), null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
