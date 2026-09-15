import catalog from "../../shared/website-content.json";
let content: Record<string, unknown> = Object.fromEntries(Object.entries(catalog).map(([key, item]) => [key, item.default]))
const apiOrigin = (import.meta.env.PUBLIC_API_URL ?? '').replace(/\/$/, '')

function apiAssetUrl(value: string) {
  // Built-in images ship with the frontend; they must not wait for the API.
  if (value.startsWith("/api/content/assets/")) {
    return import.meta.env.BASE_URL + "cms-defaults/" + value.slice("/api/content/assets/".length)
  }
  // Uploaded CMS media still belongs to the API.
  return apiOrigin && value.startsWith('/api/') ? apiOrigin + value : value
}

export async function loadWebsiteContent() {
  try {
    const response = await fetch(`${import.meta.env.PUBLIC_API_URL ?? ''}/api/content/website`, { signal: AbortSignal.timeout(1500) })
    if (response.ok) content = { ...content, ...((await response.json()).values || {}) }
  } catch { /* Keep the bundled content available during an API outage. */ }
}
export function cmsValue<T>(key: string, fallback: T): T {
  const value = Object.prototype.hasOwnProperty.call(content, key) ? content[key] : fallback
  const prices = (content['Site.pricing'] || {Starter:{firstMonth:1990,recurring:1990},Growth:{firstMonth:2990,recurring:2990},Enterprise:{recurring:4990}}) as ReturnType<typeof websitePricing>
  const discounts = [prices.Starter, prices.Growth].map(plan => Math.round((1-plan.firstMonth/plan.recurring)*100))
  const money = (amount:number) => `₹${amount.toLocaleString('en-IN')}`
  const replacements:Record<string,string> = {discount: `${discounts[0] === discounts[1] ? '' : 'up to '}${Math.max(...discounts)}%`,starterOffer:money(prices.Starter.firstMonth),starterRegular:money(prices.Starter.recurring),growthOffer:money(prices.Growth.firstMonth),growthRegular:money(prices.Growth.recurring),enterpriseRegular:money(prices.Enterprise.recurring)}
  function interpolate(item:unknown):unknown {
    if(typeof item==='string') return apiAssetUrl(item.replace(/\{(discount|starterOffer|starterRegular|growthOffer|growthRegular|enterpriseRegular)\}/g, (_,name)=>replacements[name]))
    if(Array.isArray(item)) return item.map(interpolate)
    if(item && typeof item==='object') return Object.fromEntries(Object.entries(item).map(([key,value])=>[key,interpolate(value)]))
    return item
  }
  return interpolate(value) as T
}
export function websitePricing() {
  return cmsValue('Site.pricing', {Starter:{firstMonth:1990,recurring:1990},Growth:{firstMonth:2990,recurring:2990},Enterprise:{recurring:4990}})
}
export function cmsTemplate(key: string, fallback: string, values: unknown[]) {
  return cmsValue(key, fallback).replace(/\{(\d+)\}/g, (match, index) => Number(index) < values.length ? String(values[Number(index)]) : match)
}

export function siteLink(href: string): string {
  const base = import.meta.env.BASE_URL;
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const onSalesPage = path === (base.replace(/\/$/, '') || '/') || path === base + 'garment-erp';
  return href.startsWith('#') && !onSalesPage ? base + href : href;
}
