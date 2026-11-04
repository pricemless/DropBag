const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'dropbag.db')
if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true })

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS races (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    distance REAL NOT NULL,
    race_date TEXT,
    location TEXT,
    share_token TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_races_user ON races(user_id);

  CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    distance REAL NOT NULL,
    cutoff_time TEXT,
    crew_notes TEXT,
    crew_access INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_stations_race ON stations(race_id);

  CREATE TABLE IF NOT EXISTS bag_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    packed INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_bag_items_station ON bag_items(station_id);

  CREATE TABLE IF NOT EXISTS pacers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('needed', 'available')),
    race_name TEXT NOT NULL,
    race_date TEXT,
    miles_start REAL,
    miles_end REAL,
    experience TEXT,
    contact TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

module.exports = db
