import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
export type Offer = { policy?: 'daily' | '24-hour'; eligible: boolean; reason: string; expiresAt: number | null; serverNow: number; trialSelected: boolean; signedUp: boolean; customer?: { name: string; email: string; company: string } };
const initial: Offer = { eligible: false, reason: 'loading', expiresAt: null, serverNow: 0, trialSelected: false, signedUp: false };
async function offerRequest(path: string, body?: unknown): Promise<Offer> {
  const response = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/${path}`, { credentials: 'include', method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message ?? 'Unable to check your offer. Please try again.');
  return result;
}
const OfferContext = createContext({ offer: initial, remaining: 0, ready: false, update: (offer: Offer) => { void offer; }, selectTrial: async () => {}, authenticate: async (action: string, body: unknown) => { void action; void body; } });
let visit: Promise<Offer> | undefined;
function visitOffer() {
  visit ||= offerRequest('offers/visit', {}).catch(error => { visit = undefined; throw error; });
  return visit;
}
export function OfferProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState(() => ({ offer: initial, received: performance.now() }));
  const [now, setNow] = useState(() => performance.now());
  const update = (offer: Offer) => { setSnapshot({ offer, received: performance.now() }); setNow(performance.now()); };
  useEffect(() => {
    let active = true;
    let initialized = false;
    const load = () => visitOffer().then(value => { initialized = true; if (active) update(value); }).catch(() => { if (active) update({ ...initial, reason: 'unavailable' }); });
    void load();
    const timer = window.setInterval(() => setNow(performance.now()), 1000);
    const refresh = () => { if (!document.hidden) { if (!initialized) { void load(); return; } offerRequest('offers/status').then(value => { if (active) update(value); }).catch(() => {}); } };
    const poll = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { active = false; clearInterval(timer); clearInterval(poll); window.removeEventListener('focus', refresh); };
  }, []);
  const rawRemaining = (snapshot.offer.expiresAt ?? 0) - snapshot.offer.serverNow - (now - snapshot.received);
  const remaining = Math.max(0, rawRemaining);
  const offer = { ...snapshot.offer, eligible: snapshot.offer.eligible && remaining > 0, reason: snapshot.offer.eligible && remaining <= 0 ? "expired" : snapshot.offer.reason };
  const selectTrial = async () => { update(await offerRequest('trial/select', { acceptConditions: true })); };
  const authenticate = async (action: string, body: unknown) => { update(await offerRequest('account/' + action, body)); };
  return <OfferContext.Provider value={{ offer, remaining, ready: offer.reason !== 'loading', update, selectTrial, authenticate }}>{children}</OfferContext.Provider>;
}
// eslint-disable-next-line react-refresh/only-export-components
export function useOffer() { return useContext(OfferContext); }
