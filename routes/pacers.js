const express = require('express')
const db = require('../database/db')
const { requireAuth } = require('../middleware/auth')
const { text, number, ValidationError } = require('../middleware/validate')

const router = express.Router()

const COLUMNS = 'id, user_id, type, race_name, race_date, miles_start, miles_end, experience, contact, notes, created_at'

function withOwnership(rows, user) {
  return rows.map(({ user_id, ...row }) => ({ ...row, mine: !!user && user.id === user_id }))
}

// Public: browse listings, optionally filtered by race name.
router.get('/', (req, res) => {
  const q = text(req.query.race, 'Race', { max: 120 })
  const rows = q
    ? db.prepare(`SELECT ${COLUMNS} FROM pacers WHERE race_name LIKE ? ORDER BY created_at DESC`).all(`%${q}%`)
    : db.prepare(`SELECT ${COLUMNS} FROM pacers ORDER BY created_at DESC LIMIT 200`).all()
  res.json(withOwnership(rows, req.user))
})

router.post('/', requireAuth, (req, res) => {
  const type = req.body.type
  if (type !== 'needed' && type !== 'available') throw new ValidationError('Type must be needed or available')

  const input = {
    user_id: req.user.id,
    type,
    race_name: text(req.body.race_name, 'Race name', { required: true, max: 120 }),
    race_date: text(req.body.race_date, 'Race date', { max: 40 }),
    miles_start: number(req.body.miles_start, 'Miles start', { max: 1000 }),
    miles_end: number(req.body.miles_end, 'Miles end', { max: 1000 }),
    experience: text(req.body.experience, 'Experience', { max: 500 }),
    contact: text(req.body.contact, 'Contact', { required: true, max: 200 }),
    notes: text(req.body.notes, 'Notes', { max: 1000 }),
  }

  const { lastInsertRowid } = db.prepare(`
    INSERT INTO pacers (user_id, type, race_name, race_date, miles_start, miles_end, experience, contact, notes)
    VALUES (@user_id, @type, @race_name, @race_date, @miles_start, @miles_end, @experience, @contact, @notes)
  `).run(input)

  const row = db.prepare(`SELECT ${COLUMNS} FROM pacers WHERE id = ?`).get(lastInsertRowid)
  res.status(201).json(withOwnership([row], req.user)[0])
})

// Only the person who posted a listing can remove it.
router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM pacers WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  if (result.changes === 0) return res.status(404).json({ error: 'Listing not found' })
  res.json({ ok: true })
})

module.exports = router
