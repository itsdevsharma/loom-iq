# Purchase confirmations and invoices

Verified captured payments receive an invoice snapshot on their MongoDB order record. The snapshot stores its stable reference, paid amount, plan, payment/order references, seller details, and the billing details collected at checkout. Repeated requests return the same document. Existing paid orders receive a snapshot on first access, using only the details already stored; missing historical addresses are not invented.

The confirmation page fetches authenticated payment data rather than trusting `type=purchase` in the URL. New redirects include the order ID. Older redirects without an order ID use the account's first stored paid order. Invoice and receipt endpoints require a session belonging to that paid order; unpaid, rejected, and other-account orders return no document.

Use **View & save invoice** on the confirmation page, then the browser Print menu → Save as PDF. The HTML is print-styled, escapes customer data, and disallows scripts. Test payments have a prominent test label. No invoice email is sent by this feature.

Set `INVOICE_BUSINESS_NAME`, `INVOICE_BUSINESS_ADDRESS`, and optionally `INVOICE_GSTIN` for future checkout snapshots. The current document is a membership payment invoice, not a GST tax invoice. Tax calculations, GST invoice numbering requirements, and tax breakdowns require a separately configured billing workflow. Existing issued snapshots do not silently change when configuration changes.

Validation covers authenticated ownership, refusal before payment, stable invoice numbers, billing fields, test marking, and escaped HTML. Backend tests mock the payment gateway.
