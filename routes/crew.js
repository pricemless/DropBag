const express = require('express')
const db = require('../database/db')
const { racePlan } = require('./races')

const router = express.Router()

// Public, read-only race plan for crew members who hold the share link.
router.get('/:token', (req, res) => {
  const race = db.prepare('SELECT * FROM races WHERE share_token = ?').get(req.params.token)
  if (!race) return res.status(404).json({ error: 'This crew link is invalid or has been reset' })

  const { stations } = racePlan(race)
  const owner = db.prepare('SELECT name FROM users WHERE id = ?').get(race.user_id)
  res.json({
    race: {
      name: race.name,
      distance: race.distance,
      race_date: race.race_date,
      location: race.location,
      runner: owner?.name ?? null,
    },
    stations: stations.map(({ race_id, created_at, ...s }) => s),
  })
})

module.exports = router
