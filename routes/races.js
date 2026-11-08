const express = require('express')
const crypto = require('crypto')
const db = require('../database/db')
const config = require('../config')
const { requireAuth } = require('../middleware/auth')
const { text, number } = require('../middleware/validate')

const router = express.Router()
router.use(requireAuth)

const newShareToken = () => crypto.randomBytes(12).toString('base64url')

// ---- helpers that enforce ownership -------------------------------------

function ownedRace(req, res) {
  const race = db.prepare('SELECT * FROM races WHERE id = ? AND user_id = ?').get(req.params.raceId, req.user.id)
  if (!race) res.status(404).json({ error: 'Race not found' })
  return race
}

function ownedStation(req, res) {
  const station = db.prepare(`
    SELECT s.* FROM stations s JOIN races r ON r.id = s.race_id
    WHERE s.id = ? AND r.user_id = ?
  `).get(req.params.stationId, req.user.id)
  if (!station) res.status(404).json({ error: 'Station not found' })
  return station
}

function ownedItem(req, res) {
  const item = db.prepare(`
    SELECT i.* FROM bag_items i
    JOIN stations s ON s.id = i.station_id
    JOIN races r ON r.id = s.race_id
    WHERE i.id = ? AND r.user_id = ?
  `).get(req.params.itemId, req.user.id)
  if (!item) res.status(404).json({ error: 'Item not found' })
  return item
}

function raceInput(body) {
  return {
    name: text(body.name, 'Race name', { required: true, max: 120 }),
    distance: number(body.distance, 'Distance', { required: true, min: 1, max: 1000 }),
    race_date: text(body.race_date, 'Race date', { max: 40 }),
    location: text(body.location, 'Location', { max: 120 }),
  }
}

function stationInput(body) {
  return {
    name: text(body.name, 'Station name', { required: true, max: 120 }),
    distance: number(body.distance, 'Mile', { required: true, min: 0, max: 1000 }),
    cutoff_time: text(body.cutoff_time, 'Cutoff', { max: 60 }),
    crew_notes: text(body.crew_notes, 'Crew notes', { max: 2000 }),
    crew_access: body.crew_access === false || body.crew_access === 0 ? 0 : 1,
  }
}

// Full race plan: race + stations (by mile) + each station's drop bag items.
function racePlan(race) {
  const stations = db.prepare('SELECT * FROM stations WHERE race_id = ? ORDER BY distance ASC, id ASC').all(race.id)
  const items = db.prepare(`
    SELECT i.* FROM bag_items i JOIN stations s ON s.id = i.station_id
    WHERE s.race_id = ? ORDER BY i.id ASC
  `).all(race.id)
  for (const s of stations) {
    s.crew_access = !!s.crew_access
    s.items = items.filter(i => i.station_id === s.id).map(i => ({ ...i, packed: !!i.packed }))
  }
  return { race, stations }
}

// ---- races ---------------------------------------------------------------

router.get('/', (req, res) => {
  const races = db.prepare(`
    SELECT r.*,
      (SELECT COUNT(*) FROM stations s WHERE s.race_id = r.id) AS station_count,
      (SELECT COUNT(*) FROM bag_items i JOIN stations s ON s.id = i.station_id WHERE s.race_id = r.id) AS item_count,
      (SELECT COUNT(*) FROM bag_items i JOIN stations s ON s.id = i.station_id WHERE s.race_id = r.id AND i.packed = 1) AS packed_count
    FROM races r
    WHERE r.user_id = ?
    ORDER BY COALESCE(r.race_date, '9999'), r.created_at DESC
  `).all(req.user.id)
  res.json(races)
})

router.post('/', (req, res) => {
  const input = raceInput(req.body)
  const limit = config.planLimits[req.user.plan]?.races ?? 0
  const count = db.prepare('SELECT COUNT(*) AS n FROM races WHERE user_id = ?').get(req.user.id).n
  if (count >= limit) {
    return res.status(402).json({
      error: `The ${req.user.plan} plan includes ${limit} races. Upgrade to Pro for unlimited races.`,
      code: 'PLAN_LIMIT',
    })
  }

  const { lastInsertRowid } = db.prepare(`
    INSERT INTO races (user_id, name, distance, race_date, location, share_token)
    VALUES (@user_id, @name, @distance, @race_date, @location, @share_token)
  `).run({ ...input, user_id: req.user.id, share_token: newShareToken() })

  res.status(201).json(db.prepare('SELECT * FROM races WHERE id = ?').get(lastInsertRowid))
})

router.get('/:raceId', (req, res) => {
  const race = ownedRace(req, res)
  if (race) res.json(racePlan(race))
})

router.put('/:raceId', (req, res) => {
  const race = ownedRace(req, res)
  if (!race) return
  db.prepare(`
    UPDATE races SET name = @name, distance = @distance, race_date = @race_date, location = @location
    WHERE id = @id
  `).run({ ...raceInput(req.body), id: race.id })
  res.json(db.prepare('SELECT * FROM races WHERE id = ?').get(race.id))
})

router.delete('/:raceId', (req, res) => {
  const race = ownedRace(req, res)
  if (!race) return
  db.prepare('DELETE FROM races WHERE id = ?').run(race.id)
  res.json({ ok: true })
})

// Invalidate the old crew link and issue a new one.
router.post('/:raceId/share-token', (req, res) => {
  const race = ownedRace(req, res)
  if (!race) return
  const share_token = newShareToken()
  db.prepare('UPDATE races SET share_token = ? WHERE id = ?').run(share_token, race.id)
  res.json({ share_token })
})

// ---- stations ------------------------------------------------------------

router.post('/:raceId/stations', (req, res) => {
  const race = ownedRace(req, res)
  if (!race) return
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO stations (race_id, name, distance, cutoff_time, crew_notes, crew_access)
    VALUES (@race_id, @name, @distance, @cutoff_time, @crew_notes, @crew_access)
  `).run({ ...stationInput(req.body), race_id: race.id })
  res.status(201).json(db.prepare('SELECT * FROM stations WHERE id = ?').get(lastInsertRowid))
})

router.put('/stations/:stationId', (req, res) => {
  const station = ownedStation(req, res)
  if (!station) return
  db.prepare(`
    UPDATE stations SET name = @name, distance = @distance, cutoff_time = @cutoff_time,
      crew_notes = @crew_notes, crew_access = @crew_access
    WHERE id = @id
  `).run({ ...stationInput(req.body), id: station.id })
  res.json(db.prepare('SELECT * FROM stations WHERE id = ?').get(station.id))
})

router.delete('/stations/:stationId', (req, res) => {
  const station = ownedStation(req, res)
  if (!station) return
  db.prepare('DELETE FROM stations WHERE id = ?').run(station.id)
  res.json({ ok: true })
})

// ---- drop bag items ------------------------------------------------------

router.post('/stations/:stationId/items', (req, res) => {
  const station = ownedStation(req, res)
  if (!station) return
  const label = text(req.body.label, 'Item', { required: true, max: 120 })
  const { lastInsertRowid } = db
    .prepare('INSERT INTO bag_items (station_id, label) VALUES (?, ?)')
    .run(station.id, label)
  const item = db.prepare('SELECT * FROM bag_items WHERE id = ?').get(lastInsertRowid)
  res.status(201).json({ ...item, packed: !!item.packed })
})

router.patch('/items/:itemId', (req, res) => {
  const item = ownedItem(req, res)
  if (!item) return
  const label = req.body.label !== undefined ? text(req.body.label, 'Item', { required: true, max: 120 }) : item.label
  const packed = req.body.packed !== undefined ? (req.body.packed ? 1 : 0) : item.packed
  db.prepare('UPDATE bag_items SET label = ?, packed = ? WHERE id = ?').run(label, packed, item.id)
  res.json({ ...item, label, packed: !!packed })
})

router.delete('/items/:itemId', (req, res) => {
  const item = ownedItem(req, res)
  if (!item) return
  db.prepare('DELETE FROM bag_items WHERE id = ?').run(item.id)
  res.json({ ok: true })
})

module.exports = { router, racePlan }
