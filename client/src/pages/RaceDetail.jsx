import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { crewUrl, formatDate } from '../format'

const emptyStation = { name: '', distance: '', cutoff_time: '', crew_notes: '', crew_access: true }

function StationForm({ initial = emptyStation, submitLabel, onSubmit, onCancel }) {
  const [form, setForm] = useState({ ...emptyStation, ...initial, cutoff_time: initial.cutoff_time ?? '', crew_notes: initial.crew_notes ?? '' })
  const [error, setError] = useState('')
  const set = field => e => setForm({ ...form, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      await onSubmit(form)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <div className="form-grid">
        <div className="form-field">
          <label>Station Name</label>
          <input required placeholder="Foresthill" value={form.name} onChange={set('name')} autoFocus />
        </div>
        <div className="form-field">
          <label>Mile</label>
          <input required type="number" inputMode="decimal" min="0" step="any" placeholder="62" value={form.distance} onChange={set('distance')} />
        </div>
      </div>
      <div className="form-field">
        <label>Cutoff</label>
        <input placeholder="10:45 PM" value={form.cutoff_time} onChange={set('cutoff_time')} />
      </div>
      <div className="form-field">
        <label>Crew Notes</label>
        <textarea rows={3} placeholder="Where to park, what to have ready, pacer pickup…" value={form.crew_notes} onChange={set('crew_notes')} />
      </div>
      <label className="checkbox">
        <input type="checkbox" checked={form.crew_access} onChange={set('crew_access')} /> Crew can access this station
      </label>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="row-gap">
        <button className="btn-primary">{submitLabel}</button>
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  )
}

function DropBag({ station, onChange, onToggle }) {
  const [label, setLabel] = useState('')
  const packed = station.items.filter(i => i.packed).length

  async function add(e) {
    e.preventDefault()
    if (!label.trim()) return
    await api.post(`/races/stations/${station.id}/items`, { label })
    setLabel('')
    onChange()
  }

  async function toggle(item) {
    onToggle(item.id, !item.packed) // update the checkbox instantly
    try {
      await api.patch(`/races/items/${item.id}`, { packed: !item.packed })
    } catch {
      onChange() // roll back to what the server has
    }
  }

  async function remove(item) {
    await api.del(`/races/items/${item.id}`)
    onChange()
  }

  return (
    <div className="dropbag">
      <div className="dropbag-head">
        <span>DROP BAG</span>
        {station.items.length > 0 && (
          <span className={packed === station.items.length ? 'text-green' : ''}>{packed}/{station.items.length} packed</span>
        )}
      </div>
      {station.items.map(item => (
        <div key={item.id} className={`check-item ${item.packed ? 'done' : ''}`}>
          <label>
            <input type="checkbox" checked={item.packed} onChange={() => toggle(item)} />
            <span>{item.label}</span>
          </label>
          <button className="icon-btn" aria-label={`Remove ${item.label}`} onClick={() => remove(item)}>✕</button>
        </div>
      ))}
      <form className="add-item" onSubmit={add}>
        <input placeholder="Add item (e.g. dry socks)" value={label} onChange={e => setLabel(e.target.value)} />
        <button className="btn btn-small" disabled={!label.trim()}>Add</button>
      </form>
    </div>
  )
}

export default function RaceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { refresh: refreshUser } = useAuth()
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState('')
  const [editingRace, setEditingRace] = useState(false)
  const [editingStation, setEditingStation] = useState(null)
  const [adding, setAdding] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = useCallback(() =>
    api.get(`/races/${id}`).then(setPlan).catch(err => setError(err.message)), [id])

  useEffect(() => { load() }, [load])

  const setPacked = (itemId, packed) => setPlan(p => ({
    ...p,
    stations: p.stations.map(s => ({ ...s, items: s.items.map(i => i.id === itemId ? { ...i, packed } : i) })),
  }))

  if (error && !plan) return (
    <div className="page"><div className="empty-state"><h3>{error}</h3><p><Link to="/races">Back to my races</Link></p></div></div>
  )
  if (!plan) return <div className="page"><div className="empty-state"><h3>Loading…</h3></div></div>

  const { race, stations } = plan
  const link = crewUrl(race.share_token)
  const totalItems = stations.reduce((n, s) => n + s.items.length, 0)
  const packedItems = stations.reduce((n, s) => n + s.items.filter(i => i.packed).length, 0)

  async function share() {
    // iOS / Android: open the native share sheet so the link can go straight to iMessage or WhatsApp.
    if (navigator.share) {
      try {
        await navigator.share({ title: `${race.name} crew plan`, text: `Crew plan for ${race.name}`, url: link })
        return
      } catch (err) {
        if (err.name === 'AbortError') return
      }
    }
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function resetLink() {
    if (!confirm('Reset the crew link? The old link will stop working.')) return
    await api.post(`/races/${race.id}/share-token`)
    load()
  }

  async function deleteRace() {
    if (!confirm(`Delete ${race.name} and all its stations? This can't be undone.`)) return
    await api.del(`/races/${race.id}`)
    refreshUser()
    navigate('/races')
  }

  async function saveRace(e) {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.target))
    try {
      await api.put(`/races/${race.id}`, data)
      setEditingRace(false)
      setError('')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function deleteStation(station) {
    if (!confirm(`Delete ${station.name}?`)) return
    await api.del(`/races/stations/${station.id}`)
    load()
  }

  return (
    <div className="page">
      <Link to="/races" className="back-link">← My Races</Link>

      {editingRace ? (
        <form className="form-card" onSubmit={saveRace}>
          <div className="form-grid">
            <div className="form-field"><label>Race Name</label><input name="name" required defaultValue={race.name} /></div>
            <div className="form-field"><label>Distance (miles)</label><input name="distance" type="number" inputMode="decimal" step="any" min="1" required defaultValue={race.distance} /></div>
            <div className="form-field"><label>Race Date</label><input name="race_date" type="date" defaultValue={race.race_date ?? ''} /></div>
            <div className="form-field"><label>Location</label><input name="location" defaultValue={race.location ?? ''} /></div>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="row-gap">
            <button className="btn-primary">Save</button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditingRace(false)}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={deleteRace}>Delete Race</button>
          </div>
        </form>
      ) : (
        <div className="page-header row-between">
          <div>
            <h1>{race.name}</h1>
            <p>
              {race.distance} mi
              {race.race_date && <> · {formatDate(race.race_date)}</>}
              {race.location && <> · {race.location}</>}
            </p>
          </div>
          <button className="btn btn-ghost btn-small" onClick={() => setEditingRace(true)}>Edit</button>
        </div>
      )}

      <div className="share-box">
        <div>
          <div className="share-title">Crew Link</div>
          <div className="share-url">{link}</div>
          <div className="hint">Anyone with this link can view the plan. No account needed.</div>
        </div>
        <div className="row-gap">
          <button className={`btn btn-small ${copied ? 'btn-success' : ''}`} onClick={share}>
            {copied ? '✓ Copied' : 'Share With Crew'}
          </button>
          <a className="btn btn-ghost btn-small" href={link} target="_blank" rel="noreferrer">Preview</a>
          <button className="btn btn-ghost btn-small" onClick={resetLink}>Reset</button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat"><div className="stat-num">{stations.length}</div><div className="stat-label">Stations</div></div>
        <div className="stat"><div className="stat-num">{stations.filter(s => s.crew_access).length}</div><div className="stat-label">Crew Access</div></div>
        <div className="stat">
          <div className="stat-num">{totalItems ? `${Math.round((packedItems / totalItems) * 100)}%` : '—'}</div>
          <div className="stat-label">Bags Packed</div>
        </div>
      </div>

      <div className="row-between section-head">
        <h2>Aid Stations</h2>
        {!adding && <button className="btn btn-small" onClick={() => setAdding(true)}>+ Add Station</button>}
      </div>

      {adding && (
        <StationForm
          submitLabel="Add Station"
          onCancel={() => setAdding(false)}
          onSubmit={async form => { await api.post(`/races/${race.id}/stations`, form); setAdding(false); load() }}
        />
      )}

      {stations.length === 0 && !adding && (
        <div className="empty-state">
          <h3>No Stations Yet</h3>
          <p>Add the aid stations where you'll see your crew or have a drop bag.</p>
        </div>
      )}

      {stations.map(station => editingStation === station.id ? (
        <StationForm
          key={station.id}
          initial={station}
          submitLabel="Save Station"
          onCancel={() => setEditingStation(null)}
          onSubmit={async form => { await api.put(`/races/stations/${station.id}`, form); setEditingStation(null); load() }}
        />
      ) : (
        <div key={station.id} className="station">
          <div className="station-top">
            <div className="station-mile">{station.distance}<span>MILE</span></div>
            <div className="station-body">
              <div className="station-name">
                {station.name}
                {!station.crew_access && <span className="tag tag-muted">No Crew</span>}
              </div>
              {station.cutoff_time && <div className="station-cutoff">⏱ Cutoff {station.cutoff_time}</div>}
              {station.crew_notes && <div className="station-notes">{station.crew_notes}</div>}
            </div>
            <div className="station-actions">
              <button className="icon-btn" aria-label="Edit station" onClick={() => setEditingStation(station.id)}>✎</button>
              <button className="icon-btn" aria-label="Delete station" onClick={() => deleteStation(station)}>✕</button>
            </div>
          </div>
          <DropBag station={station} onChange={load} onToggle={setPacked} />
        </div>
      ))}
    </div>
  )
}
