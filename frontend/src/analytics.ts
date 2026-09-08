export type AnalyticsEvent =
  | "pricing_page_view"
  | "offer_view"
  | "plan_selected"
  | "direct_purchase_clicked"
  | "direct_purchase_nav_clicked"
  | "checkout_started"
  | "checkout_completed"
  | "trial_cta_clicked"
  | "trial_started"
  | "discount_applied"
  | "subscription_created"
  | "demo_cta_clicked"
  | "demo_form_started"
  | "demo_form_submitted"
  | "demo_form_success"
  | "demo_form_error"
  | "offers_popup_cta_clicked"
  | "offers_popup_viewed"
  | "offers_popup_dismissed";

type GoogleTag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GoogleTag;
  }
}

let initialized = false;

export function initializeAnalytics(): void {
  const measurementId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID?.trim();
  if (initialized || !import.meta.env.PROD || !measurementId || !/^G-[A-Z0-9]+$/.test(measurementId)) return;

  initialized = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    // Google tag expects the arguments object in its command queue.
    // eslint-disable-next-line prefer-rest-params -- Preserve the standard Google tag queue format.
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
}

export function trackEvent(event: AnalyticsEvent): void {
  if (initialized) window.gtag?.("event", event);
  window.dispatchEvent(new CustomEvent("loom-iq-analytics", { detail: { event } }));
}
