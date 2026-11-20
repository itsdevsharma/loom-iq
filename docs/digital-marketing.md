# Agency website

LoomiQ's homepage leads with digital marketing. ERP is a separate offering.

## Public routes

- `/`: agency homepage, initial consultation, services, approach, industries, results policy and compact ERP preview.
- `/digital-marketing`: marketing overview.
- `/services/meta-ads`, `/services/google-ads`, `/services/seo`, `/services/social-media-marketing`, `/services/performance-marketing`, `/services/lead-generation`: focused service landing pages.
- `/erp`: detailed software information and product tour.
- `/erp/pricing`: existing software pricing and signup/checkout links.
- `/garment-erp`: retained campaign landing page.

Service content and route metadata live in `frontend/src/agencyContent.ts`. The build emits static metadata, sitemap entries and `agency-routes.json`; the Express website handler reads this manifest to serve the new routes with HTTP 200 and matching metadata. Rebuild the frontend before starting the production backend.

## Consultation enquiries

The shared `ConsultationForm` posts to the existing `/api/support` endpoint. Requests are stored in `supportRequests`, visible in the admin Support records, and use the selected service in the subject. Business details, optional phone number and goals are included in the message. Existing sales email notifications apply when configured. A successful response confirms receipt, not an appointment or a sale. No third-party booking integration is required.

The SEO page preselects Website Audit. Other service pages preselect their service. Header and final CTAs keep visitors on the relevant consultation form.

## Content integrity

The campaign table is labelled as an illustrative measurement framework. No client testimonials or performance results are claimed. Add case studies only after receiving genuine project information and permission to publish.

ERP pricing remains independent from marketing fees and ad spend. Published ERP layouts and prices continue to use the existing CMS and offer logic.

## Validation

From `frontend`, run `npm run build` and `npx playwright test e2e/home-landing.spec.ts e2e/digital-marketing.spec.ts`. These use an isolated backend fixture for enquiries and checkout navigation, plus desktop/mobile accessibility and viewport checks.
