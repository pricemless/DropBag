// "2027-08-21" -> "Aug 21, 2027". Leaves free-form text (e.g. "August 2027") alone.
export function formatDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function crewUrl(token) {
  return `${window.location.origin}/crew/${token}`
}
