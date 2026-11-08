import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import Icon from '../icons'

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup'
  const { user, login, signup } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const dest = location.state?.from || '/races'
  if (user) return <Navigate to={dest} replace />

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isSignup) await signup(form.name, form.email, form.password)
      else await login(form.email, form.password)
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const set = field => e => setForm({ ...form, [field]: e.target.value })

  return (
    <div className="page page-narrow">
      <div className="auth-head">
        <div className="feature-icon"><Icon name="bag" size={24} /></div>
        <h1>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
        <p className="muted">{isSignup ? 'Free for your first 2 races. No card needed.' : 'Log in to your race plans.'}</p>
      </div>
      <form className="card pad" onSubmit={submit}>
        {isSignup && (
          <div className="field">
            <label htmlFor="name">Your name</label>
            <input id="name" autoComplete="name" required value={form.name} onChange={set('name')} />
          </div>
        )}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required minLength={isSignup ? 8 : undefined}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={form.password} onChange={set('password')} />
          {isSignup && <small className="muted">At least 8 characters</small>}
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <button className="btn btn-primary btn-block btn-lg" disabled={busy}>{busy ? 'One sec…' : isSignup ? 'Create account' : 'Log in'}</button>
      </form>
      <p className="center muted small" style={{ marginTop: 18 }}>
        {isSignup ? <>Already have an account? <Link to="/login" className="link">Log in</Link></>
          : <>New here? <Link to="/signup" className="link">Create a free account</Link></>}
      </p>
    </div>
  )
}
