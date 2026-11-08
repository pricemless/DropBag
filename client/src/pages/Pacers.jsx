import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import Icon from '../icons'
import { Empty, Loading } from '../components'

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

  if (listings === null && !error) return <Loading />

  return (
    <div className="page">
      <div className="page-head row-between">
        <div>
          <h1>Pacer finder</h1>
          <p className="muted">Find a pacer, or help someone finish.</p>
        </div>
        {!showForm && (user
          ? <button className="btn btn-primary" onClick={() => setShowForm(true)}><Icon name="plus" /> Post</button>
          : <Link to="/login" state={{ from: '/pacers' }} className="btn btn-ghost">Log in to post</Link>)}
      </div>

      {showForm && (
        <form className="card pad form" onSubmit={submit}>
          <h3>Post a listing</h3>
          <div className="segmented segmented-block">
            <button type="button" className={form.type === 'needed' ? 'active' : ''} onClick={() => setForm({ ...form, type: 'needed' })}>I need a pacer</button>
            <button type="button" className={form.type === 'available' ? 'active' : ''} onClick={() => setForm({ ...form, type: 'available' })}>I can pace</button>
          </div>
          <div className="field"><label>Race</label><input required placeholder="Leadville 100" value={form.race_name} onChange={set('race_name')} /></div>
          <div className="grid-3">
            <div className="field"><label>When</label><input placeholder="Aug 2027" value={form.race_date} onChange={set('race_date')} /></div>
            <div className="field"><label>From mile</label><input type="number" inputMode="decimal" min="0" step="any" placeholder="50" value={form.miles_start} onChange={set('miles_start')} /></div>
            <div className="field"><label>To mile</label><input type="number" inputMode="decimal" min="0" step="any" placeholder="100" value={form.miles_end} onChange={set('miles_end')} /></div>
          </div>
          <div className="field"><label>Experience</label><input placeholder="Ran Leadville twice, know the course well" value={form.experience} onChange={set('experience')} /></div>
          <div className="field"><label>How to reach you</label><input required placeholder="Email or Instagram handle" value={form.contact} onChange={set('contact')} /></div>
          <div className="field"><label>Anything else</label><textarea rows={2} value={form.notes} onChange={set('notes')} /></div>
          <small className="muted">Your contact info is shown publicly on this listing.</small>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="actions">
            <button className="btn btn-primary">Post listing</button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="search">
        <Icon name="search" size={18} />
        <input placeholder="Search races" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="segmented">
        {[['all', 'All'], ['needed', 'Need a pacer'], ['available', 'Can pace']].map(([v, label]) => (
          <button key={v} className={filter === v ? 'active' : ''} onClick={() => setFilter(v)}>{label}</button>
        ))}
      </div>

      {listings && filtered.length === 0 && (
        <Empty icon="users" title="No listings yet"><p>Be the first to post for this race.</p></Empty>
      )}

      <div className="stack">
        {filtered.map(listing => (
          <div key={listing.id} className="card pacer">
            <div className="row-between">
              <span className={`chip ${listing.type === 'needed' ? 'chip-warn' : 'chip-good'}`}>
                {listing.type === 'needed' ? 'Needs a pacer' : 'Available to pace'}
              </span>
              {listing.mine && <button className="icon-btn icon-btn-sm" aria-label="Remove listing" onClick={() => remove(listing)}><Icon name="trash" size={16} /></button>}
            </div>
            <h3>{listing.race_name}</h3>
            {(miles(listing) || listing.race_date) && <div className="meta">{[miles(listing), listing.race_date].filter(Boolean).join(' · ')}</div>}
            {listing.experience && <p className="pacer-exp">{listing.experience}</p>}
            {listing.notes && <p className="note">{listing.notes}</p>}
            <div className="pacer-contact"><Icon name="mail" size={15} /> {listing.contact}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
