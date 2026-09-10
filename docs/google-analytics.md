# Google Analytics

The production measurement ID `G-0H0Z4CLD5Z` is configured in `frontend/.env.production`. Vite loads it for production builds, including the existing GitHub Pages workflow. To use another property, override `VITE_GOOGLE_ANALYTICS_ID` in the hosting build environment. The measurement ID is public, not a secret.

Run `npm run build` from `frontend` and deploy the rebuilt site. Vite embeds this public ID at build time, so changing it requires a rebuild. Analytics is disabled in the Vite development server and when the ID is missing or invalid.

The Google tag loads only after the visitor allows optional analytics using Cookie preferences. Recovery and verification pages never load it, so private link tokens are not included in analytics page URLs. On other pages it sends a page view per load. Pricing, offer, demo, and checkout events are also forwarded to GA4; no form fields or payment details are added to those events. Essential-only mode does not load the tag. Revoking consent reloads the page with analytics disabled.

Verify with `npm run preview` after a production build, or open the deployed website. Allow analytics and confirm that `gtag/js` and Google Analytics `collect` requests appear in browser Network tools, then check Analytics Realtime while navigating and clicking a demo or pricing CTA. Confirm no tag request before consent or on recovery/verification routes. Ad blockers can prevent delivery. Live delivery must be verified with the real property ID.

Reference: https://developers.google.com/analytics/devguides/collection/ga4/views
