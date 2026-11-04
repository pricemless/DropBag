import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = still loading

  const refresh = useCallback(() =>
    api.get('/auth/me').then(r => setUser(r.user ?? null)).catch(() => setUser(null)), [])

  useEffect(() => { refresh() }, [refresh])

  const value = {
    user,
    refresh,
    login: async (email, password) => setUser((await api.post('/auth/login', { email, password })).user),
    signup: async (name, email, password) => setUser((await api.post('/auth/signup', { name, email, password })).user),
    logout: async () => { await api.post('/auth/logout'); setUser(null) },
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

export function RequireAuth({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (user === undefined) return <div className="page"><div className="empty-state"><h3>Loading…</h3></div></div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
