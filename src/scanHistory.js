const fs = require('fs').promises;
const path = require('path');

class ScanHistory {
  constructor() {
    this.historyFile = path.join(__dirname, '..', 'data', 'scan-history.json');
    this.history = [];
    this.loadHistory();
  }

  async loadHistory() {
    try {
      const data = await fs.readFile(this.historyFile, 'utf8');
      this.history = JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is corrupted, start with empty history
      this.history = [];
    }
  }

  async saveHistory() {
    try {
      await fs.mkdir(path.dirname(this.historyFile), { recursive: true });
      await fs.writeFile(this.historyFile, JSON.stringify(this.history, null, 2));
    } catch (error) {
      console.error('Error saving scan history:', error);
    }
  }

  addScan(scanData) {
    const scanEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      location: scanData.location,
      totalFiles: scanData.totalFiles,
      audioFiles: scanData.audioFiles,
      midiFiles: scanData.midiFiles,
      projectFiles: scanData.projectFiles,
      errors: scanData.errors || [],
      duration: scanData.duration || 0
    };

    this.history.unshift(scanEntry);
    
    // Keep only last 50 scans
    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50);
    }

    this.saveHistory();
    return scanEntry;
  }

  getHistory() {
    return this.history;
  }

  getRecentScans(limit = 10) {
    return this.history.slice(0, limit);
  }

  getScanById(id) {
    return this.history.find(scan => scan.id === id);
  }

  clearHistory() {
    this.history = [];
    this.saveHistory();
  }

  getLastScanLocation() {
    if (this.history.length > 0) {
      return this.history[0].location;
    }
    return null;
  }

  getScanStats() {
    if (this.history.length === 0) {
      return {
        totalScans: 0,
        totalFiles: 0,
        averageFilesPerScan: 0,
        mostScannedLocation: null
      };
    }

    const totalFiles = this.history.reduce((sum, scan) => sum + scan.totalFiles, 0);
    const locationCounts = {};
    
    this.history.forEach(scan => {
      locationCounts[scan.location] = (locationCounts[scan.location] || 0) + 1;
    });

    const mostScannedLocation = Object.keys(locationCounts).reduce((a, b) => 
      locationCounts[a] > locationCounts[b] ? a : b
    );

    return {
      totalScans: this.history.length,
      totalFiles,
      averageFilesPerScan: Math.round(totalFiles / this.history.length),
      mostScannedLocation
    };
  }
}

module.exports = ScanHistory;
