# 24-hour purchase offer

The 50% offer lasts 24 hours from the first offer visit. The server stores `offerStartedAt` on the visitor and then the account. The deadline does not renew at midnight, on login, on another visit, or after purchase.

Signup is required to pay. Trial and paid accounts qualify while their original window remains open. Each checkout purchases one membership month. There are no automatic charges. After expiry, new checkouts use regular pricing.

`backend/daily-offer.js` retains its historical filename but implements the fixed 24-hour rule. Server time determines pricing. Order creation recalculates eligibility and stores the deadline. Late captured discounted payments are submitted for a full refund. A delayed signed webhook can establish that capture occurred before the deadline. Authorization alone does not confirm payment.

The account receipt fallback points to the latest successful purchase; order-specific links retrieve original invoices. The customer portal lists confirmed invoices and manual onboarding progress. Operators record a provisioned workspace URL after arranging ERP access.

Tests cover expiry, preserved account deadlines, trial eligibility, repeated and concurrent purchases, late-order refunds, signature validation, and invoice ownership. See deployment.md for release and onboarding commands.
