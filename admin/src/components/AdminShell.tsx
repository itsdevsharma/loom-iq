import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

export type AdminIdentity = { email: string; roles: string[]; permissions: string[] }

const navigation = [
  { to: '/admin/', label: 'Overview', end: true },
  { to: '/admin/website', label: 'Website content', permission: 'content.read' },
  { to: '/admin/content', label: 'Custom pages', permission: 'content.read' },
  { to: '/admin/media', label: 'Media library', permission: 'content.read' },
  { to: '/admin/customers', label: 'Customers', permission: 'records.read' },
  { to: '/admin/payments', label: 'Razorpay analytics', permission: 'billing.read' },
  { to: '/admin/records', label: 'Customer activity', permission: 'records.read' },
]

function canAccess(admin: AdminIdentity, permission?: string) {
  return !permission || admin.roles.includes('superadmin') || admin.permissions.includes(permission)
}

export default function AdminShell() {
  const navigate = useNavigate()
  const [admin, setAdmin] = React.useState<AdminIdentity | null>(null)
  const [error, setError] = React.useState('')
  const check = React.useCallback(async () => {
    setError('')
    try {
      const res = await fetch('/api/admin/me', { credentials: 'include', signal: AbortSignal.timeout(10000) })
      if (res.status === 401) { navigate('/admin/login', { replace: true }); return }
      if (!res.ok) throw new Error('Unable to verify your session. Please try again.')
      const body = await res.json()
      setAdmin({ ...body.admin, roles: body.admin.roles || [], permissions: body.admin.permissions || [] })
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to connect.') }
  }, [navigate])
  React.useEffect(() => { void check() }, [check])

  if (!admin) return <div className="center"><div role="status">{error || 'Loading your workspace…'}{error && <button onClick={check}>Retry</button>}</div></div>
  return <div className="workspace">
    <aside className="sidebar"><NavLink className="brand" to="/admin/">Loom<span>IQ</span><small>CONTENT STUDIO</small></NavLink>
      <nav aria-label="Admin navigation">{navigation.filter(item => canAccess(admin, item.permission)).map(item => <NavLink key={item.to} end={item.end} to={item.to}>{item.label}</NavLink>)}</nav>
      <div className="sidebar-note">Your publishing workspace<p>Build pages, manage assets, and review content before publishing.</p></div>
    </aside>
    <div className="workspace-main"><header className="topbar"><span>Website management</span><div className="account"><span title={admin.email}>{admin.email}</span><button className="btn-ghost" onClick={() => navigate('/admin/logout')}>Sign out</button></div></header>
      {error && <div className="error" role="alert">{error}</div>}
      <main><React.Suspense fallback={<div className="admin-shell" role="status">Loading workspace…</div>}><Outlet /></React.Suspense></main><footer className="workspace-footer">LoomIQ · Content management</footer>
    </div>
  </div>
}
