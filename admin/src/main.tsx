import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, createRoutesFromElements, RouterProvider, Route, NavLink, useNavigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import PagesList from './pages/content/PagesList'
const Customers = React.lazy(() => import('./pages/Commerce').then(m=>({default:m.Customers})))
const Payments = React.lazy(() => import('./pages/Commerce').then(m=>({default:m.Payments})))
const Records = React.lazy(() => import('./pages/Records'))
const WebsiteContent = React.lazy(() => import('./pages/WebsiteContent'))
const PageEditor = React.lazy(() => import('./pages/content/PageEditor'))
import MediaManager from './components/MediaManager'
import AdminShell from './components/AdminShell'
import './styles.css'

class ErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <div className="center"><div className="card"><h1>Something went wrong</h1><p>Reload the admin to try again.</p><button onClick={() => location.reload()}>Reload</button></div></div> : this.props.children }
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
    <Route element={<AdminShell />}>
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
