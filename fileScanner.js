// fileScanner.js
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const db = require('./database.js');

// Supported audio formats
const SUPPORTED_EXT = ['.wav', '.mp3', '.aiff', '.mid'];

function scanFolder(folderPath, webContents) {
  console.log(`🔍 Scanning folder: ${folderPath}`);
  let foundFiles = 0;

  const watcher = chokidar.watch(folderPath, {
    persistent: false, // Changed to false to scan and then stop
    ignored: /(^|[\/\\])\../, // ignore hidden files
    depth: 5, // Scan up to 5 subdirectories deep
    ignoreInitial: false,
  });

  watcher
    .on('add', filePath => {
      const ext = path.extname(filePath).toLowerCase();
      if (SUPPORTED_EXT.includes(ext)) {
        foundFiles++;
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
    })
    .on('ready', () => {
      console.log('✅ Scan complete.');
      // Send completion message to renderer process
      webContents.send('scan-complete', foundFiles);
    })
    .on('error', error => {
      console.error(`❌ Scan error: ${error}`);
      // Send error message to renderer process
      webContents.send('scan-error', error.message);
    });
}

module.exports = { scanFolder };
