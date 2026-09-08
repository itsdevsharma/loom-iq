# Google Analytics

The production measurement ID `G-0H0Z4CLD5Z` is configured in `frontend/.env.production`. Vite loads it for production builds, including the existing GitHub Pages workflow. To use another property, override `VITE_GOOGLE_ANALYTICS_ID` in the hosting build environment. The measurement ID is public, not a secret.

Run `npm run build` from `frontend` and deploy the rebuilt site. Vite embeds this public ID at build time, so changing it requires a rebuild. Analytics is disabled in the Vite development server and when the ID is missing or invalid.

The Google tag sends a page view on each page load. The site uses full-page navigation. Existing pricing, offer, demo, and checkout events are also forwarded to GA4, while the existing local browser events remain available. No form fields or payment details are added to these custom events.

Verify with `npm run preview` after a production build, or open the deployed website. Confirm that `gtag/js` and Google Analytics `collect` requests appear in browser Network tools, then check Analytics Realtime while navigating and clicking a demo or pricing CTA. Ad blockers can prevent delivery. Live delivery must be verified with the real property ID.

Reference: https://developers.google.com/analytics/devguides/collection/ga4/views
