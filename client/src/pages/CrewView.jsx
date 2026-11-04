import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import { formatDate } from '../format'

export default function CrewView() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/crew/${token}`).then(setData).catch(err => setError(err.message))
  }, [token])

  if (error) return (
    <div className="page"><div className="empty-state"><h3>Invalid Link</h3><p>{error}. Ask your runner for a new one.</p></div></div>
  )
  if (!data) return <div className="page"><div className="empty-state"><h3>Loading…</h3></div></div>

  const { race, stations } = data
  const crewStops = stations.filter(s => s.crew_access)

  return (
    <div className="page">
      <div className="page-header">
        <div className="kicker">Crew Plan{race.runner && <> · {race.runner}</>}</div>
        <h1>{race.name}</h1>
        <p>
          {race.distance} mi
          {race.race_date && <> · {formatDate(race.race_date)}</>}
          {race.location && <> · {race.location}</>}
          {' · '}{crewStops.length} crew {crewStops.length === 1 ? 'stop' : 'stops'}
        </p>
      </div>

      {stations.length === 0 && <div className="empty-state"><h3>No Stations Yet</h3><p>Your runner hasn't added any aid stations.</p></div>}

      {stations.map(station => {
        const stopNumber = crewStops.indexOf(station) + 1
        return (
          <div key={station.id} className={`station ${station.crew_access ? '' : 'station-dim'}`}>
            <div className="station-top">
              <div className="station-mile">{station.distance}<span>MILE</span></div>
              <div className="station-body">
                <div className="station-name">
                  {station.name}
                  {station.crew_access
                    ? <span className="tag tag-orange">Crew Stop {stopNumber}/{crewStops.length}</span>
                    : <span className="tag tag-muted">No Crew</span>}
                </div>
                {station.cutoff_time && <div className="station-cutoff">⏱ Cutoff {station.cutoff_time}</div>}
                {station.crew_notes && <div className="station-notes">{station.crew_notes}</div>}
              </div>
            </div>
            {station.items.length > 0 && (
              <div className="dropbag">
                <div className="dropbag-head"><span>DROP BAG</span></div>
                {station.items.map(item => (
                  <div key={item.id} className={`check-item readonly ${item.packed ? 'done' : ''}`}>
                    <span>{item.packed ? '✓' : '○'} {item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
