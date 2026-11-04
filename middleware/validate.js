// Small input helpers. Each returns a cleaned value or throws a 400-style error.

class ValidationError extends Error {}

function text(value, field, { required = false, max = 500 } = {}) {
  if (value === undefined || value === null || String(value).trim() === '') {
    if (required) throw new ValidationError(`${field} is required`)
    return null
  }
  const s = String(value).trim()
  if (s.length > max) throw new ValidationError(`${field} must be ${max} characters or fewer`)
  return s
}

function number(value, field, { required = false, min = 0, max = 10000 } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new ValidationError(`${field} is required`)
    return null
  }
  const n = Number(value)
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new ValidationError(`${field} must be a number between ${min} and ${max}`)
  }
  return n
}

// Express error handler for ValidationError and unexpected errors.
function errorHandler(err, req, res, next) {
  if (err instanceof ValidationError) return res.status(400).json({ error: err.message })
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' })
  console.error(err)
  res.status(500).json({ error: 'Something went wrong' })
}

module.exports = { ValidationError, text, number, errorHandler }
