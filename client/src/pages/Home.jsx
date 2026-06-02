import { useState, useEffect } from 'react'
import axios from 'axios'

function Home() {
  const [races, setRaces] = useState([])
  const [selectedRace, setSelectedRace] = useState(null)
  const [stations, setStations] = useState([])
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    axios.get('http://localhost:3000/races')
      .then(res => setRaces(res.data))
      .catch(err => console.error(err))
  }, [])

  function selectRace(race) {
    setSelectedRace(race)
    axios.get(`http://localhost:3000/race/${race.id}/stations`)
      .then(res => setStations(res.data.stations))
      .catch(err => console.error(err))
  }

  function copyCrewLink(e, race) {
    e.stopPropagation()
    const url = `${window.location.origin}/crew/${race.share_token}`
    navigator.clipboard.writeText(url)
    setCopied(race.id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Race Dashboard</h1>
        <p>Select a race to view aid stations and crew notes</p>
      </div>

      {races.map(race => (
        <div
          key={race.id}
          className={`card ${selectedRace?.id === race.id ? 'active' : ''}`}
          onClick={() => selectRace(race)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="card-title">{race.name}</div>
              <div className="card-meta">{race.distance} miles</div>
            </div>
            <button
              onClick={e => copyCrewLink(e, race)}
              style={{
                background: copied === race.id ? 'var(--green)' : 'transparent',
                border: `1px solid ${copied === race.id ? 'var(--green)' : 'var(--border-bright)'}`,
                color: copied === race.id ? '#000' : 'var(--text-dim)',
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontFamily: 'Bebas Neue, sans-serif',
                letterSpacing: '0.1em',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {copied === race.id ? '✓ COPIED' : 'COPY CREW LINK'}
            </button>
          </div>
        </div>
      ))}

      {selectedRace && (
        <>
          <hr className="divider" />
          <div className="page-header">
            <h2>{selectedRace.name} — Aid Stations</h2>
            <p>{stations.length} stations · {selectedRace.distance} miles total</p>
          </div>

          {stations.length === 0 && (
            <div className="empty-state">
              <h3>No Stations Yet</h3>
              <p>Add aid stations to this race</p>
            </div>
          )}

          {stations.map(station => (
            <div key={station.id} className="station-card">
              <div className="station-mile">
                {station.distance}
                <span>MILE</span>
              </div>
              <div>
                <div className="station-name">{station.name}</div>
                <div className="station-cutoff">⏱ {station.cutoff_time}</div>
              </div>
              <div className="station-notes">{station.crew_notes}</div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export default Home
