import React from 'react'

export default function LoginPage(){
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  async function submit(e: React.FormEvent){
    e.preventDefault(); if (loading) return; setLoading(true); setError(null)
    try{
      const res = await fetch('/api/admin/login', { method: 'POST', signal: AbortSignal.timeout(15000), headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, password }) })
      const json = await res.json().catch(() => ({ message: 'The server is unavailable. Please try again.' }))
      if(!res.ok) throw new Error(json?.message || 'Login failed')
      window.location.href = '/'
    }catch(err:any){ setError(err.message || 'Login failed') }
    finally{ setLoading(false) }
  }
  return (
    <div className="center">
      <form className="card" onSubmit={submit}>
        <p className="eyebrow">LOOMIQ CONTENT STUDIO</p><h2>Admin sign in</h2><p className="sub">Sign in to manage your website content.</p>
        <label>Email
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="username" disabled={loading} required />
        </label>
        <label>Password
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="current-password" disabled={loading} required />
        </label>
        {error && <div className="error" role="alert">{error}</div>}
        <button type="submit" disabled={loading}>{loading? 'Signing in...' : 'Sign in'}</button>
      </form>
    </div>
  )
}
