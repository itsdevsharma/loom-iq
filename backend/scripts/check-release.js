require('dotenv').config({ path: require('node:path').join(__dirname, '../.env'), quiet: true });
const { validateProduction } = require('../production-config');
try { validateProduction({ ...process.env, NODE_ENV: 'production' }); console.log('Production configuration checks passed. Verify external services using docs/deployment.md.'); }
catch (error) { console.error(error.message); process.exitCode = 1; }
