const fs = require('fs').promises;
const path = require('path');

class ScanHistory {
  constructor() {
    this.historyFile = path.join(__dirname, '../data/scanHistory.json');
    this.maxHistoryEntries = 50;
  }

  async loadHistory() {
    try {
      const data = await fs.readFile(this.historyFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // Return default structure if file doesn't exist
      return {
        recentScans: [],
        favoriteLocations: [],
        scanStats: {
          totalScans: 0,
          totalFilesFound: 0,
          lastScanDate: null
        }
      };
    }
  }

  async saveHistory(history) {
    try {
      await fs.mkdir(path.dirname(this.historyFile), { recursive: true });
      await fs.writeFile(this.historyFile, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error('Error saving scan history:', error);
    }
  }

  async addScanRecord(scanData) {
    const history = await this.loadHistory();
    
    const scanRecord = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      location: scanData.location,
      fileCount: scanData.fileCount,
      audioFiles: scanData.audioFiles || 0,
      midiFiles: scanData.midiFiles || 0,
      projectFiles: scanData.projectFiles || 0,
      duration: scanData.duration || 0,
      errors: scanData.errors || []
    };

    // Add to recent scans
    history.recentScans.unshift(scanRecord);
    
    // Keep only the most recent entries
    if (history.recentScans.length > this.maxHistoryEntries) {
      history.recentScans = history.recentScans.slice(0, this.maxHistoryEntries);
    }

    // Update scan stats
    history.scanStats.totalScans++;
    history.scanStats.totalFilesFound += scanData.fileCount;
    history.scanStats.lastScanDate = scanRecord.timestamp;

    // Add to favorite locations if it's a new location
    const existingLocation = history.favoriteLocations.find(loc => loc.path === scanData.location);
    if (existingLocation) {
      existingLocation.scanCount++;
      existingLocation.lastScanned = scanRecord.timestamp;
    } else {
      history.favoriteLocations.push({
        path: scanData.location,
        name: path.basename(scanData.location),
        scanCount: 1,
        firstScanned: scanRecord.timestamp,
        lastScanned: scanRecord.timestamp
      });
    }

    await this.saveHistory(history);
    return scanRecord;
  }

  async getRecentScans(limit = 10) {
    const history = await this.loadHistory();
    return history.recentScans.slice(0, limit);
  }

  async getFavoriteLocations() {
    const history = await this.loadHistory();
    return history.favoriteLocations.sort((a, b) => b.scanCount - a.scanCount);
  }

  async getScanStats() {
    const history = await this.loadHistory();
    return history.scanStats;
  }

  async clearHistory() {
    const emptyHistory = {
      recentScans: [],
      favoriteLocations: [],
      scanStats: {
        totalScans: 0,
        totalFilesFound: 0,
        lastScanDate: null
      }
    };
    await this.saveHistory(emptyHistory);
  }
}

module.exports = ScanHistory;
