const fs = require('fs').promises;
const path = require('path');

class AutoOrganizer {
  constructor() {
    this.organizationRules = {
      audio: {
        folder: 'Audio Files',
        subfolders: {
          wav: 'WAV Files',
          mp3: 'MP3 Files',
          aiff: 'AIFF Files',
          flac: 'FLAC Files',
          m4a: 'M4A Files',
          ogg: 'OGG Files'
        }
      },
      midi: {
        folder: 'MIDI Files',
        subfolders: {
          mid: 'MIDI Files',
          midi: 'MIDI Files'
        }
      },
      projects: {
        folder: 'Project Files',
        subfolders: {
          logic: 'Logic Pro',
          cpr: 'Cubase',
          rpp: 'Reaper',
          flp: 'FL Studio',
          als: 'Ableton Live'
        }
      }
    };
  }

  async organizeFiles(files, targetDirectory) {
    const organizationResults = {
      organized: 0,
      errors: [],
      structure: {}
    };

    try {
      // Create main organization structure
      await this.createOrganizationStructure(targetDirectory);

      for (const file of files) {
        try {
          const result = await this.organizeFile(file, targetDirectory);
          if (result.success) {
            organizationResults.organized++;
            if (!organizationResults.structure[result.category]) {
              organizationResults.structure[result.category] = [];
            }
            organizationResults.structure[result.category].push(result.newPath);
          } else {
            organizationResults.errors.push({
              file: file.filePath,
              error: result.error
            });
          }
        } catch (error) {
          organizationResults.errors.push({
            file: file.filePath,
            error: error.message
          });
        }
      }

      return organizationResults;
    } catch (error) {
      console.error('Error in auto-organization:', error);
      organizationResults.errors.push({
        file: 'Auto-organization',
        error: error.message
      });
      return organizationResults;
    }
  }

  async createOrganizationStructure(baseDirectory) {
    const mainFolders = Object.values(this.organizationRules).map(rule => rule.folder);
    
    for (const folder of mainFolders) {
      const folderPath = path.join(baseDirectory, folder);
      await fs.mkdir(folderPath, { recursive: true });
    }
  }

  async organizeFile(file, baseDirectory) {
    const ext = path.extname(file.filePath).toLowerCase();
    const fileName = path.basename(file.filePath);
    
    // Determine file category
    let category = 'other';
    let subfolder = '';
    
    if (['.wav', '.mp3', '.aiff', '.aif', '.flac', '.m4a', '.ogg', '.wma', '.aac'].includes(ext)) {
      category = 'audio';
      subfolder = this.organizationRules.audio.subfolders[ext.substring(1)] || 'Other Audio';
    } else if (['.mid', '.midi'].includes(ext)) {
      category = 'midi';
      subfolder = this.organizationRules.midi.subfolders[ext.substring(1)] || 'MIDI Files';
    } else if (['.logic', '.logicx', '.cpr', '.rpp', '.flp', '.als'].includes(ext)) {
      category = 'projects';
      subfolder = this.organizationRules.projects.subfolders[ext.substring(1)] || 'Other Projects';
    }

    // Create destination path
    const categoryFolder = this.organizationRules[category]?.folder || 'Other Files';
    const destinationDir = path.join(baseDirectory, categoryFolder, subfolder);
    await fs.mkdir(destinationDir, { recursive: true });

    const newPath = path.join(destinationDir, fileName);

    try {
      // Copy file to new location
      await fs.copyFile(file.filePath, newPath);
      
      return {
        success: true,
        category,
        subfolder,
        newPath,
        originalPath: file.filePath
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateOrganizationReport(results) {
    const report = {
      summary: {
        totalFiles: results.organized + results.errors.length,
        organized: results.organized,
        errors: results.errors.length,
        successRate: results.organized / (results.organized + results.errors.length) * 100
      },
      structure: results.structure,
      errors: results.errors
    };

    return report;
  }

  async createSmartCollections(files) {
    const collections = {
      byGenre: {},
      byBPM: {},
      byKey: {},
      byMood: {}
    };

    for (const file of files) {
      // Group by genre
      if (file.genre) {
        if (!collections.byGenre[file.genre]) {
          collections.byGenre[file.genre] = [];
        }
        collections.byGenre[file.genre].push(file);
      }

      // Group by BPM ranges
      if (file.tempo) {
        const bpmRange = this.getBPMRange(file.tempo);
        if (!collections.byBPM[bpmRange]) {
          collections.byBPM[bpmRange] = [];
        }
        collections.byBPM[bpmRange].push(file);
      }

      // Group by key
      if (file.keySignature) {
        if (!collections.byKey[file.keySignature]) {
          collections.byKey[file.keySignature] = [];
        }
        collections.byKey[file.keySignature].push(file);
      }

      // Group by mood (if available)
      if (file.mood) {
        if (!collections.byMood[file.mood]) {
          collections.byMood[file.mood] = [];
        }
        collections.byMood[file.mood].push(file);
      }
    }

    return collections;
  }

  getBPMRange(tempo) {
    if (tempo < 60) return 'Very Slow (< 60 BPM)';
    if (tempo < 80) return 'Slow (60-80 BPM)';
    if (tempo < 100) return 'Medium (80-100 BPM)';
    if (tempo < 120) return 'Fast (100-120 BPM)';
    if (tempo < 140) return 'Very Fast (120-140 BPM)';
    return 'Extreme (140+ BPM)';
  }

  async generateAutoTags(file) {
    const tags = [];

    // File type tags
    const ext = path.extname(file.filePath).toLowerCase();
    if (['.wav', '.aiff', '.aif'].includes(ext)) {
      tags.push('Lossless');
    } else if (['.mp3', '.aac', '.ogg'].includes(ext)) {
      tags.push('Compressed');
    }

    // Duration tags
    if (file.duration) {
      if (file.duration < 30) {
        tags.push('Short');
      } else if (file.duration > 300) {
        tags.push('Long');
      }
    }

    // BPM tags
    if (file.tempo) {
      const bpmRange = this.getBPMRange(file.tempo);
      tags.push(bpmRange);
    }

    // Genre tags
    if (file.genre) {
      tags.push(file.genre);
    }

    return tags;
  }
}

module.exports = AutoOrganizer;
