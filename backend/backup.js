const crypto = require('node:crypto');
function encryptBackup(text, password) {
  if (!password || password.length < 20) throw new Error('BACKUP_PASSWORD must contain at least 20 characters.');
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(password, salt, 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return JSON.stringify({ version: 1, salt: salt.toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: data.toString('base64') });
}
function decryptBackup(text, password) {
  const archive = JSON.parse(text);
  if (archive.version !== 1) throw new Error('Unsupported backup version.');
  const key = crypto.scryptSync(password, Buffer.from(archive.salt, 'base64'), 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(archive.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(archive.tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(archive.data, 'base64')), decipher.final()]).toString('utf8');
}
module.exports = { encryptBackup, decryptBackup };
