# Deployment and operations

The repository includes a customer portal, account recovery, email verification, an operator onboarding queue, invoice email requests, a single-domain container deployment, browser tests, and release configuration checks. These changes do not activate hosting, live payments, email accounts, or ERP workspaces automatically.

## Local development

Run `npm ci` in both `backend` and `frontend`. Start `npm run dev` in each directory. Wait for the backend listening message before using checkout. `npm run dev:local` in backend explicitly uses file storage and works on Windows and Linux. It does not silently replace MongoDB after a connection failure.

Copy missing settings from `backend/.env.example` into your private environment. Keep real credentials out of source control. `PUBLIC_SITE_URL` controls reset and verification links and must include a trailing slash. Local default: `http://localhost:5173/`.

## Single-domain production deployment

1. Choose the production domain and point DNS to a server with Docker Compose and ports 80/443 accessible.
2. Populate `backend/.env` with production database, SMTP, payment, webhook, invoice business name/address, and a random operator token of at least 32 characters. Set `PUBLIC_SITE_URL=https://your-domain/` and `FRONTEND_ORIGIN=https://your-domain`. Staging may explicitly use `ALLOW_TEST_PAYMENTS=true` with test gateway keys.
3. Set `SITE_DOMAIN` in the root private `.env` used by Compose. Set optional public `VITE_GOOGLE_ANALYTICS_ID` there for the build.
4. From backend, run `npm run check:release`. It reports missing setting names without exposing values.
5. From the repository root, run `docker compose up -d --build`. Caddy terminates HTTPS and forwards to the Node application, which serves both the built website and API. The API port is not publicly published. One trusted proxy hop is configured.
6. Check `https://your-domain/health`, signup, account, checkout, and route refreshes. Docker restarts crashed services. Configure an external monitor; Docker health status alone does not restart a still-running unhealthy process.

The existing GitHub Pages workflow remains a static preview deployment, now gated by lint, backend tests, and desktop/mobile browser tests. It supports direct route entry files. A `VITE_API_URL` repository variable may be used for preview APIs, but cross-site cookies are deliberately not enabled. Use the single-domain deployment for authenticated production purchases. A Pages preview without a same-site API cannot provide a working signed-in checkout.

## Payments and invoice delivery

Configure Razorpay to send signed `payment.captured` events to `/api/purchase/webhook` using the matching webhook secret. Verify successful capture, rejected signatures, late-payment refunds, and retry delivery on staging before activating live keys. Tests use a fake gateway and do not establish real gateway connectivity.

Users can view or save invoices in `/account` and on purchase confirmation. After email verification, they can request an invoice email attachment. Delivery is user-triggered, not automatically repeated by payment webhooks. Set the actual `INVOICE_BUSINESS_NAME` and `INVOICE_BUSINESS_ADDRESS`; no identity or address is fabricated. GST calculation and a GST tax-invoice workflow are not implemented. Review commercial policy wording and tax requirements for your business before release.

## Email

Support, reset, verification, and invoice email require SMTP settings. Demo inquiries are persisted even when email delivery fails. With permission from the receiving mailbox owner, verify one support message, demo notification, reset link, verification link, and invoice email in staging. Automated tests mock delivery and never send real messages. Delivery failures need operational follow-up; there is no durable email retry queue.

`npm run check:services` performs read-only MongoDB, SMTP authentication, and Razorpay API checks without sending email or creating payment orders. Passing these checks does not prove inbox delivery or webhook receipt.

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
