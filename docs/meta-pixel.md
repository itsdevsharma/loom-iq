# Meta Pixel and purchase tracking

The global `frontend/index.html` head loads Pixel `1811066650319146` and sends one PageView per document immediately, including before analytics consent and on account recovery pages. The ID is configured directly in that script; environment Pixel overrides no longer control it. The application reuses this tracker without initializing it or sending PageView again.

Additional application events and GA require `loomiq-analytics=granted`. Reset-password and verify-email routes skip these additional events. Purchase uses the server-confirmed amount and event ID.

| Event | Trigger |
|---|---|
| PageView | Global head loads, once per document |
| ViewContent | Homepage or `/garment-erp` viewed with Pixel enabled |
| InitiateCheckout | Signed-in checkout obtains a server quote; once per plan/amount per document |
| CompleteRegistration | Account signup successfully returns |
| Purchase | Owned real paid order is atomically claimed from `/api/purchase/conversion/:orderId` after authenticated receipt retrieval |

Purchase value is the server's stored amount in paise divided by 100, currency INR. `eventID` is `purchase_<order ID>`. GA receives the same value and order ID as `transaction_id`. An expired/rejected/uncaptured/unowned/test order cannot produce a claim. A bare thank-you URL cannot produce a Purchase. Concurrent browser claims, refreshes, and another device receive at most one claim for an order.

The existing Razorpay signature, amount, currency and captured-status checks remain the source of payment truth. Settlement is idempotent. Captured duplicate first-purchase discounts and expired discounted captures are rejected/refunded rather than activated.

This browser-only design does not guarantee delivery. If a network request or tag delivery fails after the server claim, the event can be lost; it is not automatically re-fired. If CAPI is added later, use a durable delivery queue and the **same event ID** for browser/server deduplication. Do not run separate URL-based Purchase rules in Meta or GTM.

## Verification

Backend tests cover consent, ownership, paid/test states, repeated claims, concurrent claims, forged signatures, capture status, repeat-discount prevention and refunds. Browser tests stub all provider/tag requests; they do not charge or send test conversions.

```sh
cd frontend
PUBLIC_META_PIXEL_ID=123456789012345 npm run test:e2e
# Test fixture only; rebuild your release with the real ID or no ID afterward.
```

In staging, use the actual Pixel and Meta Test Events to verify PageView → consent → product view → signup → checkout. Test gateway purchases intentionally do not emit Purchase. Use a controlled real captured transaction to verify production Purchase delivery, actual amount, INR, and a single event on reload. Confirm the signed Razorpay webhook independently. Review [Meta's conversion tracking documentation](https://developers.facebook.com/docs/meta-pixel/implementation/conversion-tracking/) when configuring Events Manager; dashboard delivery has not been verified here.
