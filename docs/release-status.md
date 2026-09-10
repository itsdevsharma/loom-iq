# Release status — 10 September 2026

## Implemented and checked

- Customer account portal with authenticated invoice history, including older paid orders.
- Logout with server-side session revocation; password reset with expiring single-use tokens and revocation of existing sessions; email verification.
- Invoice email requests to the verified account email; mocked email delivery tests.
- Trial request form, operator onboarding queue, progress status, and links to provisioned workspaces.
- Consistent one-time billing and 24-hour offer wording; updated account/privacy information and documentation.
- Offer initialization retries after a temporary API startup failure.
- Public route refresh handling, 404 responses, private-page noindex headers, sitemap updates, and account navigation.
- Optional analytics consent, with no analytics tag on private reset/verification URLs.
- Desktop/mobile layout checks, public-page and account accessibility scans, text-contrast fixes, and visible keyboard focus.
- Production container/HTTPS proxy configuration, environment validation, CI tests/image build, and configurable health monitoring.
- Encrypted backup and isolated restore tools; a real MongoDB restore verification completed using temporary test databases.
- Backend dependencies removed from Git tracking and retained on disk; dependency audit fixes applied.

## Validation results

- Frontend production build and lint passed.
- 29 backend tests passed.
- 12 desktop/mobile browser tests passed; the four affected browser tests passed again after the final account/consent styling adjustment.
- MongoDB integration and encrypted backup/restore checks passed; temporary verification databases were removed.
- Read-only MongoDB, SMTP authentication, and Razorpay test API connection checks passed. No real messages, payment orders, charges, or refunds were created by those checks.
- Both dependency audits reported zero vulnerabilities after updates.
- Compose and workflow YAML parsed successfully. Docker is unavailable on this workstation, so the image build is configured in CI and has not been executed here.

## Requires production information or service activation

- Production domain, hosting destination, DNS/TLS activation, and deployment.
- Actual `INVOICE_BUSINESS_NAME`, `INVOICE_BUSINESS_ADDRESS`, and `PUBLIC_SITE_URL`; current local release checks report these as missing. Production also requires the matching HTTPS origin and live payment credentials (or explicit staging mode).
- Live Razorpay activation, dashboard webhook configuration, and real capture/refund delivery verification.
- Mailbox delivery checks and production GA4 reporting checks. Authentication/connectivity checks alone do not prove delivery.
- Existing ERP workspace URLs and manual provisioning, or the actual ERP provisioning API if automation is required.
- Provider backup scheduling/retention, off-host archive storage, and monitoring variable/notification activation.
- Business review of policy wording and applicable invoice/tax requirements. No GST tax-invoice engine has been added.

See [deployment.md](deployment.md) for setup and operator commands. These external items are not marked complete because no production service configuration or business identity was supplied.
