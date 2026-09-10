const { test } = require('node:test');
const assert = require('node:assert/strict');
const { encryptBackup, decryptBackup } = require('./backup');
test('encrypted backups round-trip and reject incorrect keys or tampering', () => {
  const password = 'test-backup-password-123';
  const encrypted = encryptBackup('{"private":"customer"}', password);
  assert.equal(encrypted.includes('customer'), false);
  assert.equal(decryptBackup(encrypted, password), '{"private":"customer"}');
  assert.throws(() => decryptBackup(encrypted, 'wrong-password'));
  const damaged = JSON.parse(encrypted); damaged.data = Buffer.from('changed').toString('base64');
  assert.throws(() => decryptBackup(JSON.stringify(damaged), password));
  assert.throws(() => encryptBackup('data', 'short'));
});
