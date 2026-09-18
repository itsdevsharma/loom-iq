# Deployment and operations

The repository includes a customer portal, account recovery, email verification, an operator onboarding queue, invoice email requests, a single-domain container deployment, browser tests, and release configuration checks. These changes do not activate hosting, live payments, email accounts, or ERP workspaces automatically.

## Local development

Run `npm ci` in both `backend` and `frontend`. Start `npm run dev` in each directory. Wait for the backend listening message before using checkout. `npm run dev:local` in backend explicitly uses file storage and works on Windows and Linux. It does not silently replace MongoDB after a connection failure.

Copy missing settings from `backend/.env.example` into your private environment. Keep real credentials out of source control. `PUBLIC_SITE_URL` controls reset and verification links and must include a trailing slash. Local default: `http://localhost:5173/`.

## Single-domain production deployment

1. Choose the production domain and point DNS to a server with Docker Compose and ports 80/443 accessible.
2. Populate `backend/.env` with production database, email provider, payment, webhook, invoice business name/address, and a random operator token of at least 32 characters. Set `PUBLIC_SITE_URL=https://your-domain/` and `FRONTEND_ORIGIN=https://your-domain`. Also set the private `ERP_API_URL`, `ERP_LOGIN_URL`, and a 32+-character `ERP_MARKETING_INTEGRATION_TOKEN`. Staging may explicitly use `ALLOW_TEST_PAYMENTS=true` with test gateway keys.
3. Set `SITE_DOMAIN` in the root private `.env` used by Compose. Set optional public `VITE_GOOGLE_ANALYTICS_ID` and `VITE_META_PIXEL_ID` there for the build. See `meta-pixel.md` for consent and purchase-event behavior.
4. From backend, run `npm run check:release`. It reports missing setting names without exposing values.
5. From the repository root, run `docker compose up -d --build`. Caddy terminates HTTPS and forwards to the Node application, which serves both the built website and API. The API port is not publicly published. One trusted proxy hop is configured.
6. Check `https://your-domain/health`, signup, account, checkout, and route refreshes. Docker restarts crashed services. Configure an external monitor; Docker health status alone does not restart a still-running unhealthy process.

Configure the ERP with the same value as `LOOMIQ_MARKETING_INTEGRATION_TOKEN`, its public HTTPS `ERP_LOGIN_URL`, and a populated `DEMO_TEMPLATE_ORGANIZATION_ID`. Both services reject incomplete production integration settings. Test one Razorpay test-mode capture end-to-end against the deployed APIs, email inbox, and a real template tenant before release. Paid-demo conversion state is kept with the marketing order and retries with exponential backoff when the ERP is unavailable.

The existing GitHub Pages workflow remains a static preview deployment, now gated by lint, backend tests, and desktop/mobile browser tests. It supports direct route entry files. A `VITE_API_URL` repository variable may be used for preview APIs, but cross-site cookies are deliberately not enabled. Use the single-domain deployment for authenticated production purchases. A Pages preview without a same-site API cannot provide a working signed-in checkout.

## Demo requests returning 429 on Render

The marketing backend trusts the nearest reverse proxy when Render's `RENDER=true` flag is present. `TRUST_PROXY_HOPS` overrides this for other proxy topologies. Direct local servers do not trust forwarded headers. This keeps different visitors from sharing the proxy's IP for demo limits. See [Express proxy configuration](https://expressjs.com/en/guide/behind-proxies/).

Deploy the updated backend and frontend. Code requests and OTP verification have separate limits. The form prevents duplicate submissions and respects `Retry-After`. A missing upstream delay uses a 60-second pause before manual retry; the upstream limit may last longer.

If 429 continues, inspect ERP or gateway logs for `/api/integrations/marketing/demo-requests`. The previous generic ERP-unavailable message means the upstream failure had no JSON `message`, which can also happen at a gateway. Confirm proxy hops and gateway limits for the authenticated integration. The ERP's persisted per-IP window is one hour; old entries expire naturally. Do not disable rate limits or automatically resend OTP requests.

## Demo requests returning 502

The marketing backend can be healthy while its ERP dependency fails. Set `ERP_API_URL` on the marketing Render service to the ERP **backend origin**, without `/api` or a login path. Set `ERP_LOGIN_URL` separately to the browser login page. Editing `.env.example` does not change Render's deployed environment.

Check the failed request's JSON `code` and the corresponding `ERP integration request failed` log entry:

- `ERP_INVALID_RESPONSE`: upstream returned HTTP success without the expected JSON success envelope; HTML usually indicates the frontend URL or an intermediary page.
- `ERP_REDIRECT`: configure the final backend URL directly; integration credentials are never forwarded across redirects.
- `ERP_HTTP_ERROR`: inspect `upstreamStatus` in the log. A 502/503 requires checking ERP hosting/startup logs; a 401 requires checking the shared integration token.
- `ERP_CONNECTION_FAILED`: inspect `networkCode` for DNS, TLS, or connection failure.
- `ERP_TIMEOUT`: ERP did not finish within the request deadline.

These diagnostics exclude request data, integration tokens, OTPs, and upstream response bodies. Check ERP logs at the same UTC timestamp as the website request before changing limits or retry behavior.

## Payments and invoice delivery

Configure Razorpay to send signed `payment.captured` events to `/api/purchase/webhook` using the matching webhook secret. Verify successful capture, rejected signatures, late-payment refunds, and retry delivery on staging before activating live keys. Tests use a fake gateway and do not establish real gateway connectivity.

Users can view or save invoices in `/account` and on purchase confirmation. After email verification, they can request an invoice email attachment. Delivery is user-triggered, not automatically repeated by payment webhooks. Set the actual `INVOICE_BUSINESS_NAME` and `INVOICE_BUSINESS_ADDRESS`; no identity or address is fabricated. GST calculation and a GST tax-invoice workflow are not implemented. Review commercial policy wording and tax requirements for your business before release.

## Email

### Render Free: Resend over HTTPS

The shared mail service supports Resend's HTTPS API for demo OTPs/credentials, signup/reset messages, support notifications, sales notifications and invoice PDF attachments. It uses port 443, with a 15-second timeout and no automatic resend or SMTP fallback on failure.

1. Create a Resend account and [verify a domain you own](https://resend.com/docs/dashboard/domains/introduction), such as `loomiq.site`, using the DNS records Resend supplies.
2. Create an API key with permission to send from that domain. Keep it only in the marketing backend's Render environment.
3. Set these three variables on the **LoomIQ marketing backend** and redeploy the changed backend code:

   ```env
   MAIL_PROVIDER=resend
   RESEND_API_KEY=<your-new-resend-key>
   EMAIL_FROM=LoomIQ <noreply@loomiq.site>
   ```

   The sender above is an example and requires domain verification. A Gmail sender cannot be used as your verified domain sender. `SALES_EMAIL` and `ACCOUNT_NOTIFICATION_EMAIL` may remain Gmail recipient addresses. Old SMTP variables are ignored when `MAIL_PROVIDER=resend`; remove them from Render once migrated. No ERP email configuration change is required.
4. Submit a demo request and confirm acceptance/delivery in the Resend dashboard and receipt in the inbox. API acceptance is not proof of inbox delivery. `npm run check:services` checks Resend configuration presence only and does not send messages or validate a sending-only key through unrelated admin endpoints.

`MAIL_PROVIDER=smtp` remains available for local development or hosts that permit SMTP. With no explicit provider, a configured `RESEND_API_KEY` selects Resend; otherwise the legacy SMTP path is used. Production validation accepts either provider and requires the corresponding settings. See the [Resend send API](https://resend.com/docs/api-reference/emails/send-email).

Support, reset, verification, and invoice email require a configured email provider. Demo inquiries are persisted even when email delivery fails. With permission from the receiving mailbox owner, verify one support message, demo notification, reset link, verification link, and invoice email in staging. Automated tests mock delivery and never send real messages. Delivery failures need operational follow-up; there is no durable email retry queue.

`npm run check:services` performs read-only MongoDB and Razorpay API checks, plus SMTP authentication or Resend configuration checks without sending email or creating payment orders. Passing these checks does not prove inbox delivery or webhook receipt.

## Manual onboarding

From backend, `npm run onboarding` lists trial/purchase requests. After arranging access in the actual ERP, run:

```text
npm run onboarding -- customer@example.com in-progress
npm run onboarding -- customer@example.com active https://workspace.your-domain/
```

This records an existing workspace URL and makes it available in the customer's account. It does not create an ERP tenant or implement ERP authentication. Protect `ADMIN_API_TOKEN`; this tool is for trusted operators. It never places the token in frontend code. `OPERATOR_API_URL` can point at the production origin when operated remotely.

## Backup and recovery

Enable your database provider's scheduled backups and retention policy in the production account. The repository also provides encrypted application snapshots:

```text
npm run backup -- create /secure/backups/loomiq-2026-09-10.json.enc
npm run backup -- restore /secure/backups/loomiq-2026-09-10.json.enc loomiq_restore_verification
```

Set `BACKUP_PASSWORD` to a long random secret stored separately from archives. Create snapshots during a low-traffic period; the transaction reads the entire dataset into memory, so use provider-native backups for large datasets. Schedule the create command using your host scheduler, use unique filenames, retain encrypted copies off-host, and monitor failures. Restore only supports a new empty `loomiq_restore_*` database, verifies counts and recreates application indexes. It never drops or overwrites the live database. Test account/invoice reads against the restored database before considering a recovery drill complete. No live restore or backup schedule is activated by committing these files.

## Monitoring and release checks

Set GitHub repository variable `HEALTHCHECK_URL=https://your-domain/health` to enable the scheduled health workflow. Enable workflow failure notifications for the responsible operator. Schedules may be delayed; use a dedicated uptime service if you need tighter timing. `/health` checks database reachability and returns 503 on failure.

Run backend `npm test`, frontend `npm run lint`, and frontend `npm run test:e2e` before release. Install the browser once with `npx playwright install chromium`. The browser suite uses isolated temporary data, fake SMTP, and fake Razorpay with desktop and mobile viewports. Live gateway behavior, mailbox delivery, GA4 reporting, DNS/TLS, and provider backup retention still require checks in the configured service accounts.


## Commercial invoice configuration

Invoices are PDFs for a non-GST-registered supplier, labelled INVOICE with GST INR 0.00 and the explicit non-registration statement. Supplier GSTIN is not printed. This workflow does not calculate GST.

Set these Render/backend environment variables before taking new orders:

- `INVOICE_BUSINESS_NAME`, `INVOICE_BUSINESS_ADDRESS`, `INVOICE_PHONE`, `INVOICE_EMAIL`, `INVOICE_WEBSITE`, `INVOICE_PAN`.
- Optional: `INVOICE_CIN` (CIN/LLPIN), `INVOICE_SAC` (confirmed service classification).
- Optional payment details: `INVOICE_BANK_NAME`, `INVOICE_ACCOUNT_HOLDER`, `INVOICE_ACCOUNT_NUMBER`, `INVOICE_IFSC`, `INVOICE_UPI`.

Missing optional details are omitted. Business details and quoted price are saved when the order is created; subsequent configuration changes do not rewrite issued invoices. The customer can supply PAN, GSTIN, and a two-digit state code at checkout.

New live invoices use `LIQ/YYYY-YY/0001`, increasing within the April–March financial year in Asia/Kolkata. Test invoices use an independent `LIQ-TEST` sequence. Counters and invoices are committed together in the payment transaction, and counters are included in backups. Previously issued invoice numbers remain unchanged. Restore orders and counters from the same backup; do not reset production counters.

The current purchase covers one month, not an annual subscription. The invoice shows the duration and says dates are confirmed on activation unless an order already contains `subscription.start` and `subscription.end` timestamps. Older orders without a saved list price show the recorded payment as subtotal and zero discount; historical discounts are not reconstructed from current prices.
