const fs = require('fs').promises;
const path = require('path');
const { parseFile } = require('music-metadata');
const MidiParser = require('midi-parser-js');

class FileScanner {
  constructor(database) {
    this.database = database;
    this.supportedExtensions = ['.wav', '.mp3', '.aiff', '.aif', '.flac', '.m4a', '.mid', '.midi'];
    this.projectExtensions = ['.als', '.alp', '.logic', '.cpr', '.rpp', '.ptx', '.ptf'];
  }

  async scanFolder(folderPath) {
    console.log(`Scanning folder: ${folderPath}`);
    const results = {
      tracks: [],
      projects: [],
      errors: []
    };

    try {
      await this.scanDirectory(folderPath, results);
      console.log(`Scan complete. Found ${results.tracks.length} tracks and ${results.projects.length} projects`);
    } catch (error) {
      console.error('Error scanning folder:', error);
      results.errors.push(error.message);
    }

    return results;
  }

  async scanDirectory(dirPath, results) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          // Skip hidden directories and common non-music folders
          if (!entry.name.startsWith('.') && 
              !['node_modules', 'System Volume Information', '$RECYCLE.BIN'].includes(entry.name)) {
            await this.scanDirectory(fullPath, results);
          }
        } else if (entry.isFile()) {
          await this.processFile(fullPath, results);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
      results.errors.push(`Error reading directory ${dirPath}: ${error.message}`);
    }
  }

  async processFile(filePath, results) {
    const ext = path.extname(filePath).toLowerCase();
    
    if (this.supportedExtensions.includes(ext)) {
      try {
        const trackData = await this.analyzeAudioFile(filePath);
        if (trackData) {
          results.tracks.push(trackData);
          // Store in database
          await this.database.insertTrack(trackData);
        }
      } catch (error) {
        console.error(`Error analyzing audio file ${filePath}:`, error);
        results.errors.push(`Error analyzing ${filePath}: ${error.message}`);
      }
    } else if (this.projectExtensions.includes(ext)) {
      try {
        const projectData = await this.analyzeProjectFile(filePath);
        if (projectData) {
          results.projects.push(projectData);
        }
      } catch (error) {
        console.error(`Error analyzing project file ${filePath}:`, error);
        results.errors.push(`Error analyzing ${filePath}: ${error.message}`);
      }
    }
  }

  async analyzeAudioFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const metadata = await parseFile(filePath);
      
      const trackData = {
        filePath: filePath,
        fileName: path.basename(filePath),
        fileSize: stats.size,
        duration: metadata.format.duration || null,
        bitrate: metadata.format.bitrate || null,
        sampleRate: metadata.format.sampleRate || null,
        channels: metadata.format.numberOfChannels || null,
        format: metadata.format.container || path.extname(filePath).substring(1),
        title: metadata.common.title || null,
        artist: metadata.common.artist || null,
        album: metadata.common.album || null,
        genre: metadata.common.genre ? metadata.common.genre[0] : null,
        year: metadata.common.year || null,
        tempo: this.extractTempo(metadata),
        keySignature: this.extractKeySignature(metadata),
        mood: null, // Will be analyzed later with AI
        energyLevel: null, // Will be analyzed later with AI
        danceability: null, // Will be analyzed later with AI
        valence: null // Will be analyzed later with AI
      };

      return trackData;
    } catch (error) {
      console.error(`Error analyzing audio file ${filePath}:`, error);
      return null;
    }
  }

  async analyzeProjectFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      
      return {
        filePath: filePath,
        fileName: path.basename(filePath),
        fileSize: stats.size,
        type: this.getProjectType(path.extname(filePath)),
        lastModified: stats.mtime
      };
    } catch (error) {
      console.error(`Error analyzing project file ${filePath}:`, error);
      return null;
    }
  }

  getProjectType(extension) {
    const projectTypes = {
      '.als': 'Ableton Live',
      '.alp': 'Ableton Live Pack',
      '.logic': 'Logic Pro',
      '.cpr': 'Cubase',
      '.rpp': 'REAPER',
      '.ptx': 'Pro Tools',
      '.ptf': 'Pro Tools'
    };
    return projectTypes[extension] || 'Unknown';
  }

  extractTempo(metadata) {
    // Try to get tempo from various metadata sources
    if (metadata.common.bpm) {
      return parseFloat(metadata.common.bpm);
    }
    
    // Check for tempo in technical info
    if (metadata.format.tempo) {
      return parseFloat(metadata.format.tempo);
    }
    
    return null;
  }

  extractKeySignature(metadata) {
    // Try to get key signature from metadata
    if (metadata.common.key) {
      return metadata.common.key;
    }
    
    return null;
  }

  // MIDI file analysis
  async analyzeMidiFile(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      const midiData = MidiParser.parse(buffer);
      
      return {
        tracks: midiData.track.length,
        timeDivision: midiData.timeDivision,
        format: midiData.format,
        tempo: this.extractMidiTempo(midiData)
      };
    } catch (error) {
      console.error(`Error analyzing MIDI file ${filePath}:`, error);
      return null;
    }
  }

  extractMidiTempo(midiData) {
    // Look for tempo events in the MIDI data
    for (const track of midiData.track) {
      for (const event of track.event) {
        if (event.type === 255 && event.metaType === 81) { // Set Tempo
          return 60000000 / event.data; // Convert to BPM
        }
      }
    }
    return null;
  }

  // Get file statistics
  async getFolderStats(folderPath) {
    const stats = {
      totalFiles: 0,
      audioFiles: 0,
      projectFiles: 0,
      totalSize: 0,
      audioSize: 0,
      projectSize: 0,
      formats: {}
    };

    try {
      await this.scanDirectoryForStats(folderPath, stats);
    } catch (error) {
      console.error('Error getting folder stats:', error);
    }

    return stats;
  }

  async scanDirectoryForStats(dirPath, stats) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && 
              !['node_modules', 'System Volume Information', '$RECYCLE.BIN'].includes(entry.name)) {
            await this.scanDirectoryForStats(fullPath, stats);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          const fileStats = await fs.stat(fullPath);
          
          stats.totalFiles++;
          stats.totalSize += fileStats.size;
          
          if (this.supportedExtensions.includes(ext)) {
            stats.audioFiles++;
            stats.audioSize += fileStats.size;
            stats.formats[ext] = (stats.formats[ext] || 0) + 1;
          } else if (this.projectExtensions.includes(ext)) {
            stats.projectFiles++;
            stats.projectSize += fileStats.size;
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
    }
  }
}

module.exports = { FileScanner };
