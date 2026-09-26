function invoiceSeller() {
  const fields = { name: 'BUSINESS_NAME', address: 'BUSINESS_ADDRESS', phone: 'PHONE', email: 'EMAIL', website: 'WEBSITE', pan: 'PAN', cin: 'CIN', bankName: 'BANK_NAME', accountHolder: 'ACCOUNT_HOLDER', accountNumber: 'ACCOUNT_NUMBER', ifsc: 'IFSC', upi: 'UPI', sac: 'SAC' };
  const seller = Object.fromEntries(Object.entries(fields).map(([field, env]) => [field, process.env['INVOICE_' + env] || '']));
  return { ...seller, name: seller.name || 'LoomIQ', email: seller.email || 'loomiq2025@gmail.com', gstRegistered: false };
}
function financialYear(timestamp) {
  const date = new Date(timestamp + 330 * 60 * 1000);
  const start = date.getUTCFullYear() - (date.getUTCMonth() < 3 ? 1 : 0);
  return `${start}-${String(start + 1).slice(-2)}`;
}
// The caller saves the invoice and counter in the same payment transaction.
async function createInvoice(orderId, order, customer, tx) {
  if (order.invoice) return order.invoice;
  const year = financialYear(order.paidAt);
  const testMode = order.testMode !== false;
  const key = `${testMode ? 'test' : 'live'}:${year}`;
  const counter = await tx.get('invoice_counters', key);
  const sequence = (counter?.value || 0) + 1;
  await tx.put('invoice_counters', key, { value: sequence });
  const subtotal = Number.isSafeInteger(order.unitPrice) && order.unitPrice >= order.amount ? order.unitPrice : order.amount;
  return {
    number: `${testMode ? 'LIQ-TEST' : 'LIQ'}/${year}/${String(sequence).padStart(4, '0')}`,
    orderId, paymentId: order.paymentId, issuedAt: order.paidAt,
    plan: order.plan, amount: order.amount, subtotal, discount: subtotal - order.amount, gst: 0, quantity: 1, currency: 'INR',
    testMode,
    customer: order.billing || { name: customer.name, email: customer.email, company: customer.company },
    seller: order.seller || invoiceSeller(),
    subscription: order.subscription || { duration: 'One month', start: null, end: null },
    gateway: 'Razorpay',
    description: 'LoomIQ ERP - ' + order.plan + ' software subscription',
  };
}
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function renderInvoice(i) {
  const money = 'INR ' + (i.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Invoice ${escape(i.number)}</title><style>
  *{box-sizing:border-box}body{font:12px/1.5 Arial,Helvetica,sans-serif;color:#172033;background:#eef0f4;margin:0;padding:28px 16px}main{max-width:794px;min-height:1060px;margin:auto;background:white;border:1px solid #7c8290;display:flex;flex-direction:column}header{display:flex;justify-content:space-between;gap:24px;padding:24px 22px;border-bottom:2px solid #7c8290}h1{font-size:30px;line-height:1.2;color:#342c78;margin:0}h2{font-size:14px;margin:0}p{margin:5px 0}.tagline{color:#087c78;font-weight:bold}.muted{color:#566075}.badge{color:#087c78;font-weight:bold;display:inline-block;text-transform:uppercase;font-size:10px;letter-spacing:1px}.test{padding:12px 20px;background:#fff1d6;border-bottom:1px solid #7c8290;margin:0}.issued{padding:8px 20px;margin:0;border-bottom:1px solid #7c8290}.parties{display:grid;grid-template-columns:1fr 1fr;margin:0;border-bottom:1px solid #7c8290}.parties section{padding:18px 20px;overflow-wrap:anywhere}.parties section+section{border-left:1px solid #7c8290}.parties h2{font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;color:#566075}table{width:100%;border-collapse:collapse;table-layout:fixed;margin:0}th,td{border-right:1px solid #c0c4cb;border-bottom:1px solid #c0c4cb;padding:12px 10px;text-align:right;vertical-align:top;overflow-wrap:anywhere}th{background:#f0f1f4;font-size:10px}th:last-child,td:last-child{border-right:0}th:nth-child(2),td:nth-child(2){text-align:left}th:first-child,td:first-child{text-align:center}.item-row{height:280px}.total{font-size:14px;font-weight:700;background:#f7f7f9}.total td{vertical-align:middle}.payment-summary{padding:18px 20px;border-bottom:1px solid #7c8290;display:flex;justify-content:space-between;gap:20px}.payment-summary strong{color:#342c78;font-size:18px}.ref{overflow-wrap:anywhere;font-size:11px;padding:14px 20px;margin:0;border-bottom:1px solid #7c8290}footer{padding:18px 20px;font-size:11px}footer h2{font-size:11px;margin-bottom:8px}.generated{margin-top:auto;text-align:center;font-size:10px;color:#566075;padding:35px 20px 20px}.print-help{color:#566075}@page{size:A4;margin:12mm}@media(max-width:540px){body{padding:12px 8px}header{padding:18px;flex-wrap:wrap}h1{font-size:25px}.parties{grid-template-columns:1fr}.parties section+section{border-left:0;border-top:1px solid #7c8290}main{min-height:0}th,td{padding:8px 4px;font-size:10px}.item-row{height:160px}.payment-summary{flex-wrap:wrap}}@media print{.item-row{height:190px}.generated{padding:18px 20px 12px}body{padding:0;background:white;font-size:11px}main{max-width:none;min-height:270mm}.print-help{display:none}tr,section{break-inside:avoid}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><main>
  <header><div><h1>${escape(i.seller.name)}</h1><p class="tagline">ERP software for garment manufacturers</p><p class="muted">${escape(i.seller.email)}</p></div><div><h2>PAYMENT INVOICE</h2><p>${escape(i.number)}</p><span class="badge">${i.testMode ? 'Test payment' : 'Paid'}</span></div></header>
  ${i.testMode ? '<p class="test"><strong>TEST INVOICE</strong> — Simulated payment. No real money was collected.</p>' : ''}
  <p class="muted issued">Invoice date: ${escape(new Date(i.issuedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long' }))}</p>
  <div class="parties"><section><h2>Billed to</h2>${['name','company','email','address','city','state','phone'].map(k => i.customer[k] ? '<p>'+escape(i.customer[k])+'</p>' : '').join('')}</section><section><h2>From</h2><p>${escape(i.seller.name)}</p><p>${escape(i.seller.address)}</p>${i.seller.gstin ? '<p>GSTIN: '+escape(i.seller.gstin)+'</p>' : ''}</section></div>
  <table><colgroup><col style="width:6%"><col style="width:42%"><col style="width:8%"><col style="width:22%"><col style="width:22%"></colgroup><thead><tr><th scope="col">Sr.</th><th scope="col">Description of service</th><th scope="col">Qty</th><th scope="col">Rate</th><th scope="col">Amount</th></tr></thead><tbody><tr class="item-row"><td>1</td><td><strong>${escape(i.description)}</strong><p class="muted">One membership month · One-time payment</p></td><td>1</td><td>${money}</td><td>${money}</td></tr></tbody><tfoot><tr class="total"><td colspan="2">Total</td><td>1</td><td></td><td>${money}</td></tr></tfoot></table>
  <div class="payment-summary"><div><span class="badge">${i.testMode ? 'Test payment recorded' : 'Payment received in full'}</span><p>Balance due: INR 0.00</p></div><div>Total paid${i.testMode ? ' (test)' : ''}<p><strong>${money}</strong></p></div></div>
  <p class="ref">Order: ${escape(i.orderId)}<br>Payment: ${escape(i.paymentId)}</p><footer><h2>Terms / Notes</h2><p>This document records the membership payment. It is not a GST tax invoice; no GST breakdown has been supplied.</p><p>Questions? Contact ${escape(i.seller.email)}.</p><p class="print-help">To download as PDF, use your browser’s Print menu and choose Save as PDF.</p></footer>
  <p class="generated">This is a computer generated invoice.</p></main></body></html>`;
}
module.exports = { createInvoice, renderInvoice, invoiceSeller, financialYear };
