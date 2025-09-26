const path = require('path');
const fs = require('fs').promises;

class AutoOrganizer {
  constructor() {
    this.organizationRules = {
      byGenre: true,
      byYear: true,
      byArtist: true,
      byFormat: true,
      createPlaylists: true
    };
  }

  async organizeFiles(files, organizationOptions = {}) {
    const rules = { ...this.organizationRules, ...organizationOptions };
    const organizedStructure = {
      byGenre: {},
      byYear: {},
      byArtist: {},
      byFormat: {},
      playlists: []
    };

    for (const file of files) {
      // Organize by genre
      if (rules.byGenre && file.genre) {
        const genre = this.sanitizeName(file.genre);
        if (!organizedStructure.byGenre[genre]) {
          organizedStructure.byGenre[genre] = [];
        }
        organizedStructure.byGenre[genre].push(file);
      }

      // Organize by year
      if (rules.byYear && file.year) {
        const year = file.year.toString();
        if (!organizedStructure.byYear[year]) {
          organizedStructure.byYear[year] = [];
        }
        organizedStructure.byYear[year].push(file);
      }

      // Organize by artist
      if (rules.byArtist && file.artist) {
        const artist = this.sanitizeName(file.artist);
        if (!organizedStructure.byArtist[artist]) {
          organizedStructure.byArtist[artist] = [];
        }
        organizedStructure.byArtist[artist].push(file);
      }

      // Organize by format
      if (rules.byFormat && file.format) {
        const format = file.format.toUpperCase();
        if (!organizedStructure.byFormat[format]) {
          organizedStructure.byFormat[format] = [];
        }
        organizedStructure.byFormat[format].push(file);
      }
    }

    // Create playlists
    if (rules.createPlaylists) {
      organizedStructure.playlists = this.createPlaylists(organizedStructure);
    }

    return organizedStructure;
  }

  createPlaylists(organizedStructure) {
    const playlists = [];

    // Genre playlists
    Object.keys(organizedStructure.byGenre).forEach(genre => {
      playlists.push({
        name: `${genre} Collection`,
        type: 'genre',
        files: organizedStructure.byGenre[genre],
        count: organizedStructure.byGenre[genre].length
      });
    });

    // Year playlists
    Object.keys(organizedStructure.byYear).forEach(year => {
      playlists.push({
        name: `${year} Hits`,
        type: 'year',
        files: organizedStructure.byYear[year],
        count: organizedStructure.byYear[year].length
      });
    });

    // Artist playlists
    Object.keys(organizedStructure.byArtist).forEach(artist => {
      playlists.push({
        name: `${artist} Discography`,
        type: 'artist',
        files: organizedStructure.byArtist[artist],
        count: organizedStructure.byArtist[artist].length
      });
    });

    // Format playlists
    Object.keys(organizedStructure.byFormat).forEach(format => {
      playlists.push({
        name: `${format} Files`,
        type: 'format',
        files: organizedStructure.byFormat[format],
        count: organizedStructure.byFormat[format].length
      });
    });

    return playlists;
  }

  generateAutoTags(file) {
    const tags = [];

    // Format-based tags
    if (file.format) {
      tags.push(`format:${file.format.toLowerCase()}`);
    }

    // Quality-based tags
    if (file.bitrate) {
      if (file.bitrate >= 320) {
        tags.push('quality:high');
      } else if (file.bitrate >= 192) {
        tags.push('quality:medium');
      } else {
        tags.push('quality:low');
      }
    }

    // Duration-based tags
    if (file.duration) {
      if (file.duration < 30) {
        tags.push('type:short');
      } else if (file.duration > 300) {
        tags.push('type:long');
      } else {
        tags.push('type:standard');
      }
    }

    // Tempo-based tags
    if (file.tempo) {
      if (file.tempo < 80) {
        tags.push('tempo:slow');
      } else if (file.tempo > 140) {
        tags.push('tempo:fast');
      } else {
        tags.push('tempo:medium');
      }
    }

    // Key-based tags
    if (file.keySignature) {
      tags.push(`key:${file.keySignature}`);
    }

    // Genre-based tags
    if (file.genre) {
      tags.push(`genre:${file.genre.toLowerCase()}`);
    }

    return tags;
  }

  suggestSmartCollections(files) {
    const suggestions = [];

    // Find common patterns
    const genreCounts = {};
    const artistCounts = {};
    const yearCounts = {};

    files.forEach(file => {
      if (file.genre) {
        genreCounts[file.genre] = (genreCounts[file.genre] || 0) + 1;
      }
      if (file.artist) {
        artistCounts[file.artist] = (artistCounts[file.artist] || 0) + 1;
      }
      if (file.year) {
        yearCounts[file.year] = (yearCounts[file.year] || 0) + 1;
      }
    });

    // Suggest collections based on frequency
    Object.entries(genreCounts)
      .filter(([genre, count]) => count >= 3)
      .forEach(([genre, count]) => {
        suggestions.push({
          name: `${genre} Collection`,
          type: 'genre',
          count,
          files: files.filter(f => f.genre === genre)
        });
      });

    Object.entries(artistCounts)
      .filter(([artist, count]) => count >= 2)
      .forEach(([artist, count]) => {
        suggestions.push({
          name: `${artist} Discography`,
          type: 'artist',
          count,
          files: files.filter(f => f.artist === artist)
        });
      });

    Object.entries(yearCounts)
      .filter(([year, count]) => count >= 5)
      .forEach(([year, count]) => {
        suggestions.push({
          name: `${year} Hits`,
          type: 'year',
          count,
          files: files.filter(f => f.year === parseInt(year))
        });
      });

    return suggestions;
  }

  sanitizeName(name) {
    return name
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  async createPlaylistFile(playlist, outputPath) {
    const playlistContent = playlist.files.map(file => 
      `#EXTINF:${Math.round(file.duration || 0)},${file.artist || 'Unknown'} - ${file.title || path.basename(file.filePath)}`
    ).join('\n') + '\n';

    const header = `#EXTM3U\n#EXTINF:${playlist.count},${playlist.name}\n`;
    const content = header + playlistContent;

    try {
      await fs.writeFile(outputPath, content, 'utf8');
      return true;
    } catch (error) {
      console.error('Error creating playlist file:', error);
      return false;
    }
  }

  generateOrganizationReport(organizedStructure) {
    const report = {
      totalFiles: 0,
      organizationStats: {},
      recommendations: []
    };

    // Count total files
    Object.values(organizedStructure.byGenre).forEach(files => {
      report.totalFiles += files.length;
    });

    // Generate stats
    report.organizationStats = {
      genres: Object.keys(organizedStructure.byGenre).length,
      years: Object.keys(organizedStructure.byYear).length,
      artists: Object.keys(organizedStructure.byArtist).length,
      formats: Object.keys(organizedStructure.byFormat).length,
      playlists: organizedStructure.playlists.length
    };

    // Generate recommendations
    if (report.organizationStats.genres > 10) {
      report.recommendations.push('Consider creating sub-genre collections');
    }

    if (report.organizationStats.artists > 50) {
      report.recommendations.push('Consider organizing artists alphabetically');
    }

    if (report.organizationStats.formats > 5) {
      report.recommendations.push('Consider consolidating similar formats');
    }

    return report;
  }
}

module.exports = AutoOrganizer;
