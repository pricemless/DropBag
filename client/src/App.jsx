import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Pacers from './pages/Pacers'
import CrewView from './pages/CrewView'

function Nav() {
  const location = useLocation()
  return (
    <nav className="nav">
      <span className="nav-logo">DROPBAG</span>
      <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
        Races
      </Link>
      <Link to="/pacers" className={`nav-link ${location.pathname === '/pacers' ? 'active' : ''}`}>
        Pacer Finder
      </Link>
    </nav>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pacers" element={<Pacers />} />
        <Route path="/crew/:token" element={<CrewView />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
