const { MongoClient } = require('mongodb');
const path = require('node:path');
const { initializeMongo } = require('../repository');

const Migration = '2026-09-12-create-cms-collections';

async function run(db) {
  const migrations = db.collection('migrations');
  if (await migrations.findOne({ _id: Migration })) {
    console.log('Migration', Migration, 'already applied; skipping.');
    return;
  }

  const names = ['pages', 'page_versions', 'media', 'preview_tokens'];
  for (const name of names) {
    try { await db.createCollection(name); }
    catch (error) {
      if (error.code !== 48) throw error;
    }
  }

  try { await db.collection('pages').createIndex({ slug: 1 }, { unique: true, partialFilterExpression: { slug: { $type: 'string', $ne: null } } }); } catch (e) { /* ignore */ }
  try { await db.collection('pages').createIndex({ status: 1, lastModifiedAt: -1 }); } catch (e) { /* ignore */ }
  try { await db.collection('page_versions').createIndex({ pageId: 1, createdAt: -1 }); } catch (e) { /* ignore */ }
  try { await db.collection('media').createIndex({ uploadedAt: -1 }); } catch (e) { /* ignore */ }
  try { await db.collection('preview_tokens').createIndex({ token: 1 }, { unique: true, partialFilterExpression: { token: { $type: 'string' } } }); } catch (e) { /* ignore */ }

  await migrations.insertOne({ _id: Migration, completedAt: new Date() });
  console.log('Migration', Migration, 'applied.');
}

async function main() {
  const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/loomiq';
  const client = new MongoClient(url);
  await client.connect();
  try { await run(client.db(process.env.MONGODB_DATABASE || 'loomiq')); }
  finally { await client.close(); }
}

if (require.main === module) {
  main().catch(err => { console.error(err.message); process.exit(1); });
}

module.exports = { run: (db) => run(db) };
