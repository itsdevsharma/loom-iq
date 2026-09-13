import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { useParams, useNavigate, useBlocker } from 'react-router-dom'
import { getPage, updatePage, publishPage, unpublishPage, rollbackToVersion } from '../../api/content'
import { SectionEditor, renderSections } from '../../components/SectionEditors'
import MediaManager from '../../components/MediaManager'
import type { PageDetail, SeoInput, SectionInput } from '../../types/content'

const defaults: Record<string, Record<string, unknown>> = {
  hero: { headline: '', subheadline: '', ctaText: '', ctaLink: '' },
  features: { items: [] }, testimonials: { entries: [] }, richtext: { body: '' },
  cta: { label: '', link: '', linkText: 'Learn more', backgroundColor: '#0b1220' }, faq: { items: [] },
}
export default function PageEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = React.useState<PageDetail | null>(null)
  const [saved, setSaved] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [retry, setRetry] = React.useState(0)
  const dirty = detail !== null && JSON.stringify(detail) !== saved
  React.useEffect(() => {
    let active = true
    setDetail(null); setError('')
    getPage(id!).then(data => { if (active) { setDetail(data); setSaved(JSON.stringify(data)) } }).catch(e => { if (active) setError(e.message) })
    return () => { active = false }
  }, [id, retry])
  const blocker = useBlocker(dirty)
  React.useEffect(() => {
    if (blocker.state === 'blocked') {
      if (window.confirm('Leave this page and discard unsaved changes?')) blocker.proceed()
      else blocker.reset()
    }
  }, [blocker])
  React.useEffect(() => {
    if (!dirty) return
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', unload)
    return () => { window.removeEventListener('beforeunload', unload) }
  }, [dirty])
  function patch(values: Partial<PageDetail>) { setDetail(p => p ? { ...p, ...values } : p); setMessage('') }
  function seoPatch(values: Partial<SeoInput>) { if (detail) patch({ seo: { ...detail.seo, ...values } }) }
  async function action(kind: 'save' | 'publish' | 'draft' | 'archived' | 'restore', versionId?: string) {
    if (!detail || busy) return
    if (!detail.title.trim() || !/^[a-z0-9-]+$/.test(detail.slug)) { setError('Enter a title and a valid URL slug (lowercase letters, numbers, and hyphens).'); return }
    if (kind === 'restore' && !confirm('Restore this version? This publishes the selected version and replaces your current edits.')) return
    if ((kind === 'draft' || kind === 'archived') && !confirm(`Move this page to ${kind}? It will no longer be publicly available.`)) return
    setBusy(true); setError(''); setMessage('')
    try {
      if (kind === 'save' || kind === 'publish') {
        await updatePage(id!, { title: detail.title, slug: detail.slug, description: detail.description, seo: detail.seo, sections: detail.sections, lastModifiedAt: detail.lastModifiedAt })
      }
      if (kind === 'publish') await publishPage(id!)
      if (kind === 'draft' || kind === 'archived') await unpublishPage(id!, kind)
      if (kind === 'restore') await rollbackToVersion(id!, versionId!)
      const next = await getPage(id!); setDetail(next); setSaved(JSON.stringify(next))
      setMessage(kind === 'publish' ? 'Page published with your latest changes.' : kind === 'save' ? 'Changes saved. Publish when you are ready to update the public page.' : 'Page updated.')
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  if (!detail) return <div className="admin-shell">{error ? <div role="alert" className="error">{error}<button onClick={() => setRetry(r => r + 1)}>Retry</button></div> : <p role="status">Loading page…</p>}</div>
  const seo = detail.seo || {}
  const sections = detail.sections || []
  const preview = '<!doctype html><html><head><meta charset="utf-8"><style>' + cssForPreview() + '</style></head><body>' + renderToStaticMarkup(<>{renderSections(sections)}</>) + '</body></html>'
  function changeSection(index: number, values: Partial<SectionInput>) { patch({sections: sections.map((s, i) => i === index ? {...s, ...values} : s)}) }
  function move(index: number, direction: number) { const next = [...sections]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; patch({sections: next}) }
  return <div className="admin-shell">
    <button className="btn-ghost" onClick={() => navigate('/admin/content')}>← All pages</button>
    <div className="page-heading"><div><h1>{detail.title}</h1><p className="sub">/{detail.slug} · Edited {new Date(detail.lastModifiedAt).toLocaleString()} by {detail.lastModifiedBy || '—'}</p></div><span className={`status-pill ${detail.status}`}>{detail.status}</span></div>
    {error && <div role="alert" className="error">{error}</div>}{message && <div role="status" className="success">{message}</div>}
    <div className="toolbar editor-toolbar"><span className={dirty ? 'unsaved' : 'muted'}>{dirty ? '● Unsaved changes' : 'All changes saved'}</span><span className="spacer" /><button disabled={busy || !dirty} onClick={() => action('save')}>Save changes</button><button disabled={busy || detail.status === 'archived'} onClick={() => action('publish')}>{detail.status === 'published' ? 'Publish updates' : 'Publish page'}</button>{detail.status !== 'draft' && <button className="btn-ghost" disabled={busy} onClick={() => action('draft')}>{detail.status === 'archived' ? 'Restore to draft' : 'Unpublish'}</button>}{detail.status !== 'archived' && <button className="btn-ghost" disabled={busy} onClick={() => action('archived')}>Archive</button>}</div>
    <fieldset disabled={busy} className="editor-fieldset"><div className="editor-grid"><div>
      <section className="panel"><h2>Page details</h2><label>Page title<input value={detail.title} onChange={e => patch({title: e.target.value})} /></label><label>URL slug<input value={detail.slug} onChange={e => patch({slug: e.target.value})} /></label><label>Page description<textarea value={detail.description || ''} onChange={e => patch({description: e.target.value})} /></label></section>
      <section className="panel"><h2>Content sections <small>({sections.length})</small></h2><p className="sub">Add sections, edit their content, and arrange the page.</p><div className="toolbar">{Object.keys(defaults).map(type => <button className="btn-ghost" key={type} onClick={() => patch({sections: [...sections, {id: crypto.randomUUID(), type, props: structuredClone(defaults[type])}]})}>+ {type}</button>)}</div>
      {sections.length === 0 && <div className="empty">Add a hero or text section to start your page.</div>}
      {sections.map((section, index) => <div className="section-block" key={section.id || index}><div className="sb-head"><strong>{index + 1}. {section.type}</strong><div className="actions"><button title="Move up" disabled={index === 0} onClick={() => move(index, -1)}>↑</button><button title="Move down" disabled={index === sections.length - 1} onClick={() => move(index, 1)}>↓</button><button onClick={() => { if (confirm('Remove this section?')) patch({sections: sections.filter((_, i) => i !== index)}) }}>Remove</button></div></div><SectionEditor section={section} onChange={values => changeSection(index, {props: {...section.props, ...values}})} /></div>)}
      </section><section className="panel"><h2>Live preview</h2><p className="sub">Updates as you edit, including unsaved changes.</p><iframe sandbox="" title="Page preview" className="preview-iframe" srcDoc={preview} /></section>
    </div><aside>
      <section className="panel"><h2>Search & sharing</h2><label>SEO title<input value={seo.title || ''} onChange={e => seoPatch({title: e.target.value})} /></label><small>{(seo.title || detail.title).length} characters · Aim for a concise, descriptive title.</small><label>Meta description<textarea value={seo.description || ''} onChange={e => seoPatch({description: e.target.value})} /></label><small>{(seo.description || '').length} / 160 suggested characters</small><label>Canonical URL<input type="url" value={seo.canonical || ''} placeholder="https://example.com/page" onChange={e => seoPatch({canonical: e.target.value})} /></label><label>Search visibility<select value={seo.robots || ''} onChange={e => seoPatch({robots: e.target.value})}><option value="">Index and follow</option><option value="noindex, follow">Hide from search results</option><option value="noindex, nofollow">Hide and do not follow links</option><option value="index, nofollow">Index, do not follow links</option></select></label>
      <h3>Social sharing</h3><label>Social title<input value={seo.ogTitle || ''} onChange={e => seoPatch({ogTitle: e.target.value})} /></label><label>Social description<textarea value={seo.ogDescription || ''} onChange={e => seoPatch({ogDescription: e.target.value})} /></label><MediaManager label="Social image" value={seo.ogImageKey} onChange={url => seoPatch({ogImageKey: url || ''})} />
      <div className="seo-preview"><strong>{seo.title || detail.title}</strong><small>/{detail.slug}</small><p>{seo.description || detail.description || 'Add a description to explain this page.'}</p></div></section>
      <section className="panel"><h2>Version history</h2><p className="sub">Each publish creates a saved version.</p>{!detail.versions?.length && <p>No published versions yet.</p>}{detail.versions?.map(version => <div className="version-row" key={version.id}><strong>{version.reason || 'Published'}</strong><small>{new Date(version.createdAt).toLocaleString()} · {version.createdBy}</small>{version.id === detail.publishedVersionId ? <span className="status-pill published">Current release</span> : <button className="btn-ghost" onClick={() => action('restore', version.id)}>Restore version</button>}</div>)}</section>
    </aside></div></fieldset>
  </div>
}

function cssForPreview() {
  return `
    body{font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;background:#f6f7fb;color:#222;padding:24px}
    .sec-hero{padding:48px 24px;text-align:center;background:linear-gradient(180deg,#0b1220 0%,#16203a 100%);color:white;border-radius:12px}
    .sec-hero h1{font-size:30px;margin:0 0 10px;font-weight:700;line-height:1.2}
    .sec-hero p{font-size:15px;color:#cdd3e6;max-width:640px;margin:0 auto 18px;line-height:1.5}
    .sec-hero .btn{background:white;color:#0b1220;font-weight:600;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block;font-size:14px}
    .sec-features{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;padding:32px 24px}
    .sec-features .fcard{background:white;border-radius:10px;padding:16px;border:1px solid #eef0f5;box-shadow:0 4px 12px rgba(41,28,66,0.05)}
    .sec-features .fcard h3{margin:0 0 6px;font-size:15px}
    .sec-features .fcard p{margin:0;color:#666;font-size:13px;line-height:1.5}
    .sec-testimonials{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;padding:32px 24px}
    .sec-testimonials .tcard{background:#fafbfc;border-radius:10px;padding:16px;border:1px solid #eef0f5;font-size:13px;color:#333;line-height:1.5}
    .sec-testimonials .tcard .who{margin-top:10px;font-weight:600;color:#553081;font-size:12px}
    .sec-richtext{padding:24px;font-size:14px;color:#333;line-height:1.6;white-space:pre-wrap}
    .sec-cta{padding:32px 24px;text-align:center;background:#0b1220;color:white;border-radius:12px}
    .sec-cta .label{font-size:18px;font-weight:700;margin:0 0 12px}
    .sec-cta .btn{background:white;color:#0b1220;font-weight:600;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block;font-size:14px}
    .sec-faq{padding:24px;max-width:720px;margin:0 auto;font-size:14px}
    .sec-faq .faq-item{margin-bottom:12px;border-bottom:1px solid #eef0f5;padding-bottom:12px}
    .sec-faq .faq-item .q{font-weight:600;color:#222}
    .sec-faq .faq-item .a{color:#666;margin-top:4px}
  `
}
