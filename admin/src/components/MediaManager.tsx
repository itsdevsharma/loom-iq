import React from 'react'
import { listMedia, uploadMedia, deleteMedia, updateMedia } from '../api/content'
import type { MediaItem } from '../types/content'

const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
export default function MediaManager({ value, onChange, label = 'Media', library = false }: {value?: string | null; onChange?: (url: string | null) => void; label?: string; library?: boolean}) {
  const [items, setItems] = React.useState<MediaItem[]>([])
  const [open, setOpen] = React.useState(library)
  const [selected, setSelected] = React.useState<string | null>(null)
  const [alt, setAlt] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [search, setSearch] = React.useState('')
  const input = React.useRef<HTMLInputElement>(null)
  const dialog = React.useRef<HTMLDialogElement>(null)
  const asset = items.find(item => item.id === selected)
  async function load() { setLoading(true); try { const data = await listMedia(); setItems(data.items) } finally { setLoading(false) } }
  React.useEffect(() => { if (open) { setError(''); load().catch(e => setError(e.message)); if (!library) dialog.current?.showModal() } }, [open, library])
  async function upload(files: FileList | null) {
    if (!files || busy) return
    setBusy(true); setError(''); setMessage('')
    try {
      for (const file of Array.from(files)) {
        if (!allowed.includes(file.type) || file.size > 20 * 1024 * 1024) throw new Error(`${file.name}: use JPG, PNG, WebP, GIF, MP4, or WebM up to 20 MB.`)
        const data = new FormData(); data.append('file', file)
        const result = await uploadMedia(data)
        if (!library) onChange?.(result.url)
      }
      await load(); setMessage('Upload complete.')
    } catch (e) { setError((e as Error).message); await load().catch(() => {}) } finally { setBusy(false); if (input.current) input.current.value = '' }
  }
  async function saveAlt() {
    if (!asset) return
    setBusy(true); setError('')
    try { await updateMedia(asset.id, {altText: alt}); await load(); setMessage('Alternative text saved.') } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  async function remove() {
    if (!asset || !confirm('Remove this file from the library? Existing pages may still reference it.')) return
    setBusy(true); setError('')
    try { await deleteMedia(asset.id); if (value === asset.url) onChange?.(null); setSelected(null); await load(); setMessage('File removed from the library.') } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  const content = <>
    <div className="toolbar"><input aria-label="Search media" placeholder="Search files…" value={search} onChange={e => setSearch(e.target.value)} /><button disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Working…' : 'Upload files'}</button><button className="btn-ghost" disabled={busy || loading} onClick={() => {setError(''); load().catch(e => setError(e.message))}}>Refresh</button></div>
    <input ref={input} type="file" multiple accept={allowed.join(',')} hidden onChange={e => upload(e.target.files)} />
    <p className="sub">JPG, PNG, WebP, GIF, MP4, WebM · Up to 20 MB per file</p>
    {error && <div role="alert" className="error">{error}</div>}{message && <div role="status" className="success">{message}</div>}
    {loading && <p role="status">Loading media…</p>}
    <div className="library-grid">{items.filter(item => `${item.filename || item.url} ${item.altText || ''}`.toLowerCase().includes(search.toLowerCase())).map(item => <button disabled={busy} aria-pressed={selected === item.id} key={item.id} className={`asset-card ${selected === item.id ? 'selected' : ''}`} onClick={() => {setSelected(item.id); setAlt(item.altText || ''); setMessage('')}}>
      {item.contentType.startsWith('image/') ? <img src={item.url} alt={item.altText || ''} loading="lazy" /> : <div className="video-thumbnail">▶ Video</div>}
      <strong>{item.filename || item.url.split('/').pop()}</strong><small>{(item.size / 1024).toFixed(0)} KB · {item.contentType.split('/')[1]}</small></button>)}</div>
    {!loading && !items.length && <div className="empty">No assets yet. Upload your first image or video.</div>}
    {asset && <div className="panel asset-details"><h3>{asset.filename || 'Selected asset'}</h3><p className="sub">Uploaded {new Date(asset.uploadedAt).toLocaleString()} · {asset.uploadedBy}</p>{asset.contentType.startsWith('video/') && <video src={asset.url} controls style={{maxWidth: '100%'}} />}<label>Alternative text<input value={alt} disabled={busy} onChange={e => setAlt(e.target.value)} /></label><div className="toolbar"><button disabled={busy || alt === (asset.altText || '')} onClick={saveAlt}>Save alt text</button>{!library && <button disabled={busy} onClick={() => {onChange?.(asset.url); setOpen(false)}}>Use this asset</button>}<button disabled={busy} className="btn-ghost" onClick={remove}>Delete asset</button></div></div>}
  </>
  if (library) return <section className="panel">{content}</section>
  return <div className="media-picker"><strong>{label}</strong>{value && <><img className="picked-image" src={value} alt="Selected media" /><button className="btn-ghost" onClick={() => onChange?.(null)}>Remove selection</button></>}<button className="btn-ghost" onClick={() => setOpen(true)}>Choose media</button>{open && <dialog ref={dialog} className="asset-dialog" onCancel={() => setOpen(false)}><div className="page-heading"><h2>Choose media</h2><button className="btn-ghost" onClick={() => setOpen(false)}>Close</button></div>{content}</dialog>}</div>
}
