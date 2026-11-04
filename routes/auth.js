const express = require('express')
const bcrypt = require('bcryptjs')
const rateLimit = require('express-rate-limit')
const db = require('../database/db')
const config = require('../config')
const { setSession, clearSession } = require('../middleware/auth')
const { text, ValidationError } = require('../middleware/validate')

const router = express.Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in a few minutes.' },
  skip: () => process.env.NODE_ENV === 'test',
})

function publicUser(user) {
  const raceCount = db.prepare('SELECT COUNT(*) AS n FROM races WHERE user_id = ?').get(user.id).n
  const limit = config.planLimits[user.plan]?.races ?? 0
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    usage: { races: raceCount, raceLimit: Number.isFinite(limit) ? limit : null },
  }
}

router.post('/signup', authLimiter, async (req, res) => {
  const name = text(req.body.name, 'Name', { required: true, max: 80 })
  const email = text(req.body.email, 'Email', { required: true, max: 200 })?.toLowerCase()
  const password = String(req.body.password || '')

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError('Enter a valid email')
  if (password.length < 8) throw new ValidationError('Password must be at least 8 characters')
  if (password.length > 200) throw new ValidationError('Password is too long')

  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    return res.status(409).json({ error: 'An account with that email already exists' })
  }

  const hash = await bcrypt.hash(password, 12)
  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)')
    .run(email, hash, name)

  setSession(res, lastInsertRowid)
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(lastInsertRowid)
  res.status(201).json({ user: publicUser(user) })
})

router.post('/login', authLimiter, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  const password = String(req.body.password || '')
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Wrong email or password' })
  }

  setSession(res, user.id)
  res.json({ user: publicUser(user) })
})

router.post('/logout', (req, res) => {
  clearSession(res)
  res.json({ ok: true })
})

// Returns { user: null } when logged out so the app can check without an error.
router.get('/me', (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null })
})

module.exports = router
