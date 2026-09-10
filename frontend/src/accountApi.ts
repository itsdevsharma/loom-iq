export async function accountApi<T = { message: string }>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/${path}`, {
    method: body === undefined ? 'GET' : 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json().catch(() => ({ message: 'Service unavailable. Please try again.' }));
  if (!response.ok) throw Object.assign(new Error(result.message || 'Request failed. Please try again.'), { status: response.status });
  return result as T;
}
