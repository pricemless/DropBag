import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'

const emptyForm = {
  type: 'needed', race_name: '', race_date: '', miles_start: '', miles_end: '',
  experience: '', contact: '', notes: '',
}

export default function Pacers() {
  const { user } = useAuth()
  const [listings, setListings] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const load = () => api.get('/pacers').then(setListings).catch(err => setError(err.message))
  // Re-fetch when login state changes so "mine" flags are correct.
  useEffect(() => { load() }, [user?.id])

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/pacers', form)
      setForm(emptyForm)
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function remove(listing) {
    if (!confirm('Remove this listing?')) return
    await api.del(`/pacers/${listing.id}`)
    load()
  }

  const set = field => e => setForm({ ...form, [field]: e.target.value })
  const filtered = (listings ?? []).filter(l =>
    l.race_name.toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || l.type === filter))

  const miles = l => l.miles_start != null && l.miles_end != null
    ? `Miles ${l.miles_start}–${l.miles_end}`
    : l.miles_start != null ? `From mile ${l.miles_start}` : null

  return (
    <div className="page">
      <div className="page-header row-between">
        <div>
          <h1>Pacer Finder</h1>
          <p>Find a pacer or offer to pace at an upcoming race</p>
        </div>
        {!showForm && (user
          ? <button className="btn" onClick={() => setShowForm(true)}>+ Post Listing</button>
          : <Link to="/login" state={{ from: '/pacers' }} className="btn btn-ghost">Log In to Post</Link>)}
      </div>

      {showForm && (
        <form className="form-card" onSubmit={submit}>
          <h3>Post a Listing</h3>
          <div className="form-field">
            <label>I am…</label>
            <select value={form.type} onChange={set('type')}>
              <option value="needed">Looking for a pacer</option>
              <option value="available">Available to pace</option>
            </select>
          </div>
          <div className="form-grid">
            <div className="form-field"><label>Race Name</label><input required placeholder="Leadville 100" value={form.race_name} onChange={set('race_name')} /></div>
            <div className="form-field"><label>Race Date</label><input placeholder="August 2027" value={form.race_date} onChange={set('race_date')} /></div>
            <div className="form-field"><label>Miles Start</label><input type="number" inputMode="decimal" min="0" step="any" placeholder="50" value={form.miles_start} onChange={set('miles_start')} /></div>
            <div className="form-field"><label>Miles End</label><input type="number" inputMode="decimal" min="0" step="any" placeholder="100" value={form.miles_end} onChange={set('miles_end')} /></div>
          </div>
          <div className="form-field"><label>Experience</label><input placeholder="Ran Leadville twice, know the course well" value={form.experience} onChange={set('experience')} /></div>
          <div className="form-field"><label>Contact</label><input required placeholder="Email or Instagram handle" value={form.contact} onChange={set('contact')} /></div>
          <div className="form-field"><label>Notes</label><textarea rows={2} placeholder="Anything else to know" value={form.notes} onChange={set('notes')} /></div>
          <small className="hint">Your contact info is shown publicly on this listing.</small>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="row-gap">
            <button className="btn-primary">Post Listing</button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="search-bar">
        <input placeholder="Search by race name…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="segmented">
          {[['all', 'All'], ['needed', 'Need Pacer'], ['available', 'Available']].map(([v, label]) => (
            <button key={v} className={filter === v ? 'active' : ''} onClick={() => setFilter(v)}>{label}</button>
          ))}
        </div>
      </div>

      {listings === null && <div className="empty-state"><h3>Loading…</h3></div>}
      {listings && filtered.length === 0 && (
        <div className="empty-state"><h3>No Listings Found</h3><p>Be the first to post for this race.</p></div>
      )}

      {filtered.map(listing => (
        <div key={listing.id} className={`pacer-card ${listing.type}`}>
          <div className="row-between">
            <span className={`tag ${listing.type === 'needed' ? 'tag-orange' : 'tag-blue'}`}>
              {listing.type === 'needed' ? 'Needs Pacer' : 'Available to Pace'}
            </span>
            {listing.mine && <button className="icon-btn" aria-label="Remove listing" onClick={() => remove(listing)}>✕</button>}
          </div>
          <div className="pacer-race">{listing.race_name}</div>
          <div className="pacer-miles">{[miles(listing), listing.race_date].filter(Boolean).join(' · ')}</div>
          {listing.experience && <div className="pacer-miles" style={{ marginTop: 6 }}>{listing.experience}</div>}
          <div className="pacer-contact">📬 {listing.contact}</div>
          {listing.notes && <div className="pacer-notes">"{listing.notes}"</div>}
        </div>
      ))}
    </div>
  )
}
