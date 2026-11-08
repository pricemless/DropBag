import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { THEMES, useTheme } from '../theme'
import Icon from '../icons'

export default function Account() {
  const { user, logout } = useAuth()
  const [theme, setTheme] = useTheme()
  const navigate = useNavigate()
  const { races, raceLimit } = user.usage

  return (
    <div className="page">
      <div className="page-head">
        <h1>Hi, {user.name.split(' ')[0]}</h1>
        <p className="muted">{user.email}</p>
      </div>

      <div className="card pad plan-card">
        <div>
          <div className="eyebrow">{user.plan === 'pro' ? 'Pro plan' : 'Free plan'}</div>
          <b>{raceLimit === null ? `${races} races · unlimited` : `${races} of ${raceLimit} races used`}</b>
          {raceLimit !== null && (
            <div className="bar"><div style={{ width: `${Math.min(100, (races / raceLimit) * 100)}%` }} /></div>
          )}
        </div>
        {user.plan !== 'pro' && <span className="chip">Pro coming soon</span>}
      </div>

      <h2 className="section-title"><Icon name="palette" /> Appearance</h2>
      <p className="muted small" style={{ marginBottom: 12 }}>Pick a look. It's saved on this device.</p>
      <div className="theme-grid">
        {THEMES.map(t => (
          <button key={t.id} className={`theme-option ${theme === t.id ? 'selected' : ''}`} onClick={() => setTheme(t.id)} aria-pressed={theme === t.id}>
            <span className="swatches">
              {t.swatch.map(c => <i key={c} style={{ background: c }} />)}
            </span>
            <span className="theme-text">
              <b>{t.name}</b>
              <span>{t.blurb}</span>
            </span>
            {theme === t.id && <span className="theme-check"><Icon name="check" size={16} /></span>}
          </button>
        ))}
      </div>

      <button className="btn btn-ghost btn-block" style={{ marginTop: 28 }} onClick={async () => { await logout(); navigate('/') }}>
        Log out
      </button>
    </div>
  )
}
