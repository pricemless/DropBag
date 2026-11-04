import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, RequireAuth, useAuth } from './auth'
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import RaceDetail from './pages/RaceDetail'
import Pacers from './pages/Pacers'
import CrewView from './pages/CrewView'

function Nav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <nav className="nav">
      <Link to={user ? '/races' : '/'} className="nav-logo" onClick={close}>DROPBAG</Link>
      <button className="nav-toggle" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? '✕' : '☰'}
      </button>
      <div className={`nav-links ${open ? 'open' : ''}`}>
        {user && <NavLink to="/races" className="nav-link" onClick={close}>My Races</NavLink>}
        <NavLink to="/pacers" className="nav-link" onClick={close}>Pacer Finder</NavLink>
        <span className="nav-spacer" />
        {user === null && <NavLink to="/login" className="nav-link" onClick={close}>Log In</NavLink>}
        {user === null && <Link to="/signup" className="btn btn-small" onClick={close}>Start Free</Link>}
        {user && (
          <>
            <span className="nav-user">{user.name}{user.plan === 'pro' && <span className="tag tag-orange">PRO</span>}</span>
            <button className="nav-link nav-button" onClick={async () => { close(); await logout(); navigate('/') }}>
              Log Out
            </button>
          </>
        )}
      </div>
    </nav>
  )
}

function Home() {
  const { user } = useAuth()
  if (user) return <Navigate to="/races" replace />
  return <Landing />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Nav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="/races" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/races/:id" element={<RequireAuth><RaceDetail /></RequireAuth>} />
          <Route path="/pacers" element={<Pacers />} />
          <Route path="/crew/:token" element={<CrewView />} />
          <Route path="*" element={<div className="page"><div className="empty-state"><h3>Page Not Found</h3><p><Link to="/">Go home</Link></p></div></div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
