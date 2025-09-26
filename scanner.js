// scanner.js
const fs = require('fs');
const path = require('path');

const validExtensions = ['.wav', '.mp3', '.aiff', '.flac'];

function isAudioFile(filePath) {
  return validExtensions.includes(path.extname(filePath).toLowerCase());
}

function scanFolderRecursively(dir, results = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      scanFolderRecursively(fullPath, results);
    } else if (isAudioFile(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

module.exports = { scanFolderRecursively };
