// Creates a demo account with sample races, aid stations, drop bags and pacer listings.
// Usage: npm run seed   (log in as demo@dropbag.app / dropbag-demo)
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const db = require('../database/db')

const EMAIL = 'demo@dropbag.app'
const PASSWORD = 'dropbag-demo'

const races = [
  {
    name: 'Leadville 100', distance: 100, race_date: '2027-08-21', location: 'Leadville, CO',
    stations: [
      ['Fish Hatchery', 23, '10:30 AM', 'Bring extra socks and headlamp', ['Dry socks', 'Headlamp + spare batteries', 'Gels x6']],
      ['Halfmoon', 50, '2:00 PM', 'Poles and night gear', ['Trekking poles', 'Warm jacket', 'Gloves']],
      ['Winfield', 60, '4:00 PM', 'Pacer joins here, hot food', ['Broth', 'Fresh shirt', 'Lube']],
    ],
  },
  {
    name: 'Moab 240', distance: 238, race_date: '2027-10-08', location: 'Moab, UT',
    stations: [
      ['Shrimp Rock', 25, 'Day 1 - 6:00 PM', 'First crew access, check feet and headlamp', ['Foot care kit', 'Headlamp']],
      ['Beef Basin', 75, 'Day 2 - 2:00 PM', 'Remote access, bring extra food and warm layers', ['Puffy jacket', 'Real food']],
      ['Bridger Jack', 130, 'Day 3 - 8:00 AM', 'Halfway point, sleep gear swap', ['Sleeping bag liner', 'Earplugs']],
    ],
  },
  {
    name: 'Black Canyon 100K', distance: 62, race_date: '2027-02-13', location: 'Black Canyon City, AZ',
    stations: [
      ['Bumble Bee', 18, '10:00 AM', 'First crew access, sunscreen and salt tabs', ['Sunscreen', 'Salt tabs']],
      ['Black Canyon City', 35, '1:00 PM', 'Main crew hub, drop bags here, change shoes', ['Second pair of shoes', 'Ice bandana']],
      ['Gloriana Mine', 48, '3:30 PM', 'Last crew access before finish, cold weather gear if needed', ['Arm sleeves', 'Caffeine gels']],
    ],
  },
]

const seed = db.transaction(() => {
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(EMAIL)
  if (user) {
    db.prepare('DELETE FROM users WHERE id = ?').run(user.id) // cascades to races, stations, items, pacers
  }
  const { lastInsertRowid: userId } = db
    .prepare("INSERT INTO users (email, password_hash, name, plan) VALUES (?, ?, ?, 'pro')")
    .run(EMAIL, bcrypt.hashSync(PASSWORD, 12), 'Demo Runner')

  for (const r of races) {
    const { lastInsertRowid: raceId } = db.prepare(`
      INSERT INTO races (user_id, name, distance, race_date, location, share_token) VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, r.name, r.distance, r.race_date, r.location, crypto.randomBytes(12).toString('base64url'))
    for (const [name, distance, cutoff, notes, items] of r.stations) {
      const { lastInsertRowid: stationId } = db.prepare(`
        INSERT INTO stations (race_id, name, distance, cutoff_time, crew_notes) VALUES (?, ?, ?, ?, ?)
      `).run(raceId, name, distance, cutoff, notes)
      for (const label of items) db.prepare('INSERT INTO bag_items (station_id, label) VALUES (?, ?)').run(stationId, label)
    }
  }

  const pacer = db.prepare(`
    INSERT INTO pacers (user_id, type, race_name, race_date, miles_start, miles_end, experience, contact, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  pacer.run(userId, 'needed', 'Leadville 100', 'August 2027', 50, 100, 'First 100 miler, need experienced pacer', 'runner@example.com', 'Looking for someone who knows the course')
  pacer.run(userId, 'available', 'Leadville 100', 'August 2027', 60, 100, 'Ran Leadville twice, finished both', 'pacer@example.com', 'Know the course well, happy to help first timers')
})

seed()
console.log(`Seeded demo account: ${EMAIL} / ${PASSWORD}`)
