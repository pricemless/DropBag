import Icon from './icons'

export function ProgressRing({ value, size = 52 }) {
  return (
    <div className="ring" style={{ '--p': value, width: size, height: size }}>
      <span>{value}%</span>
    </div>
  )
}

// Horizontal course line with a pin per station, placed by mile.
export function CourseStrip({ distance, stations }) {
  if (!stations.length) return null
  return (
    <div className="card course">
      <div className="row-between"><b>Course</b><span className="muted small">{distance} mi · {stations.length} stations</span></div>
      <div className="course-track">
        <div className="course-line" />
        {stations.map(s => {
          const left = Math.min(100, Math.max(0, (s.distance / distance) * 100))
          const total = s.items?.length ?? 0
          const packed = s.items?.filter(i => i.packed).length ?? 0
          const state = !total ? 'empty' : packed === total ? 'done' : 'todo'
          return <span key={s.id} className={`course-pin ${state} ${s.crew_access ? '' : 'nocrew'}`} style={{ left: `${left}%` }} title={`${s.name} · mile ${s.distance}`} />
        })}
      </div>
      <div className="course-axis">
        <span>Start</span><span>{Math.round(distance / 2)}</span><span>{distance} mi</span>
      </div>
    </div>
  )
}

export function Loading() {
  return <div className="page"><div className="empty"><div className="spinner" /></div></div>
}

export function Empty({ icon = 'bag', title, children }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon name={icon} size={26} /></div>
      <h3>{title}</h3>
      {children}
    </div>
  )
}

export function StationStatus({ station }) {
  const total = station.items.length
  const packed = station.items.filter(i => i.packed).length
  return (
    <div className="chips">
      {station.cutoff_time && <span className="chip"><Icon name="clock" size={13} /> Cutoff {station.cutoff_time}</span>}
      {!station.crew_access && <span className="chip">No crew access</span>}
      {total > 0 && (packed === total
        ? <span className="chip chip-good"><Icon name="check" size={13} /> Bag packed</span>
        : <span className="chip chip-warn">{packed} of {total} packed</span>)}
    </div>
  )
}
