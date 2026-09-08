const crypto = require('node:crypto');
function createInvoice(orderId, order, customer) {
  return {
    number: 'LIQ-' + crypto.createHash('sha256').update(orderId).digest('hex').slice(0, 16).toUpperCase(),
    orderId, paymentId: order.paymentId, issuedAt: order.paidAt,
    plan: order.plan, amount: order.amount, currency: 'INR',
    testMode: order.testMode !== false,
    customer: order.billing || { name: customer.name, email: customer.email, company: customer.company },
    seller: order.seller || { name: process.env.INVOICE_BUSINESS_NAME || 'LoomIQ', address: process.env.INVOICE_BUSINESS_ADDRESS || '', gstin: process.env.INVOICE_GSTIN || '', email: 'support@loomiq.com' },
    description: 'LoomIQ ' + order.plan + ' membership — first month',
  };
}
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function renderInvoice(i) {
  const money = 'INR ' + (i.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Invoice ${escape(i.number)}</title><style>
  body{font:15px/1.6 system-ui,sans-serif;color:#292137;background:#f7f5fb;margin:0;padding:40px 20px}main{max-width:760px;margin:auto;padding:48px;background:white;border:1px solid #e5dfed;border-radius:16px}header{display:flex;justify-content:space-between;gap:20px}h1{font-size:32px;margin:0}h2{font-size:17px;margin:0}p{margin:5px 0}.muted{color:#70657c}.badge{background:#eaf7ef;color:#216544;padding:6px 12px;border-radius:6px;display:inline-block}.test{padding:12px;background:#fff1d6;border:1px solid #edce88;margin:20px 0}.parties{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin:35px 0}table{width:100%;border-collapse:collapse;margin:28px 0}th,td{text-align:left;border-bottom:1px solid #e6dfed;padding:15px 0}th:last-child,td:last-child{text-align:right}.total{font-size:23px;font-weight:700}.ref{overflow-wrap:anywhere;font-size:12px}footer{border-top:1px solid #e6dfed;padding-top:20px;font-size:12px}@media(max-width:540px){main{padding:24px}.parties{grid-template-columns:1fr}header{flex-wrap:wrap}}@media print{body{padding:0;background:white}main{border:0;padding:20px;max-width:none}.print-help{display:none}}</style></head><body><main>
  <header><div><h1>${escape(i.seller.name)}</h1><p class="muted">${escape(i.seller.email)}</p></div><div><h2>Invoice</h2><p>${escape(i.number)}</p><span class="badge">${i.testMode ? 'Test payment' : 'Paid'}</span></div></header>
  ${i.testMode ? '<p class="test"><strong>TEST INVOICE</strong> — Simulated payment. No real money was collected.</p>' : ''}
  <p class="muted">Issued ${escape(new Date(i.issuedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long' }))}</p>
  <div class="parties"><section><h2>Billed to</h2>${['name','company','email','address','city','state','phone'].map(k => i.customer[k] ? '<p>'+escape(i.customer[k])+'</p>' : '').join('')}</section><section><h2>From</h2><p>${escape(i.seller.name)}</p><p>${escape(i.seller.address)}</p>${i.seller.gstin ? '<p>GSTIN: '+escape(i.seller.gstin)+'</p>' : ''}</section></div>
  <table><thead><tr><th>Description</th><th>Amount</th></tr></thead><tbody><tr><td>${escape(i.description)}</td><td>${money}</td></tr><tr><td class="total">Total paid${i.testMode ? ' (test)' : ''}</td><td class="total">${money}</td></tr></tbody></table>
  <p class="ref">Order: ${escape(i.orderId)}<br>Payment: ${escape(i.paymentId)}</p><footer><p>This document records the membership payment. It is not a GST tax invoice; no GST breakdown has been supplied.</p><p>Questions? Contact ${escape(i.seller.email)}.</p><p class="print-help">To download as PDF, use your browser’s Print menu and choose Save as PDF.</p></footer>
  </main></body></html>`;
}
module.exports = { createInvoice, renderInvoice };
