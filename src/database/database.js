const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class MusicDatabase {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, '../../data/music.db');
  }

  async initialize() {
    // Ensure data directory exists
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    try {
      this.db = new Database(this.dbPath);
      await this.createTables();
      return true;
    } catch (err) {
      throw err;
    }
  }

  async createTables() {
    const tables = [
      // Tracks table
      `CREATE TABLE IF NOT EXISTS tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT UNIQUE NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER,
        duration REAL,
        bitrate INTEGER,
        sample_rate INTEGER,
        channels INTEGER,
        format TEXT,
        title TEXT,
        artist TEXT,
        album TEXT,
        genre TEXT,
        year INTEGER,
        tempo REAL,
        key_signature TEXT,
        mood TEXT,
        energy_level REAL,
        danceability REAL,
        valence REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tags table
      `CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT '#3B82F6',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Track tags junction table
      `CREATE TABLE IF NOT EXISTS track_tags (
        track_id INTEGER,
        tag_id INTEGER,
        PRIMARY KEY (track_id, tag_id),
        FOREIGN KEY (track_id) REFERENCES tracks (id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
      )`,

      // Tasks table
      `CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT FALSE,
        priority INTEGER DEFAULT 1,
        due_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (track_id) REFERENCES tracks (id) ON DELETE CASCADE
      )`,

      // Reminders table
      `CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        message TEXT,
        type TEXT DEFAULT 'general',
        scheduled_for DATETIME NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Creative sessions table
      `CREATE TABLE IF NOT EXISTS creative_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt TEXT,
        generated_content TEXT,
        session_type TEXT DEFAULT 'idea_generation',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Settings table
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await this.run(table);
    }

    // Insert default tags
    await this.insertDefaultTags();
  }

  async insertDefaultTags() {
    const defaultTags = [
      { name: 'Work in Progress', color: '#F59E0B' },
      { name: 'Mixed', color: '#10B981' },
      { name: 'Mastered', color: '#8B5CF6' },
      { name: 'Released', color: '#EF4444' },
      { name: 'Demo', color: '#6B7280' },
      { name: 'Final', color: '#059669' },
      { name: 'Needs Review', color: '#F97316' },
      { name: 'Licensed', color: '#3B82F6' }
    ];

    for (const tag of defaultTags) {
      await this.run(
        'INSERT OR IGNORE INTO tags (name, color) VALUES (?, ?)',
        [tag.name, tag.color]
      );
    }
  }

  run(sql, params = []) {
    try {
      const result = this.db.prepare(sql).run(params);
      return { id: result.lastInsertRowid, changes: result.changes };
    } catch (err) {
      throw err;
    }
  }

  get(sql, params = []) {
    try {
      return this.db.prepare(sql).get(params);
    } catch (err) {
      throw err;
    }
  }

  all(sql, params = []) {
    try {
      return this.db.prepare(sql).all(params);
    } catch (err) {
      throw err;
    }
  }

  // Track operations
  async insertTrack(trackData) {
    const sql = `
      INSERT INTO tracks (
        file_path, file_name, file_size, duration, bitrate, sample_rate,
        channels, format, title, artist, album, genre, year, tempo,
        key_signature, mood, energy_level, danceability, valence
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      trackData.filePath, trackData.fileName, trackData.fileSize,
      trackData.duration, trackData.bitrate, trackData.sampleRate,
      trackData.channels, trackData.format, trackData.title,
      trackData.artist, trackData.album, trackData.genre, trackData.year,
      trackData.tempo, trackData.keySignature, trackData.mood,
      trackData.energyLevel, trackData.danceability, trackData.valence
    ];

    return await this.run(sql, params);
  }

  async getAllTracks() {
    const sql = `
      SELECT t.*, 
             GROUP_CONCAT(tg.name) as tags,
             GROUP_CONCAT(tg.color) as tag_colors
      FROM tracks t
      LEFT JOIN track_tags tt ON t.id = tt.track_id
      LEFT JOIN tags tg ON tt.tag_id = tg.id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `;
    return await this.all(sql);
  }

  async getTrack(id) {
    const sql = `
      SELECT t.*, 
             GROUP_CONCAT(tg.name) as tags,
             GROUP_CONCAT(tg.color) as tag_colors
      FROM tracks t
      LEFT JOIN track_tags tt ON t.id = tt.track_id
      LEFT JOIN tags tg ON tt.tag_id = tg.id
      WHERE t.id = ?
      GROUP BY t.id
    `;
    return await this.get(sql, [id]);
  }

  async updateTrack(id, data) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    values.push(id);
    
    const sql = `UPDATE tracks SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    return await this.run(sql, values);
  }

  // Tag operations
  async getAllTags() {
    return await this.all('SELECT * FROM tags ORDER BY name');
  }

  async addTag(name, color = '#3B82F6') {
    return await this.run('INSERT INTO tags (name, color) VALUES (?, ?)', [name, color]);
  }

  async addTrackTag(trackId, tagId) {
    return await this.run('INSERT OR IGNORE INTO track_tags (track_id, tag_id) VALUES (?, ?)', [trackId, tagId]);
  }

  async removeTrackTag(trackId, tagId) {
    return await this.run('DELETE FROM track_tags WHERE track_id = ? AND tag_id = ?', [trackId, tagId]);
  }

  // Task operations
  async getTasks(trackId) {
    return await this.all('SELECT * FROM tasks WHERE track_id = ? ORDER BY priority DESC, created_at', [trackId]);
  }

  async addTask(trackId, title, description = '', priority = 1, dueDate = null) {
    return await this.run(
      'INSERT INTO tasks (track_id, title, description, priority, due_date) VALUES (?, ?, ?, ?, ?)',
      [trackId, title, description, priority, dueDate]
    );
  }

  async updateTask(taskId, completed) {
    return await this.run(
      'UPDATE tasks SET completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [completed, taskId]
    );
  }

  // Settings operations
  async getSetting(key, defaultValue = null) {
    const result = await this.get('SELECT value FROM settings WHERE key = ?', [key]);
    return result ? result.value : defaultValue;
  }

  async setSetting(key, value) {
    return await this.run(
      'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [key, value]
    );
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = { Database: MusicDatabase };
