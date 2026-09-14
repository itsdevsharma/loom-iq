const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { fileRepository } = require('./repository');
const { createInvoice, financialYear, invoiceSeller } = require('./invoice');

test('financial year changes at midnight in India on April 1', () => {
  assert.equal(financialYear(Date.parse('2026-03-31T18:29:59Z')), '2025-26');
  assert.equal(financialYear(Date.parse('2026-03-31T18:30:00Z')), '2026-27');
});
test('invoice numbering is serialized, durable, separated from tests, and idempotent', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoice-sequence-'));
  try {
    const filename = path.join(dir, 'data.json');
    const repo = fileRepository(filename);
    const order = { paidAt: Date.parse('2026-09-15T00:00:00Z'), plan: 'Growth', amount: 149500, unitPrice: 199500, testMode: false };
    const issue = (store, id, extra = {}) => store.transaction(async tx => {
      const current = await tx.get('orders', id) || { ...order, ...extra };
      const invoice = await createInvoice(id, current, { name: 'Buyer' }, tx);
      await tx.put('orders', id, { ...current, invoice });
      return invoice;
    });
    const invoices = await Promise.all(Array.from({length: 8}, (_, i) => issue(repo, String(i))));
    assert.equal(new Set(invoices.map(i => i.number)).size, 8);
    assert.equal(invoices[0].number, 'LIQ/2026-27/0001');
    assert.equal(invoices[0].discount, 50000);
    assert.equal(invoices[0].gst, 0);
    assert.deepEqual(await issue(repo, '0'), invoices[0]);
    assert.equal((await issue(repo, 'test', {testMode:true})).number, 'LIQ-TEST/2026-27/0001');
    assert.equal((await issue(fileRepository(filename), 'next')).number, 'LIQ/2026-27/0009');
    assert.equal((await issue(repo, 'next-year', {paidAt:Date.parse('2027-04-01T00:00:00Z')})).number, 'LIQ/2027-28/0001');
  } finally { fs.rmSync(dir, {recursive:true, force:true}); }
});
test('non-GST seller does not expose a supplier GSTIN', () => {
  const seller = invoiceSeller();
  assert.equal(seller.gstRegistered, false);
  assert.equal(seller.gstin, undefined);
});
