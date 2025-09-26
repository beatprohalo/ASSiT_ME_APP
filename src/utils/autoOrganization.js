const path = require('path');

class AutoOrganization {
  constructor() {
    this.organizationRules = {
      byGenre: true,
      byBPM: true,
      byKey: true,
      byMood: true,
      byInstrument: true,
      byYear: true
    };
    
    this.genreMapping = {
      'electronic': ['edm', 'house', 'techno', 'trance', 'dubstep', 'drum and bass'],
      'hip-hop': ['rap', 'trap', 'hip hop', 'urban'],
      'rock': ['rock', 'metal', 'punk', 'alternative'],
      'pop': ['pop', 'mainstream', 'commercial'],
      'jazz': ['jazz', 'blues', 'swing'],
      'classical': ['classical', 'orchestral', 'symphony'],
      'ambient': ['ambient', 'chill', 'atmospheric'],
      'world': ['world', 'ethnic', 'traditional']
    };
    
    this.bpmRanges = {
      'very-slow': [0, 60],
      'slow': [60, 80],
      'medium': [80, 120],
      'fast': [120, 140],
      'very-fast': [140, 200]
    };
    
    this.moodMapping = {
      'energetic': ['energetic', 'upbeat', 'exciting', 'intense'],
      'calm': ['calm', 'peaceful', 'relaxing', 'serene'],
      'dark': ['dark', 'moody', 'ominous', 'brooding'],
      'bright': ['bright', 'happy', 'cheerful', 'uplifting'],
      'mysterious': ['mysterious', 'ethereal', 'otherworldly']
    };
  }

  analyzeFile(fileData) {
    const analysis = {
      suggestedTags: [],
      suggestedCategory: 'uncategorized',
      confidence: 0
    };

    // Analyze genre
    if (fileData.genre) {
      const genre = this.analyzeGenre(fileData.genre);
      if (genre) {
        analysis.suggestedTags.push(genre);
        analysis.suggestedCategory = genre;
        analysis.confidence += 0.3;
      }
    }

    // Analyze BPM
    if (fileData.tempo) {
      const bpmCategory = this.analyzeBPM(fileData.tempo);
      if (bpmCategory) {
        analysis.suggestedTags.push(`bpm-${bpmCategory}`);
        analysis.confidence += 0.2;
      }
    }

    // Analyze key
    if (fileData.keySignature) {
      analysis.suggestedTags.push(`key-${fileData.keySignature.toLowerCase()}`);
      analysis.confidence += 0.1;
    }

    // Analyze mood
    if (fileData.mood) {
      const mood = this.analyzeMood(fileData.mood);
      if (mood) {
        analysis.suggestedTags.push(mood);
        analysis.confidence += 0.2;
      }
    }

    // Analyze file name for additional clues
    const fileNameTags = this.analyzeFileName(fileData.fileName);
    analysis.suggestedTags.push(...fileNameTags);

    // Analyze file size and duration for type classification
    const typeTags = this.analyzeFileType(fileData);
    analysis.suggestedTags.push(...typeTags);

    // Remove duplicates
    analysis.suggestedTags = [...new Set(analysis.suggestedTags)];

    return analysis;
  }

  analyzeGenre(genre) {
    if (!genre) return null;
    
    const genreLower = genre.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.genreMapping)) {
      if (keywords.some(keyword => genreLower.includes(keyword))) {
        return category;
      }
    }
    
    return 'other';
  }

  analyzeBPM(bpm) {
    if (!bpm) return null;
    
    for (const [category, range] of Object.entries(this.bpmRanges)) {
      if (bpm >= range[0] && bpm < range[1]) {
        return category;
      }
    }
    
    return 'unknown';
  }

  analyzeMood(mood) {
    if (!mood) return null;
    
    const moodLower = mood.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.moodMapping)) {
      if (keywords.some(keyword => moodLower.includes(keyword))) {
        return category;
      }
    }
    
    return null;
  }

  analyzeFileName(fileName) {
    const tags = [];
    const nameLower = fileName.toLowerCase();
    
    // Common music production terms
    const productionTerms = {
      'loop': ['loop', 'looped', 'looping'],
      'one-shot': ['oneshot', 'one-shot', 'hit', 'strike'],
      'vocal': ['vocal', 'voice', 'sing', 'singing'],
      'instrumental': ['instrumental', 'inst', 'no-vocal'],
      'acapella': ['acapella', 'a-capella', 'vocals-only'],
      'remix': ['remix', 'rmx', 'rework'],
      'demo': ['demo', 'rough', 'draft'],
      'master': ['master', 'final', 'mixed']
    };
    
    for (const [tag, keywords] of Object.entries(productionTerms)) {
      if (keywords.some(keyword => nameLower.includes(keyword))) {
        tags.push(tag);
      }
    }
    
    // File format indicators
    const format = path.extname(fileName).toLowerCase();
    if (['.wav', '.aiff', '.aif'].includes(format)) {
      tags.push('uncompressed');
    } else if (['.mp3', '.aac', '.ogg'].includes(format)) {
      tags.push('compressed');
    }
    
    return tags;
  }

  analyzeFileType(fileData) {
    const tags = [];
    
    // Duration-based classification
    if (fileData.duration) {
      if (fileData.duration < 10) {
        tags.push('short');
      } else if (fileData.duration > 300) {
        tags.push('long');
      } else {
        tags.push('medium-length');
      }
    }
    
    // File size-based classification
    if (fileData.fileSize) {
      const sizeMB = fileData.fileSize / (1024 * 1024);
      if (sizeMB < 1) {
        tags.push('small-file');
      } else if (sizeMB > 50) {
        tags.push('large-file');
      }
    }
    
    // Quality indicators
    if (fileData.bitrate) {
      if (fileData.bitrate > 256) {
        tags.push('high-quality');
      } else if (fileData.bitrate < 128) {
        tags.push('low-quality');
      }
    }
    
    return tags;
  }

  generateSmartTags(fileData) {
    const analysis = this.analyzeFile(fileData);
    
    // Add smart suggestions based on analysis
    const smartTags = [...analysis.suggestedTags];
    
    // Add confidence-based tags
    if (analysis.confidence > 0.7) {
      smartTags.push('high-confidence');
    } else if (analysis.confidence < 0.3) {
      smartTags.push('needs-review');
    }
    
    // Add time-based tags
    const now = new Date();
    const fileDate = fileData.year ? new Date(fileData.year, 0, 1) : null;
    if (fileDate) {
      const yearsDiff = now.getFullYear() - fileDate.getFullYear();
      if (yearsDiff > 10) {
        smartTags.push('vintage');
      } else if (yearsDiff < 2) {
        smartTags.push('recent');
      }
    }
    
    return {
      tags: [...new Set(smartTags)],
      category: analysis.suggestedCategory,
      confidence: analysis.confidence
    };
  }

  suggestOrganization(fileData) {
    const analysis = this.analyzeFile(fileData);
    const suggestions = [];
    
    // Suggest folder structure
    if (analysis.suggestedCategory !== 'uncategorized') {
      suggestions.push(`Organize by genre: ${analysis.suggestedCategory}`);
    }
    
    // Suggest BPM-based organization
    if (fileData.tempo) {
      const bpmCategory = this.analyzeBPM(fileData.tempo);
      if (bpmCategory) {
        suggestions.push(`Organize by BPM: ${bpmCategory}`);
      }
    }
    
    // Suggest mood-based organization
    if (fileData.mood) {
      const mood = this.analyzeMood(fileData.mood);
      if (mood) {
        suggestions.push(`Organize by mood: ${mood}`);
      }
    }
    
    return {
      suggestions,
      primaryCategory: analysis.suggestedCategory,
      confidence: analysis.confidence
    };
  }
}

module.exports = AutoOrganization;
