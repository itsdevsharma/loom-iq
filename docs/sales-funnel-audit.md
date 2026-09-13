# LoomIQ sales funnel audit — 13 September 2026

## Scope and evidence

Inspected the homepage and all reusable marketing sections, CMS catalog and page routing, signup/login/recovery, checkout and gateway verification, confirmation/invoices, account/onboarding, policies, support/demo forms, consent/analytics, SEO/build output, assets, responsive styles, deployment and existing tests. The working tree already contained extensive CMS/admin/account changes; these were retained.

The repository contains the marketing website, commerce/customer portal, and CMS/admin service. It does **not** contain the garment ERP itself. The existing 1440×921 dashboard asset shows a generic business overview with example USD revenue, CRM, marketing, and AI insights. Its origin as an actual garment ERP screenshot cannot be verified. It is now explicitly labeled as an interface preview with example data. No screenshots, customers, product results, or certifications were fabricated.

## Before → after

| Area | Audit finding | Implemented result |
|---|---|---|
| Positioning | Generic growing-business ERP headline | Garment/clothing-specific hero and outcome |
| Ad landing | No dedicated sales landing route | `/garment-erp`, matching Excel/WhatsApp messaging, reduced navigation |
| Page sequence | Demo-led; product demo, comparison, final CTA omitted from default layout | Preview → before/after → core areas → workflow → pricing → trust → FAQ → purchase CTA |
| Product proof | Generic image presented as manufacturing UI | Honest preview labeling, full-size link, keyboard/touch scrolling; unsupported detailed modules removed |
| Pricing | Existing ₹1,990/₹2,990 plans; speculative advanced features and popularity badge | Prices preserved; regular and offer rates explicit; unverified entitlements disclosed; popularity claim removed |
| Offer | 24-hour server deadline existed, but repeat purchases qualified | First-purchase eligibility enforced in quote and settlement, including concurrent captures; second discounted capture refunded |
| Purchase | Account existed, but signup returned to a choice/demo step | A selected plan goes directly from signup to checkout; account name/company prefilled |
| Checkout | Exact server quote existed; setup information easy to miss | Prominent manual-setup disclosure, corrected customer-price summary, pending-payment status link; repeat payment disabled after provider success |
| Support | Email/form and operator onboarding existed | Visible support, clear account/invoice/setup journey; optional demo form retained at `/demo` |
| Trust | Vague compliance wording and fake social link destinations | Only implemented account/payment controls described; placeholder social links removed |
| FAQ | Seven primarily demo/product questions | Fourteen concise purchase, billing, setup, security and capability answers |
| Tracking | Consent-gated GA; no Meta Pixel or verified Purchase event | Optional Pixel PageView, ViewContent, InitiateCheckout, CompleteRegistration, Purchase; GA begin_checkout/purchase; stable order event ID |
| Deduplication | No purchase conversion mechanism | Atomic authenticated server claim, owned real paid orders only, one claim across devices/reloads; no test/forged/unpaid conversion |
| Mobile/accessibility | CTA disappears in mobile header; oversized preview risks | Sticky purchase CTA, scrollable/focusable images, readable comparison, contrast fixes; consent is nonmodal |
| Performance | Every account/legal/checkout module loaded on homepage | Lazy route chunks, existing 68 KB WebP reused, lazy lower preview, explicit dimensions; CMS timeout reduced from 5s to 1.5s with bundled defaults |
| SEO/deployment | Generic metadata and no ad route | Garment metadata, server-rendered social/canonical tags, sitemap and static route entry; Docker copies shared catalog and passes Pixel build arg |

## Final requirement checklist

- [x] Garment/clothing audience, clear outcome, purchase CTA, consistent pricing.
- [x] Ad-matched landing page, minimal navigation, comparison, workflow overview, outcome copy.
- [x] Pricing visible without login, regular and discounted prices, real fixed deadline, first-purchase enforcement.
- [x] Signup → checkout → verified payment → invoice/account; no sales call required to pay.
- [x] One-month billing, no automatic charges, policies/support, and manual setup disclosed before payment.
- [x] Product preview and full-size view; no fabricated social proof, certifications, scarcity, or unsupported detailed manufacturing stages.
- [x] FAQ, final CTA, mobile purchase CTA, keyboard access and responsive layouts.
- [x] Meta/GA consent, private token-page exclusions, checkout events and authenticated/deduplicated real-payment conversion claims.
- [x] Account/recovery, trial requests, invoices, CMS editing and optional demo functionality retained.
- [x] SEO route metadata, sitemap, static route entry, optimized existing image, lazy private routes.
- [ ] Verified garment ERP screenshots, real module demo, and 60–90 second video: not supplied.
- [ ] Verified Starter/Growth entitlements, user/location limits, migration/training scope and job-work/stage evidence: not supplied.
- [ ] Instant ERP activation: no provisioning API is present. Existing team-assisted setup remains explicit.
- [ ] Live deployment, real gateway/capture/webhook/refund, mailbox delivery, and Meta Events Manager delivery: require production configuration; mocked tests do not establish these.
- [ ] Proven paid-ad conversion rate or acquisition cost: no campaign/customer outcome data available.

## Configuration and remaining risks

1. Set the real public `VITE_META_PIXEL_ID` at frontend **build time** (or root Compose environment) and rebuild. No production Pixel ID was invented. CI uses an intercepted test fixture only. Keep automatic/event-tool Purchase rules disabled so they cannot duplicate the application event. Verify in Meta Events Manager before buying traffic.
2. The existing production release check reports missing `PUBLIC_SITE_URL`, `FRONTEND_ORIGIN`, `ADMIN_API_TOKEN`, SMTP host/user/password, `SALES_EMAIL`, invoice business name/address, and Razorpay key/secret/webhook secret. Populate actual settings and rerun `npm run check:release` in backend. Tax calculation/GST invoices and contractual policy details remain as previously implemented, not newly promised.
3. Configure Razorpay signed `payment.captured` webhooks at `/api/purchase/webhook`. There is no Conversions API integration. A browser conversion can be missed if the buyer never returns, refuses consent, blocks scripts, or loses connectivity after claiming the event. The server claim prioritizes preventing duplicates; it is **not** guaranteed delivery or a CAPI queue.
4. CMS **published overrides take precedence** over updated bundled defaults. The existing local file-backed CMS had 84 matching stale fields; these were migrated with prior content saved in website_versions. Custom edits and prices were preserved. The repeatable script is `node backend/scripts/migrate-sales-content.js --file backend/data/offers.json --apply` (stop a file-backed API first; omit --apply to preview). For a separate production database, review/publish the revised sales copy/layout using the admin CMS. Key groups: Site.layout, Hero, Header, DemoSection, FeaturesSection, HowItWorksSection, PricingSection, FaqSection, TrustSection, FinalCTA, FooterSection, SignupPage, PaymentPage, AnnouncementBanner, InfoPage, seo. This is material: old published overrides can reintroduce old claims/layout. The new route and payment/tracking protections apply in code regardless.
5. Confirm actual ERP capability/plan evidence, setup dates, business identity, and support delivery. Unverified plan differences and team-assisted setup remain the largest sales objections. Do not advertise immediate ERP use or a recorded demo until those exist.

See `meta-pixel.md` for event behavior and verification. No external messages, real charges, remote production CMS publication, or deployment were performed. Local CMS content was migrated as described above.

## Verification results

- 37 backend tests passed, including offer/payment concurrency and conversion claims.
- 18 browser tests passed across desktop Chrome and mobile Chromium, including the full signup/payment/invoice path, consent, Meta/GA events, route refreshes, accessibility, and landing-page links/assets. Gateway and tag requests were mocked.
- TypeScript/Vite production build, ESLint, and git diff whitespace checks passed.
- Docker production image built successfully with the shared catalog and optional Pixel build configuration.
- Desktop/mobile hero and pricing screenshots are in `docs/audit-images`.
- The live production configuration check failed with the missing settings listed above; no live transaction or delivery is claimed.
