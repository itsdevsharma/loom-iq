const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function run(){
  const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/loomiq';
  const client = new MongoClient(url);
  await client.connect();
  const db = client.db();
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'password12345';
  const hash = await bcrypt.hash(password, 12);
  const key = crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
  await db.collection('admins').updateOne({ _id: key }, { $set: { email, passwordHash: hash, roles: ['superadmin'], createdAt: Date.now() } }, { upsert: true });
  console.log('Seeded admin (mongo) with _id:', key);
  await client.close();
}
run().catch(err=>{ console.error(err); process.exit(1) });
