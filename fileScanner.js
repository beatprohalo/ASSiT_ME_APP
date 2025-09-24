// fileScanner.js
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const db = require('./database.js');

// Supported audio formats
const SUPPORTED_EXT = ['.wav', '.mp3', '.aiff', '.mid'];

function scanFolder(folderPath) {
  console.log(`🔍 Scanning folder: ${folderPath}`);

  const watcher = chokidar.watch(folderPath, {
    persistent: true,
    ignored: /(^|[\/\\])\../, // ignore hidden files
    depth: 5
  });

  watcher.on('add', filePath => {
    const ext = path.extname(filePath).toLowerCase();
    if (SUPPORTED_EXT.includes(ext)) {
      const filename = path.basename(filePath);

      // Check if track already exists
      const exists = db.prepare("SELECT * FROM tracks WHERE filepath = ?").get(filePath);
      if (!exists) {
        db.prepare(`
          INSERT INTO tracks (filename, filepath)
          VALUES (?, ?)
        `).run(filename, filePath);

        console.log(`🎵 Added: ${filename}`);
      }
    }
  });
}

module.exports = { scanFolder };
