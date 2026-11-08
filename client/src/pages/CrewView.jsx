import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import { countdown, formatDate } from '../format'
import Icon from '../icons'
import { CourseStrip, Empty, Loading, StationStatus } from '../components'
import { Topo } from './Landing'

export default function CrewView() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/crew/${token}`).then(setData).catch(err => setError(err.message))
  }, [token])

  if (error) return (
    <div className="page"><Empty icon="link" title="This link doesn't work"><p>{error}. Ask your runner to send a new one.</p></Empty></div>
  )
  if (!data) return <Loading />

  const { race, stations } = data
  const crewStops = stations.filter(s => s.crew_access)
  const soon = countdown(race.race_date)

  return (
    <div className="crew">
      <section className="hero hero-compact">
        <Topo />
        <div className="hero-inner">
          <div className="hero-brand"><Icon name="bag" size={18} /> DropBag crew plan</div>
          <h1>{race.name}</h1>
          <p>
            {race.runner ? `${race.runner}'s race` : 'Race plan'}
            {race.race_date && <> · {formatDate(race.race_date)}</>}
            {soon && soon !== 'Finished' && <> · {soon}</>}
          </p>
          <div className="hero-stats">
            <div><b>{race.distance}</b><span>miles</span></div>
            <div><b>{crewStops.length}</b><span>crew stops</span></div>
            {race.location && <div><b className="hero-loc">{race.location}</b><span>location</span></div>}
          </div>
        </div>
      </section>

      <div className="page">
        <CourseStrip distance={race.distance} stations={stations} />

        {stations.length === 0 && <Empty icon="pin" title="No stations yet"><p>Your runner hasn't added any aid stations.</p></Empty>}

        <div className="timeline">
          {stations.map(station => {
            const stop = crewStops.indexOf(station) + 1
            return (
              <div key={station.id} className={`stop ${station.crew_access ? '' : 'nocrew'}`}>
                <div className="stop-dot">{stop > 0 && <span className="stop-num">{stop}</span>}</div>
                <div className="card stop-card">
                  <div className="row-between">
                    <h3>{station.name}</h3>
                    <span className="mile">Mile {station.distance}</span>
                  </div>
                  <StationStatus station={station} />
                  {station.crew_notes && <p className="note">{station.crew_notes}</p>}
                  {station.items.length > 0 && (
                    <div className="items">
                      {station.items.map(item => (
                        <span key={item.id} className={`item readonly ${item.packed ? 'packed' : ''}`}>
                          <span className="item-box">{item.packed && <Icon name="check" size={12} />}</span>
                          {item.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <p className="center muted small" style={{ marginTop: 28 }}>Made with DropBag</p>
      </div>
    </div>
  )
}
