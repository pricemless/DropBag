import { BrowserRouter, Routes, Route, NavLink, Link, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, RequireAuth, useAuth } from './auth'
import Icon from './icons'
import { Empty } from './components'
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import RaceDetail from './pages/RaceDetail'
import Pacers from './pages/Pacers'
import CrewView from './pages/CrewView'
import Account from './pages/Account'

const TABS = [
  { to: '/races', icon: 'home', label: 'Races' },
  { to: '/pacers', icon: 'users', label: 'Pacers' },
  { to: '/me', icon: 'user', label: 'Me' },
]

function TopBar() {
  const { user } = useAuth()
  return (
    <header className="topbar">
      <Link to={user ? '/races' : '/'} className="brand"><Icon name="bag" size={20} /> DropBag</Link>
      <nav className="topnav">
        {user && TABS.map(t => <NavLink key={t.to} to={t.to} className="topnav-link">{t.label}</NavLink>)}
        {user === null && <NavLink to="/pacers" className="topnav-link">Pacers</NavLink>}
      </nav>
      {user === null && (
        <div className="topbar-actions">
          <Link to="/login" className="btn btn-ghost btn-small">Log in</Link>
          <Link to="/signup" className="btn btn-accent btn-small">Start free</Link>
        </div>
      )}
    </header>
  )
}

function TabBar() {
  const { user } = useAuth()
  if (!user) return null
  return (
    <nav className="tabbar">
      {TABS.map(t => (
        <NavLink key={t.to} to={t.to} className="tab">
          <Icon name={t.icon} size={23} /><span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

function Shell({ children }) {
  // The crew view is a stand-alone page for people without accounts.
  const crew = useLocation().pathname.startsWith('/crew/')
  return (
    <>
      {!crew && <TopBar />}
      <main className={crew ? '' : 'with-tabbar'}>{children}</main>
      {!crew && <TabBar />}
    </>
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
        <Shell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/races" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/races/:id" element={<RequireAuth><RaceDetail /></RequireAuth>} />
            <Route path="/me" element={<RequireAuth><Account /></RequireAuth>} />
            <Route path="/pacers" element={<Pacers />} />
            <Route path="/crew/:token" element={<CrewView />} />
            <Route path="*" element={<div className="page"><Empty icon="pin" title="Page not found"><p><Link to="/">Go home</Link></p></Empty></div>} />
          </Routes>
        </Shell>
      </AuthProvider>
    </BrowserRouter>
  )
}
