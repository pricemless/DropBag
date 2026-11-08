// "2027-08-21" -> "Aug 21, 2027". Leaves free-form text (e.g. "August 2027") alone.
export function formatDate(value, opts = { month: 'short', day: 'numeric', year: 'numeric' }) {
  const d = parseDate(value)
  return d ? d.toLocaleDateString(undefined, opts) : value
}

function parseDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// "287 days to go", "Tomorrow", "Race day!", "Done" — or null without a date.
export function countdown(value) {
  const d = parseDate(value)
  if (!d) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((d - today) / 86400000)
  if (days > 1) return `${days} days to go`
  if (days === 1) return 'Tomorrow'
  if (days === 0) return 'Race day!'
  return 'Finished'
}

export function crewUrl(token) {
  return `${window.location.origin}/crew/${token}`
}

export function pct(part, whole) {
  return whole ? Math.round((part / whole) * 100) : 0
}
