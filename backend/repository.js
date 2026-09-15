const fs = require('node:fs');
const path = require('node:path');
const cmsCollections = new Set(['pages', 'page_versions', 'media', 'preview_tokens']);
const collections = ['invoice_counters', 'customers', 'visitors', 'sessions', 'orders', 'demoRequests', 'admins', 'roles', 'permissions', 'pricing_history', 'audit_logs', 'events', 'pages', 'page_versions', 'media', 'preview_tokens', 'website_content', 'website_versions', 'supportRequests'];
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
    put: (name, id, value) => { const q = access(state).put(name, id, value); fs.mkdirSync(path.dirname(filename), { recursive: true }); fs.writeFileSync(filename + '.tmp', JSON.stringify(state), { mode: 0o600 }); fs.renameSync(filename + '.tmp', filename); return q.then(() => value); },
    list: name => access(state).list(name),
    listWithIds: async name => Object.entries(state[name]).map(([id, value]) => ({...structuredClone(value), id})),
    paidOrders: async customerKey => structuredClone(Object.entries(state.orders).filter(([, order]) => order.customerKey === customerKey && order.status === 'paid').map(([id, order]) => ({ ...order, id }))),
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
      if (cmsCollections.has(name)) return doc;
      const { _id, ...value } = doc;
      return value;
    },
    async put(name, id, value) {
      const doc = { ...value, _id: id };
      if (name === 'sessions') doc.expiresAtDate = new Date(value.expiresAt);
      await db.collection(name).replaceOne({ _id: id }, doc, { upsert: true, session });
    },
    async list(name) { return db.collection(name).find({}, { session, ...(cmsCollections.has(name) ? {} : { projection: { _id: 0 } }) }).toArray(); },
  });
  return {
    kind: 'mongodb', ...access(),
    async listWithIds(name) { return (await db.collection(name).find({}).toArray()).map(({_id, ...value}) => ({...value, id:_id})); },
    async paidOrders(customerKey) {
      return (await db.collection('orders').find({ customerKey, status: 'paid' }).sort({ createdAt: -1 }).toArray()).map(({ _id, ...order }) => ({ ...order, id: _id }));
    },
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
  try { await db.collection('admins').createIndex({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } }); } catch (e) { /* ignore */ }
  try { await db.collection('pricing_history').createIndex({ plan: 1, createdAt: -1 }); } catch (e) { /* ignore */ }
  try { await db.collection('audit_logs').createIndex({ admin: 1, action: 1, createdAt: -1 }); } catch (e) { /* ignore */ }
  try { await db.collection('events').createIndex({ type: 1, timestamp: -1 }); } catch (e) { /* ignore */ }
  await db.collection('orders').createIndex({ customerKey: 1, createdAt: -1 });
  try { await db.collection('pages').createIndex({ slug: 1 }, { unique: true, partialFilterExpression: { slug: { $type: 'string', $ne: null } } }); } catch (e) { /* ignore */ }
  try { await db.collection('pages').createIndex({ status: 1, lastModifiedAt: -1 }); } catch (e) { /* ignore */ }
  try { await db.collection('page_versions').createIndex({ pageId: 1, createdAt: -1 }); } catch (e) { /* ignore */ }
  try { await db.collection('media').createIndex({ uploadedAt: -1 }); } catch (e) { /* ignore */ }
  try { await db.collection('preview_tokens').createIndex({ token: 1 }, { unique: true, partialFilterExpression: { token: { $type: 'string' } } }); } catch (e) { /* ignore */ }
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
