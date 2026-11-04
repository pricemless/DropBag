const jwt = require('jsonwebtoken')
const db = require('../database/db')
const config = require('../config')

const COOKIE = 'dropbag_session'

function setSession(res, userId) {
  const token = jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: `${config.sessionDays}d` })
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    maxAge: config.sessionDays * 24 * 60 * 60 * 1000,
  })
}

function clearSession(res) {
  res.clearCookie(COOKIE, { httpOnly: true, sameSite: 'lax', secure: config.isProduction })
}

// Attaches req.user when a valid session cookie is present. Never rejects.
function loadUser(req, res, next) {
  const token = req.cookies?.[COOKIE]
  if (token) {
    try {
      const { sub } = jwt.verify(token, config.jwtSecret)
      req.user = db.prepare('SELECT id, email, name, plan, created_at FROM users WHERE id = ?').get(sub)
    } catch {
      // invalid or expired token: treat as logged out
    }
  }
  next()
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please log in' })
  next()
}

module.exports = { setSession, clearSession, loadUser, requireAuth }
