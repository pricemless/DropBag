import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

function CrewView() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get(`http://localhost:3000/crew/${token}`)
      .then(res => setData(res.data))
      .catch(() => setError('Race not found. Check your link.'))
  }, [token])

  if (error) return (
    <div className="page">
      <div className="empty-state">
        <h3>Invalid Link</h3>
        <p>{error}</p>
      </div>
    </div>
  )

  if (!data) return (
    <div className="page">
      <div className="empty-state">
        <h3>Loading...</h3>
      </div>
    </div>
  )

  const { race, stations } = data

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: '8px' }}>
          CREW VIEW — READ ONLY
        </div>
        <h1>{race.name}</h1>
        <p>{race.distance} miles · {stations.length} crew access points</p>
      </div>

      <div style={{
        background: 'rgba(255,107,0,0.08)',
        border: '1px solid rgba(255,107,0,0.3)',
        borderRadius: '6px',
        padding: '16px 20px',
        marginBottom: '30px',
        fontSize: '13px',
        color: 'var(--text-dim)'
      }}>
        📋 Share this page with your crew. They can view aid stations, cutoff times, and crew notes without needing an account.
      </div>

      {stations.map((station, index) => (
        <div key={station.id} style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '20px',
          marginBottom: '12px',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            letterSpacing: '0.1em'
          }}>
            STOP {index + 1} OF {stations.length}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
            <div style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '3rem',
              color: 'var(--orange)',
              lineHeight: 1,
              minWidth: '80px'
            }}>
              {station.distance}
              <span style={{ display: 'block', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.15em' }}>MILE</span>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', marginBottom: '6px' }}>
                {station.name}
              </div>
              <div style={{ color: 'var(--orange)', fontSize: '13px', marginBottom: '10px' }}>
                ⏱ Cutoff: {station.cutoff_time}
              </div>
              {station.crew_notes && (
                <div style={{
                  background: '#0e0e0e',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  padding: '12px',
                  fontSize: '13px',
                  color: 'var(--text-dim)',
                  lineHeight: 1.6
                }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', letterSpacing: '0.1em' }}>CREW NOTES</span>
                  <br />{station.crew_notes}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default CrewView
