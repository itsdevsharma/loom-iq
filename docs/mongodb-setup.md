# MongoDB website storage

The Express backend uses the official MongoDB driver. With MongoDB configured, startup connects, verifies a ping, creates indexes, migrates local records, and only then listens for website requests. It does not fall back to JSON when MongoDB fails.

## Configuration

Keep credentials in the Git-ignored `backend/.env` or deployment secrets. Supply `MONGODB_HOST`, `MONGODB_USERNAME`, `MONGODB_PASSWORD`, and `MONGODB_DATABASE=loomiq`; alternatively use `MONGODB_URI`. Credentials never belong in frontend environment variables. Set `FRONTEND_ORIGIN` to the website origin. The development website proxies `/api` to port 3001; production should route `/api` to the backend on the same site with HTTPS and `NODE_ENV=production`.

Run `npm start` from `backend`. `/health` reports `storage: mongodb` after initialization. A missing host, rejected credentials, or unavailable cluster prevents startup. A request-time storage failure returns an error rather than acknowledging unsaved data.

## Stored records

- `customers`: profile, bcrypt password hash, signup timestamp, trial request/exclusion, purchase history.
- `sessions`: hashed session tokens and expiry. A TTL index removes expired sessions; every request also validates expiry.
- `visitors`: anonymous visitor identity and offer history.
- `orders`: server-calculated prices, deadlines, payment/refund results.
- `demoRequests`: contact-form submissions.
- `migrations`: completed one-time imports.

MongoDB transactions keep signup/account/session writes together and prevent trial/purchase races from granting two offers. Gateway calls occur outside retryable transactions. Unique account keys and an email index prevent duplicate registrations. Passwords and session tokens are not stored as plaintext.

At first startup, local `data/offers.json` and `data/demo-requests.json` are imported with insert-if-missing updates. MongoDB records are never overwritten by local ones. Local files remain as backups and are no longer used for website writes. The `local-json-v1` marker prevents repeat imports; if an import fails before completion, rerunning is safe. An explicit file adapter remains for offline automated tests/development without MongoDB configuration.

`GET /api/demo-requests` now requires `Authorization: Bearer <ADMIN_API_TOKEN>` so website visitors cannot download customer contact details. The token is server-only. Trial requests remain on customer records for the team to provision; this change does not create ERP tenants or automatically provision trials.

## Verification

- `npm test`: offline backend regression tests.
- `npm run test:mongodb` from `backend`: opt-in real Atlas integration checks. Creates a uniquely named `loomiq_verification_*` database and removes only that database afterward. Validates HTTP signup/login, stored password hashes and sessions, trial exclusion, durable state after repository recreation, pricing, concurrent signup, transaction rollback, safe migration, and demo submission storage.
- `npm run build --prefix frontend` and `npm run lint --prefix frontend`: website checks.

Use the same secret configuration on the deployment host; local configuration does not deploy the website. Existing limitations still apply: email verification, password recovery, ERP provisioning, and a durable refund retry worker are not implemented.
