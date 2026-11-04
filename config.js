const crypto = require('crypto')

const isProduction = process.env.NODE_ENV === 'production'

let jwtSecret = process.env.JWT_SECRET
if (!jwtSecret) {
  if (isProduction) {
    throw new Error('JWT_SECRET must be set in production')
  }
  // Dev only: sessions reset whenever the server restarts.
  jwtSecret = crypto.randomBytes(32).toString('hex')
}

module.exports = {
  isProduction,
  port: Number(process.env.PORT) || 3000,
  jwtSecret,
  sessionDays: 30,
  // Races a user may own on each plan. Infinity = unlimited.
  planLimits: {
    free: { races: Number(process.env.FREE_RACE_LIMIT) || 2 },
    pro: { races: Infinity },
  },
}
