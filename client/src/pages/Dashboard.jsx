import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { countdown, formatDate, pct } from '../format'
import Icon from '../icons'
import { Empty, Loading } from '../components'

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

  if (races === null && !error) return <Loading />

  const { races: used, raceLimit } = user.usage
  const atLimit = raceLimit !== null && used >= raceLimit
  const set = field => e => setForm({ ...form, [field]: e.target.value })

  return (
    <div className="page">
      <div className="page-head row-between">
        <div>
          <h1>My races</h1>
          <p className="muted">{raceLimit === null ? `${used} races` : `${used} of ${raceLimit} free races`}</p>
        </div>
        {!showForm && !atLimit && races?.length > 0 && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Icon name="plus" /> New race</button>
        )}
      </div>

      {atLimit && (
        <div className="alert">You've used all {raceLimit} races on the Free plan. Delete a past race to add another. Pro, with unlimited races, is coming soon.</div>
      )}

      {showForm && (
        <form className="card pad form" onSubmit={create}>
          <h3>New race</h3>
          <div className="field">
            <label htmlFor="r-name">Race name</label>
            <input id="r-name" required placeholder="Western States 100" value={form.name} onChange={set('name')} autoFocus />
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="r-dist">Distance (miles)</label>
              <input id="r-dist" required type="number" inputMode="decimal" min="1" step="any" placeholder="100" value={form.distance} onChange={set('distance')} />
            </div>
            <div className="field">
              <label htmlFor="r-date">Race date</label>
              <input id="r-date" type="date" value={form.race_date} onChange={set('race_date')} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="r-loc">Location</label>
            <input id="r-loc" placeholder="Olympic Valley, CA" value={form.location} onChange={set('location')} />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="actions">
            <button className="btn btn-primary">Create race</button>
            <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setForm(empty) }}>Cancel</button>
          </div>
        </form>
      )}

      {!showForm && error && <div className="alert alert-error">{error}</div>}

      {races?.length === 0 && !showForm && (
        <Empty icon="pin" title="Plan your first race">
          <p>Add a race, then map out your aid stations and drop bags.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Icon name="plus" /> Add a race</button>
        </Empty>
      )}

      <div className="stack">
        {races?.map(race => {
          const soon = countdown(race.race_date)
          const packed = pct(race.packed_count, race.item_count)
          return (
            <Link key={race.id} to={`/races/${race.id}`} className="card race-card">
              <div className="race-card-top">
                <div>
                  {soon && <div className="eyebrow">{soon}</div>}
                  <h3>{race.name}</h3>
                  <div className="meta">
                    {race.distance} mi
                    {race.race_date && <> · {formatDate(race.race_date)}</>}
                    {race.location && <> · {race.location}</>}
                  </div>
                </div>
                <span className="race-arrow" aria-hidden="true">›</span>
              </div>
              <div className="race-card-foot">
                <span className="chip"><Icon name="pin" size={13} /> {race.station_count} {race.station_count === 1 ? 'station' : 'stations'}</span>
                {race.item_count > 0 && (
                  <span className="bag-progress">
                    <span className="bar"><span style={{ width: `${packed}%` }} /></span>
                    <span className="small muted">{packed}% packed</span>
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
