import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { formatDate } from '../format'

const empty = { name: '', distance: '', race_date: '', location: '' }

export default function Dashboard() {
  const { user, refresh } = useAuth()
  const navigate = useNavigate()
  const [races, setRaces] = useState(null)
  const [form, setForm] = useState(empty)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/races').then(setRaces).catch(err => setError(err.message))
  }, [])

  async function create(e) {
    e.preventDefault()
    setError('')
    try {
      const race = await api.post('/races', form)
      refresh()
      navigate(`/races/${race.id}`)
    } catch (err) {
      setError(err.message)
    }
  }

  const { races: used, raceLimit } = user.usage
  const atLimit = raceLimit !== null && used >= raceLimit
  const set = field => e => setForm({ ...form, [field]: e.target.value })

  return (
    <div className="page">
      <div className="page-header row-between">
        <div>
          <h1>My Races</h1>
          <p>{raceLimit === null ? `${used} races · Pro plan` : `${used} of ${raceLimit} free races used`}</p>
        </div>
        {!showForm && !atLimit && <button className="btn" onClick={() => setShowForm(true)}>+ New Race</button>}
      </div>

      {atLimit && (
        <div className="alert">
          You've used all {raceLimit} races on the Free plan. Delete a past race to add another. Pro, with unlimited races, is coming soon.
        </div>
      )}

      {showForm && (
        <form className="form-card" onSubmit={create}>
          <h3>New Race</h3>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="r-name">Race Name</label>
              <input id="r-name" required placeholder="Western States 100" value={form.name} onChange={set('name')} autoFocus />
            </div>
            <div className="form-field">
              <label htmlFor="r-dist">Distance (miles)</label>
              <input id="r-dist" required type="number" inputMode="decimal" min="1" step="any" placeholder="100" value={form.distance} onChange={set('distance')} />
            </div>
            <div className="form-field">
              <label htmlFor="r-date">Race Date</label>
              <input id="r-date" type="date" value={form.race_date} onChange={set('race_date')} />
            </div>
            <div className="form-field">
              <label htmlFor="r-loc">Location</label>
              <input id="r-loc" placeholder="Olympic Valley, CA" value={form.location} onChange={set('location')} />
            </div>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="row-gap">
            <button className="btn-primary">Create Race</button>
            <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setForm(empty) }}>Cancel</button>
          </div>
        </form>
      )}

      {!showForm && error && <div className="alert alert-error">{error}</div>}
      {races === null && !error && <div className="empty-state"><h3>Loading…</h3></div>}
      {races?.length === 0 && !showForm && (
        <div className="empty-state">
          <h3>No Races Yet</h3>
          <p>Add your next race to start planning aid stations and drop bags.</p>
          <br />
          <button className="btn" onClick={() => setShowForm(true)}>+ Add Your First Race</button>
        </div>
      )}

      {races?.map(race => (
        <Link key={race.id} to={`/races/${race.id}`} className="card card-link">
          <div className="card-title">{race.name}</div>
          <div className="card-meta">
            {race.distance} mi
            {race.race_date && <> · {formatDate(race.race_date)}</>}
            {race.location && <> · {race.location}</>}
            {' · '}{race.station_count} {race.station_count === 1 ? 'station' : 'stations'}
          </div>
        </Link>
      ))}
    </div>
  )
}
