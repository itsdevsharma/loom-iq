const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

async function run(){
  const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/loomiq';
  const client = new MongoClient(url);
  await client.connect();
  const db = client.db();
  const admins = db.collection('admins');
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'password12345';
  const hash = await bcrypt.hash(password, 12);
  await admins.updateOne({ email }, { $setOnInsert: { email, passwordHash: hash, roles: ['superadmin'], createdAt: Date.now() } }, { upsert: true });
  console.log('Seeded admin:', email);
  await client.close();
}
run().catch(err=>{ console.error(err); process.exit(1) });
