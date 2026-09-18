import React from 'react'
import { Link } from 'react-router-dom'
import { listPages, listMedia } from '../api/content'
import type { PageListItem } from '../types/content'

export default function Dashboard() {
  const [data, setData] = React.useState<{ counts: number[]; recent: PageListItem[] } | null>(null)
  const [error, setError] = React.useState('')
  const [retry, setRetry] = React.useState(0)
  React.useEffect(() => {
    let active = true
    setError('')
    Promise.all([listPages({limit: 6}), listPages({status: 'published', limit: 1}), listPages({status: 'draft', limit: 1}), listMedia()])
      .then(([all, published, drafts, media]) => { if (active) setData({counts: [all.total, published.total, drafts.total, media.items.length], recent: all.items}) })
      .catch(e => { if (active) setError(e.message) })
    return () => { active = false }
  }, [retry])
  return <div className="admin-shell dashboard">
    <div className="page-heading"><div><p className="eyebrow">YOUR WORKSPACE</p><h1>Content overview</h1><p className="sub">A clear view of your website content and publishing activity.</p></div><Link className="primary-link" to="/admin/website">Edit website →</Link></div>
    {error && <div className="error" role="alert">{error} <button onClick={() => setRetry(r => r + 1)}>Retry</button></div>}
    <div className="stat-grid">{['Custom pages', 'Published pages', 'Draft pages', 'Media assets'].map((label, i) => <Link to={i === 3 ? '/admin/media' : `/admin/content${i === 1 ? '?status=published' : i === 2 ? '?status=draft' : ''}`} className="stat-card" key={label}><span>{label}</span><strong>{data ? data.counts[i] : '—'}</strong><small>{['Additional public pages', 'Currently live', 'Work in progress', 'Images and videos'][i]}</small></Link>)}</div>
    <section className="panel"><h2>Your website, managed here</h2><p>Edit homepage sections, navigation, branding, legal policies, form copy, SEO, and synchronized checkout pricing. Save drafts, then publish when ready.</p><Link className="primary-link" to="/admin/website">Open website content →</Link></section><section className="panel"><div className="page-heading"><div><h2>Recently updated</h2><p className="sub">Pick up where you left off.</p></div><Link to="/admin/content">View all pages</Link></div>
      {!data && !error && <p role="status">Loading content…</p>}
      {data?.recent.length === 0 && <div className="empty">Your workspace is ready. <Link to="/admin/content">Create your first page</Link>.</div>}
      {data?.recent.map(page => <Link className="recent-row" key={page.id} to={`/admin/content/pages/${encodeURIComponent(page.id)}`}><div><strong>{page.title}</strong><small>/{page.slug}</small></div><span className={`status-pill ${page.status}`}>{page.status}</span><time>{page.lastModifiedAt ? new Date(page.lastModifiedAt).toLocaleDateString() : '—'}</time><span>Open →</span></Link>)}
    </section>
    <section className="guide-grid"><div className="panel"><h2>Customers and agreed pricing</h2><p>See who signed up, review their orders, and set individual plan prices with an audit trail.</p><Link to="/admin/customers">Manage customers →</Link></div><div className="panel"><h2>Payments and revenue</h2><p>Review live and test payments, paying customers, refunds, and Razorpay payment attempts.</p><Link to="/admin/payments">Open Razorpay analytics →</Link></div></section>
    <section className="guide-grid"><div className="panel"><h2>Build your content</h2><p>Compose pages with hero banners, features, testimonials, FAQs, and calls to action.</p><Link to="/admin/content">Open page manager →</Link></div><div className="panel"><h2>Prepare for publishing</h2><p>Review the live preview, check your page title and SEO description, then publish. Version history lets you restore earlier releases.</p><Link to="/admin/media">Organize media →</Link></div></section>
  </div>
}
