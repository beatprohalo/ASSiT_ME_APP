const Database = require('./database');

class ScanHistory {
  constructor() {
    this.database = new Database();
    this.initTables();
  }

  initTables() {
    // Create scan history table
    this.database.db.exec(`
      CREATE TABLE IF NOT EXISTS scan_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scan_date TEXT NOT NULL,
        scan_location TEXT NOT NULL,
        total_files INTEGER NOT NULL,
        audio_files INTEGER NOT NULL,
        midi_files INTEGER NOT NULL,
        project_files INTEGER NOT NULL,
        scan_duration INTEGER NOT NULL,
        memory_peak INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create scan locations table for quick access
    this.database.db.exec(`
      CREATE TABLE IF NOT EXISTS scan_locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location_path TEXT UNIQUE NOT NULL,
        last_scanned DATETIME,
        total_scans INTEGER DEFAULT 0,
        favorite BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async saveScanHistory(scanData) {
    try {
      const stmt = this.database.db.prepare(`
        INSERT INTO scan_history (
          scan_date, scan_location, total_files, audio_files, 
          midi_files, project_files, scan_duration, memory_peak, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        scanData.scanDate,
        scanData.scanLocation,
        scanData.totalFiles,
        scanData.audioFiles,
        scanData.midiFiles,
        scanData.projectFiles,
        scanData.scanDuration,
        scanData.memoryPeak,
        scanData.status
      );

      // Update scan location
      await this.updateScanLocation(scanData.scanLocation);
      
      console.log('✅ Scan history saved successfully');
    } catch (error) {
      console.error('❌ Error saving scan history:', error);
    }
  }

  async updateScanLocation(locationPath) {
    try {
      const stmt = this.database.db.prepare(`
        INSERT OR REPLACE INTO scan_locations (location_path, last_scanned, total_scans)
        VALUES (?, datetime('now'), COALESCE((SELECT total_scans + 1 FROM scan_locations WHERE location_path = ?), 1))
      `);
      
      stmt.run(locationPath, locationPath);
    } catch (error) {
      console.error('❌ Error updating scan location:', error);
    }
  }

  async getScanHistory(limit = 10) {
    try {
      const stmt = this.database.db.prepare(`
        SELECT * FROM scan_history 
        ORDER BY created_at DESC 
        LIMIT ?
      `);
      
      return stmt.all(limit);
    } catch (error) {
      console.error('❌ Error getting scan history:', error);
      return [];
    }
  }

  async getRecentLocations(limit = 5) {
    try {
      const stmt = this.database.db.prepare(`
        SELECT * FROM scan_locations 
        ORDER BY last_scanned DESC 
        LIMIT ?
      `);
      
      return stmt.all(limit);
    } catch (error) {
      console.error('❌ Error getting recent locations:', error);
      return [];
    }
  }

  async getFavoriteLocations() {
    try {
      const stmt = this.database.db.prepare(`
        SELECT * FROM scan_locations 
        WHERE favorite = 1 
        ORDER BY last_scanned DESC
      `);
      
      return stmt.all();
    } catch (error) {
      console.error('❌ Error getting favorite locations:', error);
      return [];
    }
  }

  async toggleFavorite(locationPath) {
    try {
      const stmt = this.database.db.prepare(`
        UPDATE scan_locations 
        SET favorite = NOT favorite 
        WHERE location_path = ?
      `);
      
      stmt.run(locationPath);
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
    }
  }

  async getScanStats() {
    try {
      const stmt = this.database.db.prepare(`
        SELECT 
          COUNT(*) as total_scans,
          SUM(total_files) as total_files_scanned,
          AVG(scan_duration) as avg_scan_duration,
          MAX(memory_peak) as peak_memory_usage
        FROM scan_history
      `);
      
      return stmt.get();
    } catch (error) {
      console.error('❌ Error getting scan stats:', error);
      return null;
    }
  }
}

module.exports = ScanHistory;
