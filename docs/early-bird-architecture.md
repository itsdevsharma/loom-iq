# Daily purchase offer

The 50% offer runs in shared daily windows, midnight to midnight Asia/Kolkata (IST). It renews automatically at midnight; no cron job or signup-based timer is required. The interface explicitly states that it renews daily.

Anonymous visitors see the daily offer and countdown. Signup/sign-in is still required to pay. New and returning purchasers qualify, including customers with previous successful test or live orders. Each eligible checkout discounts one membership month. Customers who selected a free trial remain excluded, including after rollover. No trial history or past invoice is reset.

`backend/daily-offer.js` determines the current day's deadline from server time. The frontend displays the same schedule and rolls the countdown forward at midnight. Order creation calculates eligibility and price again, storing the order's deadline. A checkout left open past its stored deadline cannot carry that order forward: late captured discounted payments are refunded through the existing webhook path. A fresh checkout uses the renewed daily offer.

MongoDB persistence, payment verification, invoice ownership, and signup requirements remain in place. Past purchases no longer consume eligibility. The account receipt fallback now points to the latest successful purchase, while order-specific invoice links continue to retrieve the original invoice.

Tests cover a common deadline, IST midnight rollover, multiple-day renewal, returning customers, trial exclusions, repeated and concurrent discounted purchases, late-order refunds, and authenticated invoices. See mongodb-setup.md and invoices.md for storage and invoicing setup.
