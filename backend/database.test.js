const { test } = require('node:test');
const assert = require('node:assert/strict');
const { connectionConfig, getDatabase } = require('./database');
test('Atlas config keeps credentials outside the URI', () => {
 const config = connectionConfig({ MONGODB_HOST: 'cluster.example.mongodb.net', MONGODB_USERNAME: 'user', MONGODB_PASSWORD: 'p@ss:/word' });
 assert.equal(config.uri, 'mongodb+srv://cluster.example.mongodb.net/?retryWrites=true&w=majority');
 assert.equal(config.options.auth.password, 'p@ss:/word');
 assert.equal(config.options.authSource, 'admin');
});
test('missing cluster is rejected without leaking credentials', () => {
 assert.throws(() => connectionConfig({ MONGODB_USERNAME: 'private-user', MONGODB_PASSWORD: 'private-password' }), /Set MONGODB_HOST/);
 assert.throws(() => connectionConfig({ MONGODB_HOST: 'https://example.com/path' }), /must be a hostname/);
 assert.throws(() => getDatabase(), /not connected/);
});
test('full connection URI is supported', () => {
 assert.equal(connectionConfig({ MONGODB_URI: 'mongodb://127.0.0.1:27017' }).uri, 'mongodb://127.0.0.1:27017');
});
