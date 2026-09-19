const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });
const { connectDatabase, closeDatabase } = require('./database');
(async () => {
  const db = await connectDatabase();
  const time = async (label, fn, runs = 8) => {
    const samples = [];
    for (let i = 0; i < runs; i++) { const s = process.hrtime.bigint(); await fn(); samples.push(Number(process.hrtime.bigint() - s) / 1e6); }
    samples.sort((a, b) => a - b);
    console.log(`${label.padEnd(30)} median ${samples[Math.floor(runs / 2)].toFixed(1)}ms  min ${samples[0].toFixed(1)}ms  max ${samples[runs - 1].toFixed(1)}ms`);
  };
  await time('one findOne (round trip)', () => db.collection('visitors').findOne({ _id: 'x' }));
  await time('two findOne in parallel', () => Promise.all([db.collection('visitors').findOne({ _id: 'x' }), db.collection('customers').findOne({ _id: 'y' })]));
  await time('session.withTransaction (read only)', () => db.client.startSession().withTransaction(async s => { await db.collection('visitors').findOne({ _id: 'x' }, { session: s }); }).finally(() => {}), 3);
  await closeDatabase();
})();