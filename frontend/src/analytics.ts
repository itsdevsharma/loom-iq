export type AnalyticsEvent =
  | "signup_completed"
  | "payment_initiated"
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
type MetaTag = GoogleTag & { queue: unknown[][]; callMethod?: GoogleTag; push?: MetaTag; loaded?: boolean; version?: string };
declare global { interface Window { dataLayer?: unknown[]; gtag?: GoogleTag; fbq?: MetaTag; _fbq?: MetaTag; } }
let initialized = false;
let metaInitialized = false;
export function analyticsAllowed(): boolean {
  try { return localStorage.getItem('loomiq-analytics') === 'granted'; } catch { return false; }
}
export function initializeAnalytics(): void {
  if (/\/(reset-password|verify-email)\/?$/.test(window.location.pathname) || !analyticsAllowed() || !import.meta.env.PROD) return;
  const measurementId = import.meta.env.PUBLIC_GOOGLE_ANALYTICS_ID?.trim();
  if (!initialized && measurementId && /^G-[A-Z0-9]+$/.test(measurementId)) {
    initialized = true;
    window.dataLayer ||= [];
    window.gtag ||= function () {
      // eslint-disable-next-line prefer-rest-params -- Standard Google tag queue.
      window.dataLayer!.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId);
    const script = document.createElement('script'); script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }
  const pixelId = import.meta.env.PUBLIC_META_PIXEL_ID?.trim();
  if (!metaInitialized && pixelId && /^\d{5,20}$/.test(pixelId)) {
    metaInitialized = true;
    const tag = function (...args: unknown[]) { if (tag.callMethod) tag.callMethod(...args); else tag.queue.push(args); } as MetaTag;
    tag.queue = []; tag.push = tag; tag.loaded = true; tag.version = '2.0';
    window.fbq = window.fbq || tag; window._fbq ||= window.fbq;
    window.fbq('init', pixelId); window.fbq('set', 'autoConfig', false, pixelId);
    window.fbq('track', 'PageView');
    if (/\/(garment-erp)?$/.test(window.location.pathname)) window.fbq('track', 'ViewContent', {content_name:'LoomIQ garment ERP',content_type:'product'});
    const script = document.createElement('script'); script.async = true; script.src = 'https://connect.facebook.net/en_US/fbevents.js'; document.head.appendChild(script);
  }
  window.dispatchEvent(new Event('loomiq-analytics-ready'));
}
export function trackEvent(event: AnalyticsEvent): void {
  if (analyticsAllowed()) {
    if (initialized) window.gtag?.('event', event);
    if (metaInitialized && event === 'signup_completed') window.fbq?.('track', 'CompleteRegistration');
  }
  window.dispatchEvent(new CustomEvent('loom-iq-analytics', {detail:{event}}));
}
const checkouts = new Set<string>();
export function trackCheckout(plan: string, amount: number): void {
  if (!analyticsAllowed() || (!initialized && !metaInitialized)) return;
  const key = `${plan}:${amount}`; if (checkouts.has(key)) return; checkouts.add(key);
  const data = {currency:'INR',value:amount / 100,content_name:plan};
  if (metaInitialized) window.fbq?.('track','InitiateCheckout',data);
  if (initialized) window.gtag?.('event','begin_checkout',data);
}
const pendingPurchases = new Set<string>();
export async function trackVerifiedPurchase(orderId: string): Promise<void> {
  if (!analyticsAllowed() || (!initialized && !metaInitialized) || pendingPurchases.has(orderId)) return;
  pendingPurchases.add(orderId);
  try {
    const response = await fetch(`${import.meta.env.PUBLIC_API_URL ?? ''}/api/purchase/conversion/${encodeURIComponent(orderId)}`, {method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({consent:true})});
    if (!response.ok) return;
    const {conversion} = await response.json();
    if (!conversion || !analyticsAllowed()) return;
    const data = {value:conversion.amount / 100,currency:'INR',content_name:conversion.plan};
    if (metaInitialized) window.fbq?.('track','Purchase',data,{eventID:conversion.eventId});
    if (initialized) window.gtag?.('event','purchase',{...data,transaction_id:conversion.orderId,items:[{item_id:conversion.plan,item_name:conversion.plan,price:conversion.amount / 100,quantity:1}]});
  } finally { pendingPurchases.delete(orderId); }
}
