import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { listPages, createPage } from '../../api/content'
import type { PageListItem } from '../../types/content'

interface PagesListProps {
}

export default function PagesList() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [creating, setCreating] = React.useState(false)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [slug, setSlug] = React.useState('')
  const requestId = React.useRef(0)
  const [items, setItems] = React.useState<PageListItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [limit, setLimit] = React.useState(20)
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState(params.get('status') || '')
  const [error, setError] = React.useState<string | null>(null)

  const reload = React.useCallback(async (resetPage = true) => {
    const request = ++requestId.current
    try {
      setLoading(true)
      setError(null)
      const data = await listPages({ search: search || undefined, status: status || undefined, page, limit })
      if (request !== requestId.current) return
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
      if (resetPage && page > Math.max(1, Math.ceil((data.total ?? 0) / limit))) {
        setPage(Math.max(1, Math.ceil((data.total ?? 0) / limit)))
      }
    } catch (e: any) {
      if (request === requestId.current) setError(e.message ?? 'Failed to load pages.')
    } finally {
      if (request === requestId.current) setLoading(false)
    }
  }, [search, status, page, limit])

  React.useEffect(() => { const timer = setTimeout(() => { void reload() }, 200); return () => { clearTimeout(timer); requestId.current++ } }, [reload])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (creating) return
    setCreating(true); setError(null)
    try {
      const result = await createPage({ id: crypto.randomUUID(), title: title.trim(), slug, description: '', sections: [], status: 'draft' })
      navigate(`/admin/content/pages/${encodeURIComponent(result.id)}`)
    } catch (e) { setError((e as Error).message) } finally { setCreating(false) }
  }

  function statusPill(s: string) {
    return <span className={`status-pill ${s}`}>{s}</span>
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="admin-shell">
      <h1>Pages</h1>
      <p className="sub">Manage your site content. Each page is made of sections; publish when ready for the public site.</p>

      {createOpen && <form className="panel" onSubmit={handleCreate}><h2>Create a page</h2><label>Page title<input required autoFocus value={title} onChange={e => {setTitle(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))}} /></label><label>URL slug<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={e => setSlug(e.target.value)} /></label><p className="sub">Use lowercase letters, numbers, and hyphens. New pages start as drafts.</p><div className="toolbar"><button disabled={creating}>{creating ? 'Creating…' : 'Create draft'}</button><button type="button" className="btn-ghost" disabled={creating} onClick={() => setCreateOpen(false)}>Cancel</button></div></form>}
      <div className="toolbar">
        <button className="btn primary" type="button" onClick={() => setCreateOpen(v => !v)} disabled={loading}>+ New page</button>
        <input
          type="text"
          aria-label="Search pages" placeholder="Search by title or slug…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{ width: 220, padding: '8px 10px', borderRadius: 6, border: '1px solid #e6e6f0', fontSize: 13 }}
        />
        <select
          aria-label="Filter status" value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
          style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e6e6f0', fontSize: 13, background: 'white' }}
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <span className="spacer" />
        <span style={{ fontSize: 13, color: '#666' }}>{total} page{total !== 1 ? 's' : ''}</span>
      </div>

      {error && <div role="alert" className="error">{error} <button className="btn-ghost" onClick={() => reload()}>Retry</button></div>}

      {loading && items.length === 0 ? (
        <div className="empty">Loading pages…</div>
      ) : items.length === 0 && !error ? (
        <div className="empty">No pages found. Create your first page to get started.</div>
      ) : (
        <div className="table-wrap">
          <table className="cms">
            <thead>
              <tr>
                <th>Page</th>
                <th>Status</th>
                <th>Slug</th>
                <th>Last edited</th>
                <th>Editor</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="page-row-click">
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.title || '(no title)'}</div>
                    {item.seo?.title && <div style={{ fontSize: 12, color: '#999' }}>{item.seo.title}</div>}
                  </td>
                  <td>{statusPill(item.status)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 13, color: '#555' }}>/{item.slug}</td>
                  <td style={{ color: '#666', fontSize: 13 }}>
                    {item.lastModifiedAt ? new Date(item.lastModifiedAt).toLocaleString() : '—'}
                  </td>
                  <td style={{ color: '#666', fontSize: 13 }}>{item.lastModifiedBy ?? '—'}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      className="btn-ghost"
                      type="button"
                      style={{ padding: '5px 8px', fontSize: 12 }}
                      onClick={() => navigate(`/admin/content/pages/${encodeURIComponent(item.id)}`)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button type="button" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}>Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage(p => p + 1)}>Next</button>
        <span className="info">{total} result{total !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}
