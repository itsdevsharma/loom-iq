const PDFDocument = require('pdfkit');

// Generate from the saved invoice snapshot, so later account edits do not
// change the seller, customer, payment date, or amount on an issued invoice.
function renderInvoicePdf(invoice) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 28, info: { Title: `Invoice ${invoice.number}`, Author: 'LoomIQ' } });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    try {
      const left = 28, width = doc.page.width - 56, right = left + width;
      const seller = invoice.seller || {}, customer = invoice.customer || {};
      const money = 'INR ' + (invoice.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const formatAmount = value => 'INR ' + (value / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const subtotal = invoice.subtotal ?? invoice.amount;
      const discount = invoice.discount ?? 0;
      const text = value => String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
      const font = (bold = false, size = 9) => doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size).fillColor('#172033');
      const height = (value, w, bold = false, size = 9) => font(bold, size).heightOfString(text(value), { width: w });
      const write = (value, x, y, w, bold = false, size = 9, align = 'left') => font(bold, size).text(text(value), x, y, { width: w, align });
      const line = (x, y, x2, y2 = y) => doc.lineWidth(0.6).moveTo(x, y).lineTo(x2, y2).stroke('#858996');
      const box = (y, h, fill) => {
        if (fill) doc.rect(left, y, width, h).fill(fill);
        doc.rect(left, y, width, h).lineWidth(0.6).stroke('#858996');
      };
      const footer = () => write('This is a computer generated invoice.', left, 797, width, false, 8, 'center');
      const ensureSpace = (y, needed) => {
        if (y + needed <= 780) return y;
        footer(); doc.addPage();
        write(`${text(seller.name || 'LoomIQ')} | Invoice ${text(invoice.number)} (continued)`, left, 30, width, true, 10);
        return 58;
      };
      let y = 36;
      const name = text(seller.name || 'LoomIQ');
      font(true, 23).fillColor('#2f2b72').text(name, left + 10, y, { width: width - 20 });
      y += height(name, width - 20, true, 23) + 7;
      font(true, 9).fillColor('#0f766e').text('ERP software for garment manufacturers', left + 10, y, { width: width - 20 });
      y += 20;
      for (const value of [seller.address, seller.phone && `Phone: ${seller.phone}`, seller.email && `Email: ${seller.email}`, seller.website && `Website: ${seller.website}`, seller.pan && `PAN: ${seller.pan}`, seller.cin && `CIN / LLPIN: ${seller.cin}`].filter(Boolean)) {
        write(value, left + 10, y, width - 20, false, 8);
        y += height(value, width - 20, false, 8) + 5;
      }
      doc.rect(left, 28, width, y - 20).stroke('#858996');
      y += 8;
      box(y, 35, '#f5f5f8');
      write('INVOICE', left, y + 5, width, true, 12, 'center');
      write('ORIGINAL FOR RECIPIENT', left, y + 21, width, false, 7, 'center');
      y += 35;
      if (invoice.testMode) {
        box(y, 27, '#fff1d6');
        write('TEST INVOICE - Simulated payment. No real money was collected.', left + 10, y + 8, width - 20, true, 8);
        y += 27;
      }
      const half = width / 2, cellWidth = half - 20;
      let customerY = y + 12;
      write('BILLED TO', left + 10, customerY, cellWidth, true, 8); customerY += 18;
      const customerLines = [customer.company, customer.name, customer.address, [customer.city, customer.state].filter(Boolean).join(', '), customer.email, customer.phone && `Phone: ${customer.phone}`, customer.stateCode && `State code: ${customer.stateCode}`, customer.pan && `PAN: ${customer.pan}`, customer.gstin && `GSTIN: ${customer.gstin}`].filter(Boolean);
      customerLines.forEach((value, index) => {
        write(value, left + 10, customerY, cellWidth, index === 0);
        customerY += height(value, cellWidth, index === 0) + 5;
      });
      let metaY = y + 12;
      const metadata = [
        ['Invoice number', invoice.number],
        ['Invoice date', new Date(invoice.issuedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long' })],
        ['Payment status', invoice.testMode ? 'Test payment' : 'PAID'],
        ...(customer.state ? [['Place of supply / State', customer.state]] : []),
        ['Payment reference', invoice.paymentId || '-'],
      ];
      for (const [label, value] of metadata) {
        write(label, left + half + 10, metaY, cellWidth, false, 8); metaY += 12;
        write(value, left + half + 10, metaY, cellWidth, true);
        metaY += height(value, cellWidth, true) + 9;
      }
      const detailsHeight = Math.max(customerY, metaY) - y + 8;
      box(y, detailsHeight); line(left + half, y, left + half, y + detailsHeight);
      y += detailsHeight;
      const columns = [26, width - 26 - 32 - 90 - 90, 32, 90, 90];
      const subscription = invoice.subscription || { duration: 'One month' };
      const formatDate = value => new Date(value).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
      const period = subscription.start && subscription.end ? `${formatDate(subscription.start)} - ${formatDate(subscription.end)}` : `${subscription.duration || 'One month'}; dates confirmed on activation`;
      const description = `${invoice.description} | Plan: ${invoice.plan || '-'} | Subscription period: ${period}${seller.sac ? ' | SAC: ' + seller.sac : ''}`;
      const descriptionHeight = height(description, columns[1] - 12, true, 9) + 28;
      y = ensureSpace(y, 28 + descriptionHeight + 24);
      const itemHeight = Math.max(descriptionHeight, 430 - y);
      box(y, 25, '#f1f1f1');
      let x = left;
      ['Sr.', 'Description of service', 'Qty', 'Rate', 'Amount'].forEach((label, index) => {
        write(label, x + 4, y + 8, columns[index] - 8, true, 8, index === 1 ? 'left' : 'center'); x += columns[index];
      });
      const itemY = y + 25;
      box(itemY, itemHeight);
      x = left;
      ['1', description, '1', formatAmount(subtotal), formatAmount(subtotal)].forEach((value, index) => {
        write(value, x + 6, itemY + 12, columns[index] - 12, index === 1, 9, index < 3 ? (index === 1 ? 'left' : 'center') : 'right');
        if (index > 0) line(x, y, x, itemY + itemHeight);
        x += columns[index];
      });
      y = itemY + itemHeight;
      box(y, 25, '#f7f7f7');
      write('Total', left + 10, y + 8, width - 115, true, 9);
      write(formatAmount(subtotal), right - 100, y + 8, 90, true, 9, 'right');
      y += 25;
      const refHeight = height(`Order: ${text(invoice.orderId)}`, half - 20, false, 8);
      const summaryHeight = Math.max(150, refHeight + 44);
      y = ensureSpace(y, summaryHeight);
      box(y, summaryHeight); line(left + half, y, left + half, y + summaryHeight);
      write(invoice.testMode ? 'Test payment recorded' : 'Payment received in full', left + 10, y + 12, half - 20, true);
      write(`Order: ${text(invoice.orderId)}`, left + 10, y + 32, half - 20, false, 8);
      [['Subtotal', formatAmount(subtotal)], ['Discount', formatAmount(discount)], ['GST', 'INR 0.00'], ['Total amount payable', money], ['Amount paid', money], ['Balance due', 'INR 0.00']].forEach(([label, value], index) => {
        write(label, left + half + 10, y + 12 + index * 22, half - 120, index === 3);
        write(value, right - 110, y + 12 + index * 22, 100, index === 3, 9, 'right');
      });
      y += summaryHeight;
      const paymentLines = [
        `Payment gateway: ${invoice.gateway || 'Razorpay'}`,
        seller.bankName && `Bank: ${seller.bankName}`,
        seller.accountHolder && `Account holder: ${seller.accountHolder}`,
        seller.accountNumber && `Account number: ${seller.accountNumber}`,
        seller.ifsc && `IFSC: ${seller.ifsc}`,
        seller.upi && `UPI ID: ${seller.upi}`,
      ].filter(Boolean);
      const paymentText = paymentLines.join(' | ');
      const paymentHeight = height(paymentText, width - 20, false, 8) + 24;
      y = ensureSpace(y, paymentHeight);
      box(y, paymentHeight);
      write(paymentText, left + 10, y + 12, width - 20, false, 8);
      y += paymentHeight;
      const notes = `GST not charged - Supplier is not registered under GST. This is a commercial invoice and not a GST tax invoice. GST has not been charged as the supplier is not registered under GST. For any queries regarding this invoice, please contact ${text(seller.email || 'loomiq2025@gmail.com')}.`;
      const notesHeight = height(notes, width - 20, false, 8) + 36;
      y = ensureSpace(y, notesHeight + 40);
      box(y, notesHeight);
      write('Terms / Notes', left + 10, y + 10, width - 20, true, 8);
      write(notes, left + 10, y + 26, width - 20, false, 8);
      y += notesHeight;
      y = ensureSpace(y, 40);
      write(`For ${name} | Authorized Signatory`, left, y + 14, width - 10, true, 8, 'right');
      footer();
      doc.end();
    } catch (error) { doc.destroy(); reject(error); }
  });
}
module.exports = { renderInvoicePdf };
