type Listener = () => void;

let activeRequests = 0;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

function isApiRequest(input: RequestInfo | URL) {
  const url = input instanceof Request ? input.url : input.toString();
  try {
    return new URL(url, window.location.origin).pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

export function subscribeToApiLoading(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isApiLoading() {
  return activeRequests > 0;
}

/** Track the site's existing API fetches without changing each caller. */
export function installApiLoadingTracker() {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (!isApiRequest(input)) return originalFetch(input, init);

    activeRequests += 1;
    notify();
    try {
      return await originalFetch(input, init);
    } finally {
      activeRequests = Math.max(0, activeRequests - 1);
      notify();
    }
  };
}
