# Agency website

LoomiQ's homepage leads with digital marketing. ERP is a separate offering.

## Public routes

- `/`: agency homepage, initial consultation, services, approach, industries, interactive sample deliverables and compact ERP preview.
- `/digital-marketing`: marketing overview.
- `/services/meta-ads`, `/services/google-ads`, `/services/seo`, `/services/social-media-marketing`, `/services/performance-marketing`, `/services/lead-generation`: focused service landing pages.
- `/erp`: detailed software information and product tour.
- `/erp/pricing`: existing software pricing and signup/checkout links.
- `/garment-erp`: retained campaign landing page.

Service content and route metadata live in `frontend/src/agencyContent.ts`. The build emits static metadata, sitemap entries and `agency-routes.json`; the Express website handler reads this manifest to serve the new routes with HTTP 200 and matching metadata. Rebuild the frontend before starting the production backend.

## Consultation enquiries

The shared `ConsultationForm` posts to `/api/consultations` with full name, required phone, service and optional business/website. Email and project details are collected during follow-up. Server validation, a shared rate limiter and a honeypot protect submission. Requests are persisted in `supportRequests` with `kind: consultation`, source pathname and allowlisted UTM fields. Admin **Enquiries & support** shows the phone contact, source, service and attribution, with existing status and notes editing. Mail notifications are optional; notification failure does not discard a saved enquiry. A successful response confirms receipt and explains phone follow-up, not an appointment or sale. The email-based `/api/support` flow is preserved.

The SEO page preselects Website Audit. Other service pages preselect their service. Header and final CTAs keep visitors on the relevant consultation form.

## Content integrity

The campaign table is labelled as an illustrative measurement framework. No client testimonials or performance results are claimed. Add case studies only after receiving genuine project information and permission to publish.

ERP pricing remains independent from marketing fees and ad spend. ERP prices and checkout continue to use existing CMS and offer logic. `/erp` now has a general business-software layout and dedicated navigation, actual product screens, an optional demo route, comparison pricing, setup disclosure and buying FAQs. `/garment-erp` retains the configurable industry campaign layout. User/storage limits are explicitly left for confirmation; no numerical entitlements have been invented.

## Validation

From `frontend`, run `npm run build` and `npx playwright test e2e/home-landing.spec.ts e2e/digital-marketing.spec.ts`. These use an isolated backend fixture for enquiries and checkout navigation, plus desktop/mobile accessibility and viewport checks.


## November 2026 audit implementation

- Retained the purple brand and existing components, clarified homepage positioning and added direct WhatsApp links using the existing primary phone number.
- Added interactive campaign-brief, reporting-outline and SEO-review samples, explicitly labelled as illustrations.
- Added consent-aware `form_start`, `generate_lead`, `view_service`, `contact_whatsapp`, `view_erp_pricing` and `erp_product_tour_view` events. These contain no form fields. Existing verified purchase tracking remains in place.
- Converted five product-tour PNG previews to WebP (5.58 MB to 397 KB total); originals remain available in source. The tour is a screenshot walkthrough, not a recorded video.
- Removed pricing-section scarcity counts and unverified popularity badges; offer prices are shown only after the server confirms eligibility. Setup disclosures in pricing, checkout and terms distinguish customer registration from ERP workspace activation.
- Aligned bundled FAQ/refund content with the existing seven-day guarantee. Published CMS overrides must still be reviewed in the admin; no production content or database was changed.

### Remaining business inputs and external work

Supply approved client results, business/team details, verified plan entitlements, storage/user limits, support scope, data backup/export/retention arrangements and a real walkthrough video before adding claims about them. Confirm the existing primary phone is monitored on WhatsApp. Live GA4/Meta configuration, Search Console submission, real-user Core Web Vitals and production payment/email/ERP provisioning require the deployed environment. No real payment, message, or deployment was performed here.

### Validation on 20 November 2026

Frontend and admin production builds and frontend lint pass. Focused browser tests cover the marketing/ERP pages on desktop/mobile, 360–1440px layouts, accessibility, form success/error, product-tour controls and checkout entry. Backend consultation tests cover invalid input, spam rejection, persisted attribution, email failure and storage failure. The full backend run has 41 passes and six failures; running the affected suites from an unchanged HEAD export reproduced all six failures (stale commerce/offer expectations and purchase signup fixtures). These billing contracts were not changed for this presentation update.
