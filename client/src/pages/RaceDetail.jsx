import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { countdown, crewUrl, formatDate, pct } from '../format'
import Icon from '../icons'
import { CourseStrip, Empty, Loading, ProgressRing, StationStatus } from '../components'

const emptyStation = { name: '', distance: '', cutoff_time: '', crew_notes: '', crew_access: true }

function StationForm({ initial = emptyStation, submitLabel, onSubmit, onCancel, onDelete }) {
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
    <form className="card pad form" onSubmit={submit}>
      <div className="grid-2">
        <div className="field">
          <label>Station name</label>
          <input required placeholder="Foresthill" value={form.name} onChange={set('name')} autoFocus />
        </div>
        <div className="field">
          <label>Mile</label>
          <input required type="number" inputMode="decimal" min="0" step="any" placeholder="62" value={form.distance} onChange={set('distance')} />
        </div>
      </div>
      <div className="field">
        <label>Cutoff</label>
        <input placeholder="10:45 PM" value={form.cutoff_time} onChange={set('cutoff_time')} />
      </div>
      <div className="field">
        <label>Notes for your crew</label>
        <textarea rows={3} placeholder="Where to park, what to have ready, pacer pickup…" value={form.crew_notes} onChange={set('crew_notes')} />
      </div>
      <label className="toggle">
        <input type="checkbox" checked={form.crew_access} onChange={set('crew_access')} />
        <span>Crew can meet me here</span>
      </label>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="actions">
        <button className="btn btn-primary">{submitLabel}</button>
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>}
        {onDelete && <button type="button" className="btn btn-danger push-right" onClick={onDelete}><Icon name="trash" size={16} /> Delete</button>}
      </div>
    </form>
  )
}

function BagItems({ station, onToggle, onChange }) {
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')

  async function add(e) {
    e.preventDefault()
    if (!label.trim()) return
    await api.post(`/races/stations/${station.id}/items`, { label })
    setLabel('')
    onChange()
  }

  async function toggle(item) {
    onToggle(item.id, !item.packed) // feels instant; server catches up
    try {
      await api.patch(`/races/items/${item.id}`, { packed: !item.packed })
    } catch {
      onChange()
    }
  }

  async function remove(item) {
    await api.del(`/races/items/${item.id}`)
    onChange()
  }

  return (
    <div className="items">
      {station.items.map(item => (
        <span key={item.id} className={`item ${item.packed ? 'packed' : ''}`}>
          <button className="item-toggle" onClick={() => toggle(item)} aria-pressed={item.packed}>
            <span className="item-box">{item.packed && <Icon name="check" size={12} />}</span>
            {item.label}
          </button>
          {adding && (
            <button className="item-remove" aria-label={`Remove ${item.label}`} onClick={() => remove(item)}><Icon name="x" size={12} /></button>
          )}
        </span>
      ))}
      {adding ? (
        <form className="item-add" onSubmit={add}>
          <input placeholder="Add an item" value={label} onChange={e => setLabel(e.target.value)} autoFocus />
          <button className="btn btn-primary btn-small" disabled={!label.trim()}>Add</button>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => { setAdding(false); setLabel('') }}>Done</button>
        </form>
      ) : (
        <button className="item item-new" onClick={() => setAdding(true)}>
          <Icon name={station.items.length ? 'edit' : 'plus'} size={13} /> {station.items.length ? 'Edit bag' : 'Add bag items'}
        </button>
      )}
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
    <div className="page"><Empty icon="pin" title={error}><p><Link to="/races" className="link">Back to my races</Link></p></Empty></div>
  )
  if (!plan) return <Loading />

  const { race, stations } = plan
  const link = crewUrl(race.share_token)
  const allItems = stations.flatMap(s => s.items)
  const packedCount = allItems.filter(i => i.packed).length
  const soon = countdown(race.race_date)

  async function share() {
    // On iPhone this opens the share sheet, so the link can go straight to Messages.
    if (navigator.share) {
      try {
        await navigator.share({ title: `${race.name} crew plan`, text: `Here's my crew plan for ${race.name}`, url: link })
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
    if (!confirm('Make a new crew link? The old one will stop working.')) return
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
    try {
      await api.put(`/races/${race.id}`, Object.fromEntries(new FormData(e.target)))
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
    setEditingStation(null)
    load()
  }

  return (
    <div className="page">
      <Link to="/races" className="back"><Icon name="back" size={16} /> My races</Link>

      {editingRace ? (
        <form className="card pad form" onSubmit={saveRace}>
          <h3>Edit race</h3>
          <div className="field"><label>Race name</label><input name="name" required defaultValue={race.name} /></div>
          <div className="grid-2">
            <div className="field"><label>Distance (miles)</label><input name="distance" type="number" inputMode="decimal" step="any" min="1" required defaultValue={race.distance} /></div>
            <div className="field"><label>Race date</label><input name="race_date" type="date" defaultValue={race.race_date ?? ''} /></div>
          </div>
          <div className="field"><label>Location</label><input name="location" defaultValue={race.location ?? ''} /></div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="actions">
            <button className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditingRace(false)}>Cancel</button>
            <button type="button" className="btn btn-danger push-right" onClick={deleteRace}><Icon name="trash" size={16} /> Delete race</button>
          </div>
        </form>
      ) : (
        <div className="page-head row-between align-start">
          <div>
            {(race.race_date || soon) && <div className="eyebrow">{[formatDate(race.race_date, { month: 'short', day: 'numeric' }), soon].filter(Boolean).join(' · ')}</div>}
            <h1>{race.name}</h1>
            <div className="meta">
              {race.location && <><Icon name="pin" size={14} /> {race.location} · </>}
              {race.distance} mi · {stations.filter(s => s.crew_access).length} crew stops
            </div>
          </div>
          <button className="icon-btn" aria-label="Edit race" onClick={() => setEditingRace(true)}><Icon name="edit" /></button>
        </div>
      )}

      <CourseStrip distance={race.distance} stations={stations} />

      <div className="share-card">
        <div>
          <b>Share with your crew</b>
          <span>They'll see stops, cutoffs and bags. No account needed.</span>
        </div>
        <button className="btn btn-on-share" onClick={share}>
          <Icon name={copied ? 'check' : 'share'} size={16} /> {copied ? 'Copied' : 'Share'}
        </button>
      </div>
      <div className="share-links">
        <a href={link} target="_blank" rel="noreferrer" className="link small"><Icon name="link" size={14} /> Preview crew view</a>
        <button className="link small" onClick={resetLink}><Icon name="refresh" size={14} /> New link</button>
      </div>

      {allItems.length > 0 && (
        <div className="ring-row">
          <ProgressRing value={pct(packedCount, allItems.length)} />
          <div>
            <b>Drop bags {pct(packedCount, allItems.length)}% packed</b>
            <div className="muted small">
              {packedCount === allItems.length ? 'Everything is packed. Nice work.' : `${allItems.length - packedCount} items left across ${stations.filter(s => s.items.some(i => !i.packed)).length} bags`}
            </div>
          </div>
        </div>
      )}

      <div className="row-between section-row">
        <h2 className="section-title">Aid stations</h2>
        {!adding && stations.length > 0 && <button className="btn btn-ghost btn-small" onClick={() => setAdding(true)}><Icon name="plus" size={16} /> Station</button>}
      </div>

      {adding && (
        <StationForm
          submitLabel="Add station"
          onCancel={() => setAdding(false)}
          onSubmit={async form => { await api.post(`/races/${race.id}/stations`, form); setAdding(false); load() }}
        />
      )}

      {stations.length === 0 && !adding && (
        <Empty icon="pin" title="No aid stations yet">
          <p>Add the stations where you'll see your crew or have a drop bag.</p>
          <button className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" /> Add a station</button>
        </Empty>
      )}

      <div className="timeline">
        {stations.map(station => {
          const done = station.items.length > 0 && station.items.every(i => i.packed)
          return (
            <div key={station.id} className={`stop ${done ? 'done' : ''} ${station.crew_access ? '' : 'nocrew'}`}>
              <div className="stop-dot">{done && <Icon name="check" size={12} />}</div>
              {editingStation === station.id ? (
                <StationForm
                  initial={station}
                  submitLabel="Save"
                  onCancel={() => setEditingStation(null)}
                  onDelete={() => deleteStation(station)}
                  onSubmit={async form => { await api.put(`/races/stations/${station.id}`, form); setEditingStation(null); load() }}
                />
              ) : (
                <div className="card stop-card">
                  <div className="row-between">
                    <h3>{station.name}</h3>
                    <div className="stop-right">
                      <span className="mile">Mile {station.distance}</span>
                      <button className="icon-btn icon-btn-sm" aria-label={`Edit ${station.name}`} onClick={() => setEditingStation(station.id)}><Icon name="edit" size={16} /></button>
                    </div>
                  </div>
                  <StationStatus station={station} />
                  {station.crew_notes && <p className="note">{station.crew_notes}</p>}
                  <BagItems station={station} onToggle={setPacked} onChange={load} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
