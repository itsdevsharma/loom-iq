# LoomIQ website

Marketing website, demo/trial requests, membership checkout, invoices, customer accounts, and manual workspace onboarding.

## Run locally

Install dependencies with `npm ci --prefix backend` and `npm ci --prefix frontend`. Copy missing settings from `backend/.env.example` into your private `backend/.env`.

Run these in separate terminals:

```text
npm run dev --prefix backend
npm run dev --prefix frontend
```

Open `http://localhost:5173`. The API listens on port 3001 after MongoDB initializes. Use backend `npm run dev:local` only when you explicitly want offline file storage.

## Validate

```text
npm test --prefix backend
npm run lint --prefix frontend
npm exec --prefix frontend -- playwright install chromium
npm run test:e2e --prefix frontend
```

Backend `npm run check:services` checks MongoDB and Razorpay connectivity, plus SMTP authentication or Resend configuration presence without sending messages or creating orders. `npm run test:mongodb` verifies persistence and encrypted backup/restore in temporary databases. `npm run check:release` checks production environment requirements.

## Deploy

Use the Docker Compose configuration for a single HTTPS origin serving both website and API. See [deployment and operations](docs/deployment.md) for domain setup, production credentials, invoice details, onboarding, backups, and monitoring. GitHub Pages remains a static preview.

Customers manage email verification, invoices, trial requests, and workspace access at `/account`. Password recovery starts at `/forgot-password`. A paid ERP demo converts its existing tenant automatically; a purchase without a demo remains available for operator-assisted onboarding with `npm run onboarding`.

ull Stack Developer Intern 
## ERP demo integration

The marketing backend is the only service that talks to the ERP backend. Configure
these private variables in `backend/.env` (never prefix them with `PUBLIC_`):

```env
ERP_API_URL=https://your-erp-api.example
ERP_MARKETING_INTEGRATION_TOKEN=<shared-long-random-value>
ERP_LOGIN_URL=https://erp.your-domain.example/login
```

Set the same value as `LOOMIQ_MARKETING_INTEGRATION_TOKEN` in the ERP backend.
Set `DEMO_TEMPLATE_ORGANIZATION_ID` there to the populated template tenant's
MongoDB ObjectId. Production startup rejects a blank or malformed template ID
so a deployment cannot silently issue empty demo workspaces.
The marketing site requests and emails verification codes, while the ERP creates
the isolated three-hour tenant and enforces its expiry. A verified Razorpay
payment converts that matching demo tenant to a paid workspace automatically.

### ERP activity in the admin

After a demo is verified, Customer activity shows its status (active, suspended,
or expired), expiry, username, login URL, usage totals, feedback, and lifecycle
events. Temporary passwords are never stored and cannot be retrieved. To report
actual ERP usage, have the ERP POST to
`/api/integrations/erp/demo-activity` with the integration-key header,
`demoRequestId`, a type of `erp_login`, `erp_logout`, `record_created`,
`record_updated`, `report_viewed`, `demo_suspended`, `demo_resumed`, or
`feedback_submitted`. For feedback, send the customer comment in `feedback`
(or `detail`); all event detail must be non-sensitive. Never send passwords,
tokens, or ERP record contents in this feed.
