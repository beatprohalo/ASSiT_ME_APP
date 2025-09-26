const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class SampleDatabase {
  constructor(dbPath = './music_assistant.db') {
    this.db = null;
    this.dbPath = path.resolve(dbPath);
  }

  async initialize() {
    // Ensure data directory exists
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    try {
      this.db = new Database(this.dbPath);
      await this.initializeSampleTables();
      console.log('✅ Sample Database initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Sample Database:', error);
      throw error;
    }
  }

  // Basic database methods
  async run(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.run(params);
    } catch (error) {
      console.error('Database run error:', error);
      throw error;
    }
  }

  async get(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.get(params);
    } catch (error) {
      console.error('Database get error:', error);
      throw error;
    }
  }

  async all(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.all(params);
    } catch (error) {
      console.error('Database all error:', error);
      throw error;
    }
  }

  // Add missing methods for compatibility
  async getAllTracks() {
    try {
      return await this.all('SELECT * FROM tracks ORDER BY id DESC');
    } catch (error) {
      console.error('Error getting all tracks:', error);
      return [];
    }
  }

  async getTracksByFormat(format) {
    try {
      return await this.all('SELECT * FROM tracks WHERE format = ? ORDER BY id DESC', [format]);
    } catch (error) {
      console.error('Error getting tracks by format:', error);
      return [];
    }
  }

  async initializeSampleTables() {
    // Create advanced sample analysis table
    await this.run(`
      CREATE TABLE IF NOT EXISTS sample_analysis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sample_id INTEGER,
        audio_fingerprint TEXT,
        pitch_data TEXT,
        tempo_data TEXT,
        harmonic_data TEXT,
        mood_data TEXT,
        genre_data TEXT,
        spectral_data TEXT,
        stem_data TEXT,
        ai_description TEXT,
        auto_tags TEXT,
        similarity_scores TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sample_id) REFERENCES tracks (id)
      )
    `);

    // Create user preferences table
    await this.run(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT DEFAULT 'default',
        preferred_genres TEXT,
        preferred_moods TEXT,
        tempo_range TEXT,
        similarity_threshold REAL DEFAULT 0.7,
        mood_weight REAL DEFAULT 0.3,
        usage_patterns TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sample collections table
    await this.run(`
      CREATE TABLE IF NOT EXISTS sample_collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        tags TEXT,
        is_smart BOOLEAN DEFAULT 0,
        smart_criteria TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create collection samples junction table
    await this.run(`
      CREATE TABLE IF NOT EXISTS collection_samples (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collection_id INTEGER,
        sample_id INTEGER,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collection_id) REFERENCES sample_collections (id),
        FOREIGN KEY (sample_id) REFERENCES tracks (id)
      )
    `);

    // Create sample usage tracking table
    await this.run(`
      CREATE TABLE IF NOT EXISTS sample_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sample_id INTEGER,
        action TEXT,
        context TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT,
        FOREIGN KEY (sample_id) REFERENCES tracks (id)
      )
    `);

    // Create AI recommendations table
    await this.run(`
      CREATE TABLE IF NOT EXISTS ai_recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT DEFAULT 'default',
        sample_id INTEGER,
        recommendation_type TEXT,
        confidence_score REAL,
        context TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sample_id) REFERENCES tracks (id)
      )
    `);

    // Create sample relationships table
    await this.run(`
      CREATE TABLE IF NOT EXISTS sample_relationships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sample1_id INTEGER,
        sample2_id INTEGER,
        relationship_type TEXT,
        similarity_score REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sample1_id) REFERENCES tracks (id),
        FOREIGN KEY (sample2_id) REFERENCES tracks (id)
      )
    `);

    // Create indexes for performance
    await this.createIndexes();
  }

  async createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_sample_analysis_sample_id ON sample_analysis (sample_id)',
      'CREATE INDEX IF NOT EXISTS idx_sample_analysis_fingerprint ON sample_analysis (audio_fingerprint)',
      'CREATE INDEX IF NOT EXISTS idx_collection_samples_collection_id ON collection_samples (collection_id)',
      'CREATE INDEX IF NOT EXISTS idx_collection_samples_sample_id ON collection_samples (sample_id)',
      'CREATE INDEX IF NOT EXISTS idx_sample_usage_sample_id ON sample_usage (sample_id)',
      'CREATE INDEX IF NOT EXISTS idx_sample_usage_timestamp ON sample_usage (timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id ON ai_recommendations (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_ai_recommendations_sample_id ON ai_recommendations (sample_id)',
      'CREATE INDEX IF NOT EXISTS idx_sample_relationships_sample1 ON sample_relationships (sample1_id)',
      'CREATE INDEX IF NOT EXISTS idx_sample_relationships_sample2 ON sample_relationships (sample2_id)'
    ];

    for (const indexSQL of indexes) {
      await this.run(indexSQL);
    }
  }

  // Sample Analysis Methods
  async saveSampleAnalysis(sampleId, analysis) {
    const sql = `
      INSERT OR REPLACE INTO sample_analysis (
        sample_id, audio_fingerprint, pitch_data, tempo_data, harmonic_data,
        mood_data, genre_data, spectral_data, stem_data, ai_description,
        auto_tags, similarity_scores
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      sampleId,
      JSON.stringify(analysis.audioFingerprint),
      JSON.stringify(analysis.pitch),
      JSON.stringify(analysis.tempo),
      JSON.stringify(analysis.harmonics),
      JSON.stringify(analysis.mood),
      JSON.stringify(analysis.genre),
      JSON.stringify(analysis.spectralData),
      JSON.stringify(analysis.stems),
      analysis.metadata?.description || '',
      JSON.stringify(analysis.metadata?.tags || []),
      JSON.stringify(analysis.similarityScores || {})
    ];

    return await this.run(sql, params);
  }

  async getSampleAnalysis(sampleId) {
    const sql = 'SELECT * FROM sample_analysis WHERE sample_id = ?';
    const result = await this.get(sql, [sampleId]);
    
    if (result) {
      // Parse JSON fields
      result.pitch_data = JSON.parse(result.pitch_data || '{}');
      result.tempo_data = JSON.parse(result.tempo_data || '{}');
      result.harmonic_data = JSON.parse(result.harmonic_data || '{}');
      result.mood_data = JSON.parse(result.mood_data || '{}');
      result.genre_data = JSON.parse(result.genre_data || '{}');
      result.spectral_data = JSON.parse(result.spectral_data || '{}');
      result.stem_data = JSON.parse(result.stem_data || '{}');
      result.auto_tags = JSON.parse(result.auto_tags || '[]');
      result.similarity_scores = JSON.parse(result.similarity_scores || '{}');
    }
    
    return result;
  }

  async updateTrackAnalysis(samplePath, analysis) {
    // Get track ID by path
    const track = await this.get('SELECT id FROM tracks WHERE file_path = ?', [samplePath]);
    if (!track) return null;

    return await this.saveSampleAnalysis(track.id, analysis);
  }

  async getTrackIdByPath(samplePath) {
    const result = await this.get('SELECT id FROM tracks WHERE file_path = ?', [samplePath]);
    return result?.id;
  }

  async getTrackById(trackId) {
    return await this.get('SELECT * FROM tracks WHERE id = ?', [trackId]);
  }

  // User Preferences Methods
  async saveUserPreferences(userId, preferences) {
    const sql = `
      INSERT OR REPLACE INTO user_preferences (
        user_id, preferred_genres, preferred_moods, tempo_range,
        similarity_threshold, mood_weight, usage_patterns
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      userId,
      JSON.stringify(preferences.preferredGenres || []),
      JSON.stringify(preferences.preferredMoods || []),
      JSON.stringify(preferences.tempoRange || [60, 180]),
      preferences.similarityThreshold || 0.7,
      preferences.moodWeight || 0.3,
      JSON.stringify(preferences.usagePatterns || {})
    ];

    return await this.run(sql, params);
  }

  async getUserPreferences(userId = 'default') {
    const result = await this.get('SELECT * FROM user_preferences WHERE user_id = ?', [userId]);
    
    if (result) {
      result.preferred_genres = JSON.parse(result.preferred_genres || '[]');
      result.preferred_moods = JSON.parse(result.preferred_moods || '[]');
      result.tempo_range = JSON.parse(result.tempo_range || '[60, 180]');
      result.usage_patterns = JSON.parse(result.usage_patterns || '{}');
    }
    
    return result;
  }

  // Sample Collections Methods
  async createCollection(name, description, tags = [], isSmart = false, smartCriteria = null) {
    const sql = `
      INSERT INTO sample_collections (name, description, tags, is_smart, smart_criteria)
      VALUES (?, ?, ?, ?, ?)
    `;

    const params = [
      name,
      description,
      JSON.stringify(tags),
      isSmart ? 1 : 0,
      JSON.stringify(smartCriteria)
    ];

    const result = await this.run(sql, params);
    return result.lastInsertRowid;
  }

  async getCollections() {
    const sql = 'SELECT * FROM sample_collections ORDER BY created_at DESC';
    const results = await this.all(sql);
    
    return results.map(collection => ({
      ...collection,
      tags: JSON.parse(collection.tags || '[]'),
      smart_criteria: JSON.parse(collection.smart_criteria || '{}')
    }));
  }

  async addSampleToCollection(collectionId, sampleId) {
    const sql = `
      INSERT OR IGNORE INTO collection_samples (collection_id, sample_id)
      VALUES (?, ?)
    `;

    return await this.run(sql, [collectionId, sampleId]);
  }

  async removeSampleFromCollection(collectionId, sampleId) {
    const sql = 'DELETE FROM collection_samples WHERE collection_id = ? AND sample_id = ?';
    return await this.run(sql, [collectionId, sampleId]);
  }

  async getCollectionSamples(collectionId) {
    const sql = `
      SELECT t.*, cs.added_at
      FROM tracks t
      JOIN collection_samples cs ON t.id = cs.sample_id
      WHERE cs.collection_id = ?
      ORDER BY cs.added_at DESC
    `;

    return await this.all(sql, [collectionId]);
  }

  // Sample Usage Tracking
  async trackSampleUsage(sampleId, action, context = null, metadata = null) {
    const sql = `
      INSERT INTO sample_usage (sample_id, action, context, metadata)
      VALUES (?, ?, ?, ?)
    `;

    const params = [
      sampleId,
      action,
      JSON.stringify(context),
      JSON.stringify(metadata)
    ];

    return await this.run(sql, params);
  }

  async getSampleUsageStats(sampleId, days = 30) {
    const sql = `
      SELECT action, COUNT(*) as count, MAX(timestamp) as last_used
      FROM sample_usage
      WHERE sample_id = ? AND timestamp > datetime('now', '-${days} days')
      GROUP BY action
    `;

    return await this.all(sql, [sampleId]);
  }

  async getPopularSamples(limit = 50, days = 30) {
    const sql = `
      SELECT t.*, COUNT(su.id) as usage_count
      FROM tracks t
      JOIN sample_usage su ON t.id = su.sample_id
      WHERE su.timestamp > datetime('now', '-${days} days')
      GROUP BY t.id
      ORDER BY usage_count DESC
      LIMIT ?
    `;

    return await this.all(sql, [limit]);
  }

  // AI Recommendations
  async saveRecommendation(userId, sampleId, recommendationType, confidenceScore, context = null) {
    const sql = `
      INSERT INTO ai_recommendations (user_id, sample_id, recommendation_type, confidence_score, context)
      VALUES (?, ?, ?, ?, ?)
    `;

    const params = [
      userId,
      sampleId,
      recommendationType,
      confidenceScore,
      JSON.stringify(context)
    ];

    return await this.run(sql, params);
  }

  async getRecommendations(userId, limit = 20) {
    const sql = `
      SELECT t.*, ar.recommendation_type, ar.confidence_score, ar.context
      FROM tracks t
      JOIN ai_recommendations ar ON t.id = ar.sample_id
      WHERE ar.user_id = ?
      ORDER BY ar.confidence_score DESC, ar.created_at DESC
      LIMIT ?
    `;

    const results = await this.all(sql, [userId, limit]);
    
    return results.map(rec => ({
      ...rec,
      context: JSON.parse(rec.context || '{}')
    }));
  }

  // Sample Relationships
  async saveSampleRelationship(sample1Id, sample2Id, relationshipType, similarityScore) {
    const sql = `
      INSERT OR REPLACE INTO sample_relationships (sample1_id, sample2_id, relationship_type, similarity_score)
      VALUES (?, ?, ?, ?)
    `;

    return await this.run(sql, [sample1Id, sample2Id, relationshipType, similarityScore]);
  }

  async getSimilarSamples(sampleId, threshold = 0.7, limit = 20) {
    const sql = `
      SELECT t.*, sr.similarity_score, sr.relationship_type
      FROM tracks t
      JOIN sample_relationships sr ON t.id = sr.sample2_id
      WHERE sr.sample1_id = ? AND sr.similarity_score >= ?
      ORDER BY sr.similarity_score DESC
      LIMIT ?
    `;

    return await this.all(sql, [sampleId, threshold, limit]);
  }

  // Advanced Search Methods
  async searchByMood(mood, limit = 50) {
    const sql = `
      SELECT t.*, sa.mood_data
      FROM tracks t
      JOIN sample_analysis sa ON t.id = sa.sample_id
      WHERE JSON_EXTRACT(sa.mood_data, '$.primary') = ?
      ORDER BY sa.updated_at DESC
      LIMIT ?
    `;

    return await this.all(sql, [mood, limit]);
  }

  async searchByTempo(minTempo, maxTempo, limit = 50) {
    const sql = `
      SELECT t.*, sa.tempo_data
      FROM tracks t
      JOIN sample_analysis sa ON t.id = sa.sample_id
      WHERE JSON_EXTRACT(sa.tempo_data, '$.bpm') BETWEEN ? AND ?
      ORDER BY sa.updated_at DESC
      LIMIT ?
    `;

    return await this.all(sql, [minTempo, maxTempo, limit]);
  }

  async searchByGenre(genre, limit = 50) {
    const sql = `
      SELECT t.*, sa.genre_data
      FROM tracks t
      JOIN sample_analysis sa ON t.id = sa.sample_id
      WHERE JSON_EXTRACT(sa.genre_data, '$.primary') = ?
      ORDER BY sa.updated_at DESC
      LIMIT ?
    `;

    return await this.all(sql, [genre, limit]);
  }

  async searchByTags(tags, limit = 50) {
    const sql = `
      SELECT t.*, sa.auto_tags
      FROM tracks t
      JOIN sample_analysis sa ON t.id = sa.sample_id
      WHERE JSON_EXTRACT(sa.auto_tags, '$') LIKE ?
      ORDER BY sa.updated_at DESC
      LIMIT ?
    `;

    const tagPattern = `%${tags.join('%')}%`;
    return await this.all(sql, [tagPattern, limit]);
  }

  // Complex Search
  async advancedSearch(criteria, limit = 50) {
    let sql = `
      SELECT t.*, sa.mood_data, sa.tempo_data, sa.genre_data, sa.auto_tags
      FROM tracks t
      JOIN sample_analysis sa ON t.id = sa.sample_id
      WHERE 1=1
    `;

    const params = [];

    if (criteria.mood) {
      sql += ` AND JSON_EXTRACT(sa.mood_data, '$.primary') = ?`;
      params.push(criteria.mood);
    }

    if (criteria.tempo) {
      sql += ` AND JSON_EXTRACT(sa.tempo_data, '$.bpm') BETWEEN ? AND ?`;
      params.push(criteria.tempo - 10, criteria.tempo + 10);
    }

    if (criteria.genre) {
      sql += ` AND JSON_EXTRACT(sa.genre_data, '$.primary') = ?`;
      params.push(criteria.genre);
    }

    if (criteria.tags && criteria.tags.length > 0) {
      const tagConditions = criteria.tags.map(() => 'JSON_EXTRACT(sa.auto_tags, "$") LIKE ?').join(' AND ');
      sql += ` AND (${tagConditions})`;
      criteria.tags.forEach(tag => params.push(`%${tag}%`));
    }

    sql += ` ORDER BY sa.updated_at DESC LIMIT ?`;
    params.push(limit);

    return await this.all(sql, params);
  }

  // Analytics Methods
  async getAnalytics(days = 30) {
    const sql = `
      SELECT 
        COUNT(DISTINCT t.id) as total_samples,
        COUNT(DISTINCT sa.sample_id) as analyzed_samples,
        COUNT(DISTINCT su.sample_id) as used_samples,
        COUNT(su.id) as total_usage,
        AVG(JSON_EXTRACT(sa.tempo_data, '$.bpm')) as avg_tempo,
        COUNT(DISTINCT JSON_EXTRACT(sa.genre_data, '$.primary')) as unique_genres
      FROM tracks t
      LEFT JOIN sample_analysis sa ON t.id = sa.sample_id
      LEFT JOIN sample_usage su ON t.id = su.sample_id AND su.timestamp > datetime('now', '-${days} days')
    `;

    return await this.get(sql);
  }

  async getGenreDistribution() {
    const sql = `
      SELECT 
        JSON_EXTRACT(sa.genre_data, '$.primary') as genre,
        COUNT(*) as count
      FROM sample_analysis sa
      WHERE sa.genre_data IS NOT NULL
      GROUP BY JSON_EXTRACT(sa.genre_data, '$.primary')
      ORDER BY count DESC
    `;

    return await this.all(sql);
  }

  async getMoodDistribution() {
    const sql = `
      SELECT 
        JSON_EXTRACT(sa.mood_data, '$.primary') as mood,
        COUNT(*) as count
      FROM sample_analysis sa
      WHERE sa.mood_data IS NOT NULL
      GROUP BY JSON_EXTRACT(sa.mood_data, '$.primary')
      ORDER BY count DESC
    `;

    return await this.all(sql);
  }

  async getTempoDistribution() {
    const sql = `
      SELECT 
        CASE 
          WHEN JSON_EXTRACT(sa.tempo_data, '$.bpm') < 80 THEN 'Slow (< 80 BPM)'
          WHEN JSON_EXTRACT(sa.tempo_data, '$.bpm') < 120 THEN 'Medium (80-120 BPM)'
          WHEN JSON_EXTRACT(sa.tempo_data, '$.bpm') < 160 THEN 'Fast (120-160 BPM)'
          ELSE 'Very Fast (160+ BPM)'
        END as tempo_range,
        COUNT(*) as count
      FROM sample_analysis sa
      WHERE sa.tempo_data IS NOT NULL
      GROUP BY tempo_range
      ORDER BY count DESC
    `;

    return await this.all(sql);
  }
}

module.exports = { SampleDatabase };
