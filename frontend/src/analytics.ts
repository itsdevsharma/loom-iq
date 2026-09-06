export type AnalyticsEvent =
  | "demo_cta_clicked"
  | "demo_form_started"
  | "demo_form_submitted"
  | "demo_form_success"
  | "demo_form_error";

export function trackEvent(event: AnalyticsEvent): void {
  window.dispatchEvent(new CustomEvent("loom-iq-analytics", { detail: { event } }));
}