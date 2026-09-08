const fs = require('node:fs');
const path = require('node:path');
const collections = ['customers', 'visitors', 'sessions', 'orders', 'demoRequests'];
function readLegacy(filename, demoFilename) {
  const state = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, 'utf8')) : {};
  for (const name of collections) state[name] ||= {};
  if (demoFilename && fs.existsSync(demoFilename)) {
    for (const item of JSON.parse(fs.readFileSync(demoFilename, 'utf8'))) state.demoRequests[item.id] ||= item;
  }
  return state;
}
// Explicit local adapter for offline tests/development. MongoDB never falls back to it.
function fileRepository(filename, demoFilename) {
  let state = readLegacy(filename, demoFilename);
  let queue = Promise.resolve();
  const access = current => ({
    get: async (name, id) => structuredClone(current[name][id] ?? null),
    put: async (name, id, value) => { current[name][id] = structuredClone(value); },
    list: async name => structuredClone(Object.values(current[name])),
  });
  return {
    kind: 'file',
    get: (name, id) => access(state).get(name, id),
    list: name => access(state).list(name),
    transaction(work) {
      const result = queue.then(async () => {
        const next = structuredClone(state);
        const value = await work(access(next));
        fs.mkdirSync(path.dirname(filename), { recursive: true });
        fs.writeFileSync(filename + '.tmp', JSON.stringify(next), { mode: 0o600 });
        fs.renameSync(filename + '.tmp', filename);
        state = next;
        return value;
      });
      queue = result.catch(() => {});
      return result;
    },
  };
}
function mongoRepository(db) {
  const access = session => ({
    async get(name, id) {
      if (!id) return null;
      const doc = await db.collection(name).findOne({ _id: id }, { session });
      if (!doc) return null;
      const { _id, ...value } = doc;
      return value;
    },
    async put(name, id, value) {
      const doc = { ...value, _id: id };
      if (name === 'sessions') doc.expiresAtDate = new Date(value.expiresAt);
      await db.collection(name).replaceOne({ _id: id }, doc, { upsert: true, session });
    },
    async list(name) { return db.collection(name).find({}, { session, projection: { _id: 0 } }).toArray(); },
  });
  return {
    kind: 'mongodb', ...access(),
    async transaction(work) {
      // Concurrent first registrations can surface a duplicate key on an upsert.
      // Retry the whole transaction so account-exists checks run on fresh data.
      for (let attempt = 0; ; attempt++) {
        const session = db.client.startSession();
        try { return await session.withTransaction(() => work(access(session)), { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } }); }
        catch (error) { if (error.code !== 11000 || attempt >= 2) throw error; }
        finally { await session.endSession(); }
      }
    },
  };
}
async function initializeMongo(db, filename, demoFilename) {
  for (const name of collections) {
    try { await db.createCollection(name); }
    catch (error) { if (error.code !== 48) throw error; }
  }
  await db.collection('customers').createIndex({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });
  await db.collection('sessions').createIndex({ expiresAtDate: 1 }, { expireAfterSeconds: 0 });
  await db.collection('orders').createIndex({ customerKey: 1, createdAt: -1 });
  const migrations = db.collection('migrations');
  if (!await migrations.findOne({ _id: 'local-json-v1' })) {
    const legacy = readLegacy(filename, demoFilename);
    // Only insert missing documents; existing database accounts are never overwritten.
    for (const name of collections) {
      for (const [id, value] of Object.entries(legacy[name])) {
        const doc = { ...value };
        if (name === 'sessions') doc.expiresAtDate = new Date(value.expiresAt);
        await db.collection(name).updateOne({ _id: id }, { $setOnInsert: doc }, { upsert: true });
      }
    }
    await migrations.updateOne({ _id: 'local-json-v1' }, { $setOnInsert: { completedAt: new Date() } }, { upsert: true });
  }
  return mongoRepository(db);
}
module.exports = { fileRepository, mongoRepository, initializeMongo };
