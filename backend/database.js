const { MongoClient } = require('mongodb');

function connectionConfig(env = process.env) {
  if (env.MONGODB_URI) return { uri: env.MONGODB_URI, options: {} };
  if (!env.MONGODB_HOST) throw new Error('Set MONGODB_HOST to your Atlas cluster hostname, or provide MONGODB_URI.');
  if (!/^[a-zA-Z0-9.-]+$/.test(env.MONGODB_HOST)) throw new Error('MONGODB_HOST must be a hostname, without a protocol or path.');
  if (!env.MONGODB_USERNAME || !env.MONGODB_PASSWORD) throw new Error('MongoDB credentials are missing.');
  return {
    uri: `mongodb+srv://${env.MONGODB_HOST}/?retryWrites=true&w=majority`,
    options: { auth: { username: env.MONGODB_USERNAME, password: env.MONGODB_PASSWORD }, authSource: 'admin' },
  };
}

let client;
let database;
async function connectDatabase() {
  if (database) return database;
  const { uri, options } = connectionConfig();
  const connection = new MongoClient(uri, { ...options, serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000, maxPoolSize: 10 });
  try {
    await connection.connect();
    const db = connection.db(process.env.MONGODB_DATABASE || 'loomiq');
    await db.command({ ping: 1 });
    client = connection;
    database = db;
    return database;
  } catch {
    await connection.close().catch(() => {});
    // Driver errors can contain host/URI information. Do not log connection details.
    throw new Error('MongoDB connection failed. Check the cluster hostname, credentials, database permissions, and Atlas network access.');
  }
}
function getDatabase() {
  if (!database) throw new Error('MongoDB is not connected.');
  return database;
}
async function closeDatabase() {
  const connection = client;
  client = undefined;
  database = undefined;
  if (connection) await connection.close();
}
module.exports = { connectionConfig, connectDatabase, getDatabase, closeDatabase };
