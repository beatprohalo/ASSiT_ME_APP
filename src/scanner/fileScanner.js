const fs = require('fs').promises;
const path = require('path');
const { parseFile } = require('music-metadata');
const MidiParser = require('midi-parser-js');
const jsmediatags = require('jsmediatags');

class FileScanner {
  constructor(database, progressFeedback = null) {
    this.database = database;
    this.progressFeedback = progressFeedback;
    this.supportedExtensions = [
      // Audio formats
      '.wav', '.mp3', '.aiff', '.aif', '.flac', '.m4a', '.m4b', '.m4p', '.aac', '.ogg', '.wma', '.opus',
      // Additional audio formats
      '.wv', '.ape', '.tta', '.tak', '.ofr', '.ofs', '.off', '.rka', '.3ga', '.aa', '.aax', '.act', '.aiff', '.alac',
      '.amr', '.au', '.awb', '.dct', '.dss', '.dvf', '.flac', '.gsm', '.iklax', '.ivs', '.ivx', '.m4a', '.m4b', '.m4p',
      '.mmf', '.mp3', '.mpc', '.msv', '.nmf', '.ogg', '.oga', '.mogg', '.opus', '.ra', '.rm', '.raw', '.rf64', '.sln',
      '.tta', '.voc', '.vox', '.wav', '.wma', '.wv', '.webm', '.8svx', '.cda',
      // MIDI formats
      '.mid', '.midi', '.kar', '.rmi'
    ];
    this.projectExtensions = [
      // Ableton Live
      '.als', '.alp', '.adg', '.adv',
      // Logic Pro
      '.logic', '.logicx', '.exs', '.cst',
      // Pro Tools
      '.ptx', '.ptf', '.pts', '.ptt',
      // Cubase/Nuendo
      '.cpr', '.cpt', '.vstpreset',
      // Reaper
      '.rpp', '.rpp-bak',
      // Studio One
      '.song', '.trackpreset',
      // FL Studio
      '.flp', '.flm',
      // Reason
      '.reason', '.rns',
      // Bitwig Studio
      '.bwproject',
      // Presonus Studio One
      '.studio',
      // Mixcraft
      '.mx7',
      // Ardour
      '.ardour',
      // LMMS
      '.mmp', '.mmpz',
      // Audacity
      '.aup',
      // GarageBand
      '.band',
      // Other session formats
      '.ses', '.sesx', '.session', '.proj'
    ];
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
      
      // Add project files to tracks for filtering
      results.tracks = results.tracks.concat(results.projects);
      
      // Count file types found
      const fileTypeCounts = {};
      let audioCount = 0;
      let midiCount = 0;
      
      results.tracks.forEach(track => {
        const format = track.format || 'unknown';
        fileTypeCounts[format] = (fileTypeCounts[format] || 0) + 1;
        
        // Count audio vs MIDI
        if (['wav', 'mp3', 'aiff', 'aif', 'flac', 'm4a', 'ogg', 'wma', 'aac'].includes(format)) {
          audioCount++;
        } else if (['mid', 'midi'].includes(format)) {
          midiCount++;
        }
      });
      
      console.log(`📊 Scan complete. Found ${results.tracks.length} total files:`);
      console.log(`   🎵 Audio files: ${audioCount}`);
      console.log(`   🎼 MIDI files: ${midiCount}`);
      Object.entries(fileTypeCounts).forEach(([format, count]) => {
        console.log(`   ${format}: ${count} files`);
      });
      console.log(`   Projects: ${results.projects.length} files`);
    } catch (error) {
      console.error('Error scanning folder:', error);
      results.errors.push(error.message);
    }

    return results;
  }

  async processSingleFile(filePath) {
    console.log(`Processing single file: ${filePath}`);
    const results = {
      tracks: [],
      projects: [],
      errors: []
    };
    
    try {
      await this.processFile(filePath, results);
      console.log(`📊 Single file processing complete. Found ${results.tracks.length} files:`);
      console.log(`   🎵 Audio files: ${results.tracks.filter(t => ['wav', 'mp3', 'aiff', 'aif', 'flac', 'm4a', 'ogg', 'wma', 'aac'].includes(t.format)).length}`);
      console.log(`   🎼 MIDI files: ${results.tracks.filter(t => ['mid', 'midi'].includes(t.format)).length}`);
      console.log(`   Projects: ${results.projects.length} files`);
      
      return results;
    } catch (error) {
      console.error('Single file processing failed:', error);
      results.errors.push(`Single file processing failed: ${error.message}`);
      return results;
    }
  }

  async scanDirectory(dirPath, results) {
    try {
      console.log(`📁 Scanning directory: ${dirPath}`);
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      console.log(`📋 Found ${entries.length} entries in ${dirPath}`);
      
      // Sort entries to prioritize audio files over MIDI files
      const sortedEntries = entries.sort((a, b) => {
        const aExt = path.extname(a.name).toLowerCase();
        const bExt = path.extname(b.name).toLowerCase();
        
        const aIsAudio = ['.wav', '.mp3', '.aiff', '.aif', '.flac', '.m4a', '.ogg', '.wma', '.aac'].includes(aExt);
        const bIsAudio = ['.wav', '.mp3', '.aiff', '.aif', '.flac', '.m4a', '.ogg', '.wma', '.aac'].includes(bExt);
        
        if (aIsAudio && !bIsAudio) return -1; // Audio files first
        if (!aIsAudio && bIsAudio) return 1;
        return 0; // Keep original order for same type
      });
      
      // Process files in batches to prevent memory issues
      const BATCH_SIZE = 25;
      for (let i = 0; i < sortedEntries.length; i += BATCH_SIZE) {
        const batch = sortedEntries.slice(i, i + BATCH_SIZE);
        
        // Process batch
        for (const entry of batch) {
          const fullPath = path.join(dirPath, entry.name);
          const ext = path.extname(fullPath).toLowerCase();
          
          if (entry.isDirectory()) {
            // Skip hidden directories and common non-music folders
            if (!entry.name.startsWith('.') && 
                !['node_modules', 'System Volume Information', '$RECYCLE.BIN'].includes(entry.name)) {
              await this.scanDirectory(fullPath, results);
            }
          } else if (entry.isFile()) {
            console.log(`📄 Processing file: ${entry.name}`);
            await this.processFile(fullPath, results);
          }
        }
        
        // Memory management after each batch
        if (global.gc) {
          global.gc();
        }
        
        const memUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
        
        console.log(`🧠 Memory usage: ${heapUsedMB}MB (${results.tracks.length} files processed)`);
        
        // Show progress every 100 files
        if (results.tracks.length % 100 === 0 && results.tracks.length > 0) {
          console.log(`📊 Progress: ${results.tracks.length} files processed so far...`);
          
          // Update progress feedback if available
          if (this.progressFeedback) {
            this.progressFeedback.update(results.tracks.length, 'Processing files');
          }
        }
        
        // Stop scanning if memory usage is too high
        if (heapUsedMB > 1200) {
          console.log(`🛑 STOPPING SCAN: Memory usage too high (${heapUsedMB}MB), stopping to prevent crash`);
          console.log(`📊 Partial scan complete: Found ${results.tracks.length} files before stopping`);
          return;
        }
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
      results.errors.push(`Error reading directory ${dirPath}: ${error.message}`);
    }
  }

  async processFile(filePath, results) {
    const ext = path.extname(filePath).toLowerCase();
    
    // Debug: Log all files being checked
    console.log(`📄 Found file: ${path.basename(filePath)} (ext: ${ext})`);
    console.log(`🔍 Checking file: ${filePath} (ext: ${ext})`);
    console.log(`   ✅ Supported: ${this.supportedExtensions.includes(ext)}`);
    
    // Special debug for audio files
    if (ext === '.wav' || ext === '.aiff' || ext === '.aif') {
      console.log(`🎵 AUDIO FILE DETECTED: ${path.basename(filePath)} (ext: ${ext})`);
      console.log(`   Supported extensions include .wav: ${this.supportedExtensions.includes('.wav')}`);
      console.log(`   Supported extensions include .aiff: ${this.supportedExtensions.includes('.aiff')}`);
      console.log(`   Supported extensions include .aif: ${this.supportedExtensions.includes('.aif')}`);
    }
    
    // Special debug for project files
    if (this.projectExtensions.includes(ext)) {
      console.log(`🎛️ PROJECT FILE DETECTED: ${path.basename(filePath)} (ext: ${ext})`);
      console.log(`   Project extensions include ${ext}: ${this.projectExtensions.includes(ext)}`);
    }
    
    // Check if extension is in supported list
    const isSupported = this.supportedExtensions.includes(ext);
    
    if (isSupported) {
      console.log(`🎵 Found supported file: ${path.basename(filePath)} (ext: ${ext})`);
    }
    
    if (isSupported) {
      try {
        // Handle MIDI files separately
        if (ext === '.mid' || ext === '.midi') {
          const trackData = await this.analyzeMidiFile(filePath);
          if (trackData) {
            results.tracks.push(trackData);
            await this.database.insertTrack(trackData);
          }
        } else {
          // Handle audio files
          const trackData = await this.analyzeAudioFile(filePath);
          if (trackData) {
            results.tracks.push(trackData);
            await this.database.insertTrack(trackData);
          }
        }
      } catch (error) {
        console.error(`Error analyzing file ${filePath}:`, error);
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
      console.log(`🎵 Processing audio file: ${filePath}`);
      const stats = await fs.stat(filePath);
      let metadata;
      
      try {
        // Try music-metadata first
        console.log(`🔍 Attempting music-metadata parsing for: ${path.basename(filePath)}`);
        metadata = await parseFile(filePath);
        console.log(`✅ music-metadata parsing successful for: ${path.basename(filePath)}`);
      } catch (musicMetadataError) {
        console.log(`⚠️ music-metadata failed for ${path.basename(filePath)}, trying jsmediatags:`, musicMetadataError.message);
        try {
          // Fallback to jsmediatags for Apple files
          metadata = await this.analyzeWithJsMediaTags(filePath);
          console.log(`✅ jsmediatags parsing successful for: ${path.basename(filePath)}`);
        } catch (jsMediaTagsError) {
          console.log(`⚠️ jsmediatags also failed for ${path.basename(filePath)}, creating minimal metadata:`, jsMediaTagsError.message);
          // Create minimal metadata for files that can't be parsed
          metadata = this.createMinimalMetadata(filePath, stats);
        }
      }
      
      const trackData = {
        filePath: filePath,
        fileName: path.basename(filePath),
        fileSize: stats.size,
        duration: metadata.format?.duration || null,
        bitrate: metadata.format?.bitrate || null,
        sampleRate: metadata.format?.sampleRate || null,
        channels: metadata.format?.numberOfChannels || null,
        format: metadata.format?.container || path.extname(filePath).substring(1),
        title: metadata.common?.title || null,
        artist: metadata.common?.artist || null,
        album: metadata.common?.album || null,
        genre: metadata.common?.genre ? (Array.isArray(metadata.common.genre) ? metadata.common.genre[0] : metadata.common.genre) : null,
        year: metadata.common?.year || null,
        tempo: this.extractTempo(metadata),
        keySignature: this.extractKeySignature(metadata),
        mood: null, // Will be analyzed later with AI
        energyLevel: null, // Will be analyzed later with AI
        danceability: null, // Will be analyzed later with AI
        valence: null // Will be analyzed later with AI
      };

      console.log(`✅ Successfully analyzed audio file: ${filePath}`);
      return trackData;
    } catch (error) {
      console.error(`Error analyzing audio file ${filePath}:`, error);
      return null;
    }
  }

  async analyzeWithJsMediaTags(filePath) {
    return new Promise((resolve, reject) => {
      jsmediatags.read(filePath, {
        onSuccess: function(tag) {
          const metadata = {
            format: {
              duration: null,
              bitrate: null,
              sampleRate: null,
              numberOfChannels: null,
              container: path.extname(filePath).substring(1)
            },
            common: {
              title: tag.tags.title || null,
              artist: tag.tags.artist || null,
              album: tag.tags.album || null,
              genre: tag.tags.genre || null,
              year: tag.tags.year || null
            }
          };
          resolve(metadata);
        },
        onError: function(error) {
          console.error(`jsmediatags error for ${filePath}:`, error);
          reject(error);
        }
      });
    });
  }

  createMinimalMetadata(filePath, stats) {
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath, ext);
    
    console.log(`📝 Creating minimal metadata for: ${fileName}`);
    
    return {
      format: {
        duration: null,
        bitrate: null,
        sampleRate: null,
        numberOfChannels: null,
        container: ext.substring(1)
      },
      common: {
        title: fileName,
        artist: null,
        album: null,
        genre: null,
        year: null
      }
    };
  }

  async analyzeProjectFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      return {
        filePath: filePath,
        fileName: path.basename(filePath),
        fileSize: stats.size,
        format: ext.substring(1), // Remove the dot
        type: this.getProjectType(ext),
        lastModified: stats.mtime,
        // Add to tracks for filtering
        duration: null,
        bitrate: null,
        sampleRate: null,
        channels: null,
        title: path.basename(filePath, ext),
        artist: null,
        album: null,
        genre: null,
        year: null,
        tempo: null,
        keySignature: null,
        mood: null,
        energyLevel: null,
        danceability: null,
        valence: null
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
      const stats = await fs.stat(filePath);
      
      // Skip very large MIDI files to prevent memory issues
      if (stats.size > 5 * 1024 * 1024) { // 5MB limit (reduced from 10MB)
        console.log(`Skipping large MIDI file: ${filePath} (${stats.size} bytes)`);
        return this.createBasicMidiInfo(filePath, stats);
      }
      
      const buffer = await fs.readFile(filePath);
      let midiData;
      
      try {
        midiData = MidiParser.parse(buffer);
      } catch (parseError) {
        console.log(`MIDI parsing failed for ${filePath}: ${parseError.message}`);
        return this.createBasicMidiInfo(filePath, stats);
      }
      
      // Additional validation for MIDI data
      if (!midiData || !midiData.track) {
        console.log(`Invalid MIDI data for ${filePath}`);
        return this.createBasicMidiInfo(filePath, stats);
      }
      
      return {
        filePath: filePath,
        fileName: path.basename(filePath),
        fileSize: stats.size,
        duration: null, // MIDI files don't have fixed duration
        bitrate: null,
        sampleRate: null,
        channels: null,
        format: 'midi',
        title: path.basename(filePath, path.extname(filePath)),
        artist: null,
        album: null,
        genre: null,
        year: null,
        tempo: this.extractMidiTempo(midiData),
        keySignature: null,
        mood: null,
        energyLevel: null,
        danceability: null,
        valence: null,
        // MIDI-specific data
        midiTracks: midiData.track ? midiData.track.length : 0,
        timeDivision: midiData.timeDivision || 480,
        midiFormat: midiData.format || 1
      };
    } catch (error) {
      console.error(`Error analyzing MIDI file ${filePath}:`, error);
      // Return basic MIDI file info even if parsing fails
      return {
        filePath: filePath,
        fileName: path.basename(filePath),
        fileSize: (await fs.stat(filePath)).size,
        duration: null,
        bitrate: null,
        sampleRate: null,
        channels: null,
        format: 'midi',
        title: path.basename(filePath, path.extname(filePath)),
        artist: null,
        album: null,
        genre: null,
        year: null,
        tempo: null,
        keySignature: null,
        mood: null,
        energyLevel: null,
        danceability: null,
        valence: null,
        midiTracks: 0,
        timeDivision: 480,
        midiFormat: 1
      };
    }
  }

  extractMidiTempo(midiData) {
    try {
      // Look for tempo events in the MIDI data
      if (midiData.track && Array.isArray(midiData.track)) {
        for (const track of midiData.track) {
          if (track.event && Array.isArray(track.event)) {
            for (const event of track.event) {
              if (event.type === 255 && event.metaType === 81) { // Set Tempo
                return Math.round(60000000 / event.data); // Convert to BPM
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error extracting MIDI tempo:', error);
    }
    return null;
  }

  createBasicMidiInfo(filePath, stats) {
    return {
      filePath: filePath,
      fileName: path.basename(filePath),
      fileSize: stats.size,
      duration: null,
      bitrate: null,
      sampleRate: null,
      channels: null,
      format: 'midi',
      title: path.basename(filePath, path.extname(filePath)),
      artist: null,
      album: null,
      genre: null,
      year: null,
      tempo: null,
      keySignature: null,
      mood: null,
      energyLevel: null,
      danceability: null,
      valence: null,
      midiTracks: 0,
      timeDivision: 480,
      midiFormat: 1,
      error: 'File too large for processing'
    };
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
