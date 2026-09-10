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

Backend `npm run check:services` checks MongoDB, SMTP authentication, and Razorpay connectivity without sending messages or creating orders. `npm run test:mongodb` verifies persistence and encrypted backup/restore in temporary databases. `npm run check:release` checks production environment requirements.

## Deploy

Use the Docker Compose configuration for a single HTTPS origin serving both website and API. See [deployment and operations](docs/deployment.md) for domain setup, production credentials, invoice details, onboarding, backups, and monitoring. GitHub Pages remains a static preview.

Customers manage email verification, invoices, trial requests, and workspace access at `/account`. Password recovery starts at `/forgot-password`. ERP tenant creation is performed by the onboarding team in the actual ERP system, then the workspace URL is recorded using `npm run onboarding` in backend.
