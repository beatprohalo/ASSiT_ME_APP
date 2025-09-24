// database.js
const Database = require('better-sqlite3');
const path = require('path');

// Create or open a database file in project folder
const db = new Database(path.join(__dirname, 'music_assistant.db'));

// Create tables if not exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    filepath TEXT,
    genre TEXT,
    mood TEXT,
    bpm INTEGER,
    key TEXT,
    notes TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id INTEGER UNIQUE,
    mixed INTEGER DEFAULT 0,
    mastered INTEGER DEFAULT 0,
    tagged INTEGER DEFAULT 0,
    registered INTEGER DEFAULT 0,
    FOREIGN KEY (track_id) REFERENCES tracks(id)
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS midi_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS plugins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    path TEXT,
    type TEXT, -- VST2, VST3, AU
    notes TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS samples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    path TEXT,
    tags TEXT,
    notes TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    date TEXT,
    type TEXT -- release, sync, task, reminder
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    category TEXT,
    tags TEXT
  )
`).run();

module.exports = db;
