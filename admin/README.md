# LoomIQ CMS admin

Run the backend on port 3001, then `npm install` and `npm run dev` in this directory. Open http://localhost:5174/admin/ and sign in with an existing admin account. The Vite proxy preserves the browser host for backend origin checks and excludes source-module requests from API proxying.

## Deployment on loomiq.site

The existing website Vercel project builds both apps into `frontend/dist`, with admin assets under `dist/admin`. No separate admin domain or paid instance is required.

In that Vercel project's settings, keep **Root Directory: frontend** and enable **Include source files outside of the Root Directory in the Build Step** so `admin` and `shared` are available. The checked-in `frontend/vercel.json` sets the install/build commands and output directory. Deploy the commit containing these changes. See [Vercel monorepo settings](https://vercel.com/docs/monorepos/monorepo-faq).

Routes on the existing canonical domain:

| URL | Purpose |
| --- | --- |
| `/admin/` | Admin overview (requires sign-in) |
| `/admin/login` | Admin sign-in |
| `/admin/website` | Website editor |
| `/admin/content` | Custom pages |
| `/admin/media` | Media library |
| `/admin/customers` | Customers |
| `/admin/payments` | Payment analytics |
| `/admin/records` | Customer activity |

`/api/admin/...` continues through the existing Vercel rewrite to the marketing Render backend; the ERP backend is not involved. Keep `FRONTEND_ORIGIN=https://www.loomiq.site` for the current canonical website. Sign in with an existing admin account; customer accounts and `ADMIN_API_TOKEN` are not admin login credentials. No default account is created by this deployment.

To build the combined artifact locally, install dependencies in `frontend` and `admin`, then run `npm --prefix frontend run build:with-admin` from the repository root. Production SPA rewrites send `/admin` and nested admin URLs to the admin entry point, leaving the public homepage and customer account routes in the marketing app.

The workspace includes content counts, recent pages, search and status filtering, draft creation, section editing, live preview, SEO and social metadata, version restore, and a media library. Saving a published page updates the working copy; publish updates to release the content. Unsaved edits trigger a navigation warning. Saves include a modification timestamp to reject stale edits from another editor.

Media is stored in `MEDIA_STORAGE_PATH` (defaults to `backend/data/media`), including when content uses MongoDB. Configure a persistent writable volume and backups for production. Supported uploads: JPEG, PNG, WebP, GIF, MP4, WebM, up to 20 MB each. Removing a media entry hides it from the library; existing asset URLs remain available to avoid breaking published pages.

## Verification

- `npm run build`: TypeScript and production build.
- `npm run test:e2e`: production-build browser test using an isolated temporary file repository and temporary credentials. Requires backend and frontend dependencies (Playwright is supplied by the frontend) and an installed Chromium browser.
- `cd ../backend && npm test`: backend tests including CMS lifecycle, published snapshots, stale saves, duplicate slugs, preview reuse, uploads, and MongoDB ID mapping.

Tests do not modify the development database. MongoDB ID mapping is checked with a database double; a live MongoDB deployment is not covered by this browser test. Publishing exposes the content through `/api/content`; public website rendering must consume those endpoints.

## Website-wide management

**Website content** edits the existing website. The checked-in catalog at `shared/website-content.json` contains the original content and editor metadata. It covers the homepage, navigation, footer/social/contact links, images, section lists, FAQs, legal policies, signup/payment/account screens, confirmation screens, form messages, cookie-consent copy, and SEO titles/descriptions. The Site group controls homepage order/visibility and checkout pricing. Extra homepage sections can be enabled from the section selector.

Structured lists have add/remove/reorder controls. Built-in checkout plan identifiers remain fixed. Pricing fields are centralized under Site; `{discount}`, `{starterOffer}`, `{starterRegular}`, `{growthOffer}`, `{growthRegular}`, and `{enterpriseRegular}` interpolate published prices in copy. Keep those placeholders when editing promotional wording. Numeric `{0}` placeholders represent values such as customer names or checkout totals.

Use **Save draft**, then **Publish website** to make the entire draft live. Published snapshots support restoring an earlier version to draft. Revision checks prevent overwriting another editor's changes. The public site loads published content before rendering, with bundled defaults if the API is unavailable. Reload the public site after publication. Existing orders retain their original prices; new quotes and orders use published prices. The fixed 24-hour offer expiry and payment verification are application rules, not copy fields.

**Custom pages** creates additional public URLs using the section editor. **Customer activity** lists enquiries, support tickets, customers, and orders; it supports enquiry/support status and internal notes, and customer onboarding status/workspace URLs. Order amounts and payment status cannot be manually rewritten. Passwords, session tokens, payment secrets, and infrastructure configuration are not exposed as CMS content. Customer records require `records.read` / `records.write`; website editing uses `content.read` / `content.write` / `content.publish`. Superadmins have these permissions.

Support submissions are persisted in `supportRequests`; email becomes a notification rather than the only copy. Back up `website_content`, `website_versions`, and `supportRequests` along with existing collections and uploaded files.

The browser regression test now also edits a homepage field, verifies draft isolation, publishes it, checks the public website, validates price synchronization, and opens a custom public page. It runs against temporary repositories without changing live content.

## Customers and Razorpay analytics

**Customers** shows website signups, registration dates, email verification, trial/onboarding status, orders, and live captured totals. Open a customer to set a Starter or Growth price in INR, optionally expire it, or restore website pricing. Every change requires a reason, records the admin and timestamp, and rejects stale revisions. Overrides apply to new checkout orders for that signed-in customer; existing orders and captured payment amounts stay unchanged. Overrides do not create subscriptions or automatically charge customers.

**Razorpay analytics** filters website orders by live/test/unknown mode, period, customer, order/payment ID, and payment status. It shows captured amounts, refunds, net before gateway fees, paying customers, pending orders, failed attempts, and daily totals. The per-order refresh uses Razorpay's read-only order payments API. Refund and failure information is as current as the last refresh; these are website-order analytics, not a complete merchant settlement ledger. Unknown legacy modes are kept separate from live revenue.

Customer lookup requires `records.read`, analytics requires `billing.read`, and changing customer pricing requires `billing.write`. Superadmins have all three. Gateway secrets remain server-side. Tests use temporary customers and a mocked Razorpay gateway; they never charge real accounts.
