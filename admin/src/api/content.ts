import type { PageListItem, PageDetail, PageVersion, MediaItem, PreviewPayload, SeoInput, SectionInput } from '../types/content'

async function request(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(30000) })
  if (response.status === 401) {
    window.location.assign('/admin/login')
    throw new Error('Your session expired. Please sign in again.')
  }
  return response
}

const BASE = '/api/admin/content'

export async function listPages(opts: { search?: string; status?: string; page?: number; limit?: number } = {}) {
  const params = new URLSearchParams()
  if (opts.search) params.set('search', opts.search)
  if (opts.status) params.set('status', opts.status)
  if (opts.page) params.set('page', String(opts.page))
  if (opts.limit) params.set('limit', String(opts.limit))
  const res = await request(`${BASE}/pages?${params}`, { credentials: 'include', headers: { 'Content-Type': 'application/json' } })
  const json = await res.json().catch(() => ({ success: false, message: 'Unable to load pages.' }))
  if (!res.ok) throw new Error(json.message ?? 'Unable to load pages.')
  return json as { items: PageListItem[]; page: number; limit: number; total: number }
}

export async function getPage(id: string): Promise<PageDetail> {
  const res = await request(`${BASE}/pages/${encodeURIComponent(id)}`, { credentials: 'include' })
  const json = await res.json().catch(() => ({ success: false, message: 'Unable to load page.' }))
  if (!res.ok) throw new Error(json.message ?? 'Unable to load page.')
  return json as PageDetail
}

export async function createPage(body: { id: string; title: string; slug: string; description?: string; seo?: SeoInput; sections: SectionInput[]; status?: string }): Promise<{ id: string; title: string; slug: string; status: string; createdAt: number }> {
  const res = await request(`${BASE}/pages`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({ success: false, message: 'Unable to create page.' }))
  if (!res.ok) throw new Error(json.message ?? 'Unable to create page.')
  return json as { id: string; title: string; slug: string; status: string; createdAt: number }
}

export async function updatePage(id: string, body: Partial<{ title: string; slug: string; description: string; seo: SeoInput; sections: SectionInput[]; status: string; lastModifiedAt: number }>): Promise<void> {
  const res = await request(`${BASE}/pages/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({ success: false, message: 'Unable to save page.' }))
  if (!res.ok) throw new Error(json.message ?? 'Unable to save page.')
}

export async function publishPage(id: string, reason?: string): Promise<{ publishedVersionId: string }> {
  const res = await request(`${BASE}/pages/${encodeURIComponent(id)}/publish`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
  const json = await res.json().catch(() => ({ success: false, message: 'Unable to publish page.' }))
  if (!res.ok) throw new Error(json.message ?? 'Unable to publish page.')
  return json as { publishedVersionId: string }
}

export async function unpublishPage(id: string, targetStatus?: 'draft' | 'archived', reason?: string): Promise<{ status: string }> {
  const res = await request(`${BASE}/pages/${encodeURIComponent(id)}/unpublish`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: targetStatus, reason }),
  })
  const json = await res.json().catch(() => ({ success: false, message: 'Unable to unpublish page.' }))
  if (!res.ok) throw new Error(json.message ?? 'Unable to unpublish page.')
  return json as { status: string }
}

export async function listVersions(id: string): Promise<{ items: PageVersion[] }> {
  const res = await request(`${BASE}/pages/${encodeURIComponent(id)}/versions`, { credentials: 'include' })
  const json = await res.json().catch(() => ({ success: false, message: 'Unable to load versions.' }))
  if (!res.ok) throw new Error(json.message ?? 'Unable to load versions.')
  return json as { items: PageVersion[] }
}

export async function rollbackToVersion(pageId: string, versionId: string, reason?: string): Promise<{ newVersionId: string }> {
  const res = await request(`${BASE}/pages/${encodeURIComponent(pageId)}/versions/${encodeURIComponent(versionId)}/rollback`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
  const json = await res.json().catch(() => ({ success: false, message: 'Unable to rollback.' }))
  if (!res.ok) throw new Error(json.message ?? 'Unable to rollback.')
  return json as { newVersionId: string }
}

export async function createPreviewToken(pageId: string, versionId?: string): Promise<{ token: string; expiresAt: number; versionId: string; pageId: string }> {
  const res = await request(`${BASE}/preview-token`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pageId, versionId }),
  })
  const json = await res.json().catch(() => ({ success: false, message: 'Unable to create preview link.' }))
  if (!res.ok) throw new Error(json.message ?? 'Unable to create preview link.')
  return json as { token: string; expiresAt: number; versionId: string; pageId: string }
}

export async function getPreviewByToken(token: string): Promise<PreviewPayload> {
  const res = await request(`${BASE}/preview/${encodeURIComponent(token)}`, { credentials: 'include' })
  const json = await res.json().catch(() => ({ success: false, message: 'Preview link is invalid or expired.' }))
  if (!res.ok) throw new Error(json.message ?? 'Preview link is invalid or expired.')
  return json as PreviewPayload
}

const MEDIA_BASE = `${BASE}/media`

export async function listMedia(): Promise<{ items: MediaItem[] }> {
  const res = await fetch(MEDIA_BASE, { credentials: 'include' })
  const json = await res.json().catch(() => ({ success: false, message: 'Unable to load media.' }))
  if (!res.ok) throw new Error(json.message ?? 'Unable to load media.')
  return json as { items: MediaItem[] }
}

export async function uploadMedia(formData: FormData): Promise<{ id: string; url: string; contentType: string; size: number }> {
  const res = await fetch(MEDIA_BASE, { method: 'POST', credentials: 'include', body: formData })
  const json = await res.json().catch(() => ({ success: false, message: 'Unable to upload media.' }))
  if (!res.ok) throw new Error(json.message ?? 'Unable to upload media.')
  return json as { id: string; url: string; contentType: string; size: number }
}

export async function updateMedia(id: string, body: { altText?: string }): Promise<{ altText: string }> {
  const res = await request(`${MEDIA_BASE}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({ success: false, message: 'Unable to update media.' }))
  if (!res.ok) throw new Error(json.message ?? 'Unable to update media.')
  return json as { altText: string }
}

export async function deleteMedia(id: string): Promise<void> {
  const res = await request(`${MEDIA_BASE}/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' })
  if (!res.ok) {
    const json = await res.json().catch(() => ({ success: false, message: 'Unable to delete media.' }))
    throw new Error(json.message ?? 'Unable to delete media.')
  }
}

export async function getPublicPreview(token: string): Promise<PreviewPayload> {
  const res = await request(`/api/content/preview/${encodeURIComponent(token)}`, { credentials: 'omit' })
  const json = await res.json().catch(() => ({ success: false, message: 'Preview link is invalid or expired.' }))
  if (!res.ok) throw new Error(json.message ?? 'Preview link is invalid or expired.')
  return json as PreviewPayload
}

const PUBLIC_BASE = '/api/content'
export async function listPublicPages(opts: { page?: number; limit?: number } = {}) {
  const params = new URLSearchParams()
  if (opts.page) params.set('page', String(opts.page))
  if (opts.limit) params.set('limit', String(opts.limit))
  const res = await request(`${PUBLIC_BASE}/pages?${params}`)
  const json = await res.json().catch(() => ({ success: false, message: 'Unable to load pages.' }))
  if (!res.ok) throw new Error(json.message ?? 'Unable to load pages.')
  return json as { items: any[]; page: number; limit: number; total: number }
}

export async function getPublicPage(slug: string): Promise<any> {
  const res = await request(`${PUBLIC_BASE}/pages/${encodeURIComponent(slug)}`)
  const json = await res.json().catch(() => ({ success: false, message: 'Page not found.' }))
  if (!res.ok) throw new Error(json.message ?? 'Page not found.')
  return json as any
}
