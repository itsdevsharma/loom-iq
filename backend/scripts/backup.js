require('dotenv').config({ path: require('node:path').join(__dirname, '../.env'), quiet: true });
const fs = require('node:fs');
const { BSON } = require('mongodb');
const { connectDatabase, closeDatabase } = require('../database');
const { encryptBackup, decryptBackup } = require('../backup');
const names = ['customers', 'visitors', 'sessions', 'orders', 'demoRequests', 'migrations'];
async function main() {
  const [command, filename, target] = process.argv.slice(2);
  if (!filename || !['create', 'restore'].includes(command)) throw new Error('Usage: node scripts/backup.js create <file> | restore <file> <loomiq_restore_name>');
  if (!process.env.BACKUP_PASSWORD || process.env.BACKUP_PASSWORD.length < 20) throw new Error('Set BACKUP_PASSWORD to at least 20 characters; keep it separate from the backup.');
  if (command === 'restore' && !/^loomiq_restore_[a-zA-Z0-9_]+$/.test(target || '')) throw new Error('Restore only supports a new database named loomiq_restore_<name>.');
  const db = await connectDatabase();
  if (command === 'create') {
    const session = db.client.startSession();
    let snapshot;
    try {
      await session.withTransaction(async () => {
        snapshot = { createdAt: new Date(), collections: {} };
        for (const name of names) snapshot.collections[name] = await db.collection(name).find({}, { session }).toArray();
      }, { readConcern: { level: 'snapshot' } });
    } finally { await session.endSession(); }
    fs.writeFileSync(filename, encryptBackup(BSON.EJSON.stringify(snapshot), process.env.BACKUP_PASSWORD), { flag: 'wx', mode: 0o600 });
    console.log('Encrypted snapshot created. Store it off-host with restricted access.');
  } else {
    const snapshot = BSON.EJSON.parse(decryptBackup(fs.readFileSync(filename, 'utf8'), process.env.BACKUP_PASSWORD));
    const destination = db.client.db(target);
    if (target === db.databaseName || (await destination.listCollections().toArray()).length) throw new Error('Restore target must be a new empty database, separate from the source.');
    for (const name of names) {
      const documents = snapshot.collections[name];
      if (!Array.isArray(documents)) throw new Error('Backup is missing a required collection.');
    }
    for (const name of names) {
      await destination.createCollection(name);
      if (snapshot.collections[name].length) await destination.collection(name).insertMany(snapshot.collections[name]);
      if (await destination.collection(name).countDocuments() !== snapshot.collections[name].length) throw new Error('Restore count mismatch.');
    }
    // Recreate application indexes; the restored migration marker avoids local imports.
    await destination.collection('customers').createIndex({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });
    await destination.collection('sessions').createIndex({ expiresAtDate: 1 }, { expireAfterSeconds: 0 });
    await destination.collection('orders').createIndex({ customerKey: 1, createdAt: -1 });
    console.log('Restored into the separate verification database. Source database unchanged.');
  }
}
main().catch(() => { console.error('Backup operation failed. Check configuration, archive password, file path, database permissions, and whether the destination is empty.'); process.exitCode = 1; }).finally(closeDatabase);
