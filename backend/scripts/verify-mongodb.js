// Opt-in check. Creates and removes only a uniquely named verification database.
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { connectDatabase, closeDatabase } = require('../database');
const { initializeMongo, mongoRepository } = require('../repository');
const { keyFor } = require('../account-service');
async function main() {
  const source = await connectDatabase();
  const db = source.client.db('loomiq_verification_' + crypto.randomBytes(8).toString('hex'));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'loomiq-mongo-'));
  const restoreName = 'loomiq_restore_' + crypto.randomBytes(8).toString('hex');
  let restoreAttempted = false;
  let server;
  try {
    const repo = await initializeMongo(db, path.join(dir, 'offers.json'));
    process.env.SALES_EMAIL = ""; process.env.EMAIL_API_KEY = "";
    process.env.OFFER_DB_PATH = path.join(dir, 'offers.json');
    const { app, useRepository } = require('../server');
    useRepository(repo);
    server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const post = async (url, body, cookie = '') => {
      const res = await fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify(body) });
      return { status: res.status, data: await res.json(), cookie: res.headers.getSetCookie().map(c => c.split(';')[0]).join('; ') };
    };
    const credentials = { name: 'Database verification', company: 'LoomIQ verification', email: 'mongo-verification@example.invalid', password: crypto.randomBytes(20).toString('hex'), acceptTerms: true };
    const signup = await post('/api/account/signup', credentials);
    assert.equal(signup.status, 201); assert.equal(signup.data.eligible, true);
    const customer = await db.collection('customers').findOne({ _id: keyFor(credentials.email) });
    assert.ok(customer.passwordHash.startsWith('$2')); assert.notEqual(customer.passwordHash, credentials.password);
    assert.equal(await db.collection('sessions').countDocuments(), 1);
    assert.equal((await post('/api/account/signup', credentials)).status, 409);
    const trial = await post('/api/trial/select', { acceptConditions: true }, signup.cookie);
    assert.equal(trial.data.eligible, true); assert.equal(trial.data.trialSelected, true);
    useRepository(mongoRepository(db));
    const login = await post('/api/account/login', credentials);
    assert.equal(login.status, 200); assert.equal(login.data.eligible, true); assert.equal(login.data.expiresAt, signup.data.expiresAt);
    const quote = await post('/api/purchase/quote', { plan: 'Starter' }, login.cookie);
    assert.equal(quote.data.amount, 99500);
    const raceData = { ...credentials, email: 'mongo-race@example.invalid' };
    const race = await Promise.all([post('/api/account/signup', raceData), post('/api/account/signup', raceData)]);
    assert.deepEqual(race.map(r => r.status).sort(), [201, 409]);
    assert.equal(await db.collection('customers').countDocuments({ email: raceData.email }), 1);
    const beforeCount = await db.collection('customers').countDocuments();
    await assert.rejects(repo.transaction(async tx => {
      await tx.put('customers', 'rollback-check', { name: 'rollback' });
      throw new Error('intentional rollback');
    }));
    assert.equal(await db.collection('customers').countDocuments(), beforeCount);
    await db.collection('migrations').deleteOne({ _id: 'local-json-v1' });
    const legacyFile = path.join(dir, 'offers.json');
    fs.writeFileSync(legacyFile, JSON.stringify({ customers: { [keyFor(credentials.email)]: { email: credentials.email, name: 'Must not overwrite' } }, visitors: {}, orders: {} }));
    await initializeMongo(db, legacyFile);
    assert.equal((await repo.get('customers', keyFor(credentials.email))).name, credentials.name);
    const demo = await post('/api/demo-requests', { name: 'Verification', company: 'Test company', email: 'demo-verification@example.invalid', formStartedAt: Date.now() - 5000 });
    assert.equal(demo.status, 201);
    assert.equal(await db.collection('demoRequests').countDocuments(), 1);
    assert.equal((await fetch(base + '/api/demo-requests')).status, 403);
    const { promisify } = require('node:util');
    const execFile = promisify(require('node:child_process').execFile);
    const archive = path.join(dir, 'verification.enc');
    const backupEnv = { ...process.env, MONGODB_DATABASE: db.databaseName, BACKUP_PASSWORD: crypto.randomBytes(32).toString('hex') };
    await execFile(process.execPath, [path.join(__dirname, 'backup.js'), 'create', archive], { env: backupEnv, windowsHide: true });
    restoreAttempted = true;
    await execFile(process.execPath, [path.join(__dirname, 'backup.js'), 'restore', archive, restoreName], { env: backupEnv, windowsHide: true });
    assert.equal(await source.client.db(restoreName).collection('customers').countDocuments(), await db.collection('customers').countDocuments());
    assert.equal((await source.client.db(restoreName).collection('customers').findOne({ _id: keyFor(credentials.email) })).name, credentials.name);
    console.log('PASS: encrypted backup and restore into an isolated database.');
    console.log('PASS: signup, password hashing, sessions, concurrent signup, trial eligibility, reload, pricing, rollback, migration, demo persistence, and private contact records.');
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await db.dropDatabase();
    if (restoreAttempted) await source.client.db(restoreName).dropDatabase();
    fs.rmSync(dir, { recursive: true, force: true });
    await closeDatabase();
  }
}
main().catch(error => { console.error('MongoDB integration verification failed:', error.code || error.name); process.exitCode = 1; });
