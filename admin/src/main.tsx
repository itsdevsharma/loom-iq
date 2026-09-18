import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, createRoutesFromElements, RouterProvider, Route, Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import PagesList from './pages/content/PagesList'
const Customers = React.lazy(() => import('./pages/Commerce').then(m=>({default:m.Customers})))
const Payments = React.lazy(() => import('./pages/Commerce').then(m=>({default:m.Payments})))
const Records = React.lazy(() => import('./pages/Records'))
const WebsiteContent = React.lazy(() => import('./pages/WebsiteContent'))
const PageEditor = React.lazy(() => import('./pages/content/PageEditor'))
import MediaManager from './components/MediaManager'
import './styles.css'

class ErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <div className="center"><div className="card"><h1>Something went wrong</h1><p>Reload the admin to try again.</p><button onClick={() => location.reload()}>Reload</button></div></div> : this.props.children }
}

function AdminLayout() {
  const navigate = useNavigate()
  const [admin, setAdmin] = React.useState<{ email: string; roles: string[] } | null>(null)
  const [error, setError] = React.useState('')
  const check = React.useCallback(async () => {
    setError('')
    try {
      const res = await fetch('/api/admin/me', { credentials: 'include', signal: AbortSignal.timeout(10000) })
      if (res.status === 401) { navigate('/admin/login', { replace: true }); return }
      if (!res.ok) throw new Error('Unable to verify your session. Please try again.')
      setAdmin((await res.json()).admin)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to connect.') }
  }, [navigate])
  React.useEffect(() => { void check() }, [check])
  if (!admin) return <div className="center"><div role="status">{error || 'Loading your workspace…'}{error && <button onClick={check}>Retry</button>}</div></div>
  return <div className="workspace">
    <aside className="sidebar"><NavLink className="brand" to="/admin/">Loom<span>IQ</span><small>CONTENT STUDIO</small></NavLink>
      <nav aria-label="Admin navigation"><NavLink end to="/admin/">Overview</NavLink><NavLink to="/admin/website">Website content</NavLink><NavLink to="/admin/content">Custom pages</NavLink><NavLink to="/admin/media">Media library</NavLink><NavLink to="/admin/customers">Customers</NavLink><NavLink to="/admin/payments">Razorpay analytics</NavLink><NavLink to="/admin/records">Customer activity</NavLink></nav>
      <div className="sidebar-note">Your publishing workspace<p>Build pages, manage assets, and review content before publishing.</p></div>
    </aside>
    <div className="workspace-main"><header className="topbar"><span>Website management</span><div className="account"><span>{admin.email}</span><button className="btn-ghost" onClick={() => navigate('/admin/logout')}>Sign out</button></div></header>
      {error && <div className="error" role="alert">{error}</div>}
      <main><React.Suspense fallback={<div className="admin-shell" role="status">Loading editor…</div>}><Outlet /></React.Suspense></main><footer className="workspace-footer">LoomIQ · Content management</footer>
    </div>
  </div>
}

function Logout() {
  const navigate = useNavigate()
  const [error, setError] = React.useState('')
  const [retry, setRetry] = React.useState(0)
  React.useEffect(() => {
    setError('')
    fetch('/api/admin/logout', { method: 'POST', credentials: 'include', signal: AbortSignal.timeout(10000) })
      .then(res => { if (!res.ok) throw new Error('Unable to sign out. Please try again.'); navigate('/admin/login', { replace: true }) })
      .catch(e => setError(e.message))
  }, [navigate, retry])
  return <div className="admin-shell" role="status">{error || 'Signing out…'}{error && <button onClick={() => setRetry(r => r + 1)}>Retry</button>}</div>
}

const router = createBrowserRouter(createRoutesFromElements(<>
    <Route path="/admin/login" element={<LoginPage />} />
    <Route element={<AdminLayout />}>
      <Route path="admin" element={<Dashboard />} />
      <Route path="admin/logout" element={<Logout />} />
      <Route path="admin/customers" element={<Customers />} />
      <Route path="admin/payments" element={<Payments />} />
      <Route path="admin/records" element={<Records />} />
      <Route path="admin/website" element={<WebsiteContent />} />
      <Route path="admin/content" element={<PagesList />} />
      <Route path="admin/content/pages/:id" element={<PageEditor />} />
      <Route path="admin/media" element={<div className="admin-shell"><h1>Media library</h1><p className="sub">Upload and manage images and videos. Add alternative text to describe images.</p><MediaManager library /></div>} />
      <Route path="*" element={<div className="admin-shell"><h1>Page not found</h1><p>This admin address does not exist.</p><NavLink to="/admin/">Back to overview</NavLink></div>} />
    </Route>
  </>))
function App() { return <ErrorBoundary><RouterProvider router={router} /></ErrorBoundary> }
createRoot(document.getElementById('root')!).render(<App />)
