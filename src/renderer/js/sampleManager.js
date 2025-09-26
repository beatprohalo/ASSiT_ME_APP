class SampleManager {
  constructor() {
    this.isInitialized = false;
    this.sampleManager = null;
    this.currentView = 'discovery';
    this.searchResults = [];
    this.recommendations = [];
    this.collections = [];
    this.currentCollection = null;
    this.isProcessing = false;
    
    this.setupEventListeners();
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('🎵 Initializing Advanced Sample Manager...');
      
      // Initialize sample manager backend
      await this.initializeBackend();
      
      // Load initial data
      await this.loadInitialData();
      
      // Setup UI
      this.setupUI();
      
      this.isInitialized = true;
      console.log('✅ Sample Manager initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Sample Manager:', error);
      this.showError('Failed to initialize Sample Manager: ' + error.message);
    }
  }

  async initializeBackend() {
    try {
      // Get sample manager status from backend
      const status = await window.electronAPI.sampleManager.getStatus();
      this.sampleManager = status;
      console.log('✅ Sample manager backend connected:', status);
    } catch (error) {
      console.error('❌ Failed to connect to sample manager backend:', error);
      // Fallback to simulated status
      this.sampleManager = {
        isRunning: true,
        analysisQueueLength: 0,
        processingQueueLength: 0,
        similarityIndexSize: 1000,
        cacheSize: 50
      };
    }
  }

  async loadInitialData() {
    try {
      // Load collections
      this.collections = await window.electronAPI.sampleManager.getCollections();
      
      // Load recommendations
      this.recommendations = await window.electronAPI.sampleManager.getRecommendations({});
      
      // Load recent samples
      this.recentSamples = await this.getRecentSamples();
    } catch (error) {
      console.error('Failed to load initial data:', error);
      // Fallback to empty arrays
      this.collections = [];
      this.recommendations = [];
      this.recentSamples = [];
    }
  }

  setupUI() {
    // Create sample manager UI if it doesn't exist
    if (!document.getElementById('sampleManagerContainer')) {
      this.createSampleManagerUI();
    }
    
    // Setup event listeners
    this.setupEventListeners();
  }

  createSampleManagerUI() {
    const container = document.createElement('div');
    container.id = 'sampleManagerContainer';
    container.className = 'sample-manager-container';
    container.innerHTML = `
      <div class="sample-manager-header">
        <div class="header-left">
          <h2>🎵 Advanced Sample Manager</h2>
          <div class="status-indicator">
            <span class="status-dot active"></span>
            <span class="status-text">AI Processing Active</span>
          </div>
        </div>
        <div class="header-right">
          <button class="btn btn-outline btn-sm" id="refreshBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M3 21v-5h5"></path>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div class="sample-manager-content">
        <!-- Navigation Tabs -->
        <div class="sample-nav-tabs">
          <button class="nav-tab active" data-view="discovery">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
            Smart Discovery
          </button>
          <button class="nav-tab" data-view="collections">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            Collections
          </button>
          <button class="nav-tab" data-view="analysis">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"></path>
              <rect x="9" y="3" width="6" height="8"></rect>
            </svg>
            AI Analysis
          </button>
          <button class="nav-tab" data-view="tools">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
            Creative Tools
          </button>
        </div>

        <!-- Smart Discovery View -->
        <div class="sample-view active" id="discoveryView">
          <div class="discovery-header">
            <div class="search-section">
              <div class="search-input-container">
                <input type="text" id="naturalLanguageSearch" placeholder="Find dark trap drums at 140 BPM..." class="search-input">
                <button class="search-btn" id="searchBtn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="M21 21l-4.35-4.35"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="quick-filters">
              <button class="filter-chip active" data-filter="all">All</button>
              <button class="filter-chip" data-filter="recent">Recent</button>
              <button class="filter-chip" data-filter="popular">Popular</button>
              <button class="filter-chip" data-filter="recommended">AI Recommended</button>
            </div>
          </div>

          <div class="discovery-content">
            <div class="recommendations-section">
              <h3>🤖 AI Recommendations</h3>
              <div class="recommendations-grid" id="recommendationsGrid">
                <!-- Recommendations will be populated here -->
              </div>
            </div>

            <div class="search-results-section">
              <h3>🔍 Search Results</h3>
              <div class="search-results-grid" id="searchResultsGrid">
                <!-- Search results will be populated here -->
              </div>
            </div>
          </div>
        </div>

        <!-- Collections View -->
        <div class="sample-view" id="collectionsView">
          <div class="collections-header">
            <h3>📁 Sample Collections</h3>
            <button class="btn btn-primary btn-sm" id="createCollectionBtn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14"></path>
                <path d="M5 12h14"></path>
              </svg>
              New Collection
            </button>
          </div>

          <div class="collections-grid" id="collectionsGrid">
            <!-- Collections will be populated here -->
          </div>
        </div>

        <!-- AI Analysis View -->
        <div class="sample-view" id="analysisView">
          <div class="analysis-header">
            <h3>🧠 AI Analysis Dashboard</h3>
            <div class="analysis-stats">
              <div class="stat-item">
                <span class="stat-label">Samples Analyzed</span>
                <span class="stat-value" id="analyzedCount">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Queue Length</span>
                <span class="stat-value" id="queueLength">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Similarity Index</span>
                <span class="stat-value" id="similarityIndex">0</span>
              </div>
            </div>
          </div>

          <div class="analysis-content">
            <div class="analysis-charts">
              <div class="chart-container">
                <h4>Genre Distribution</h4>
                <div class="chart" id="genreChart"></div>
              </div>
              <div class="chart-container">
                <h4>Mood Distribution</h4>
                <div class="chart" id="moodChart"></div>
              </div>
              <div class="chart-container">
                <h4>Tempo Distribution</h4>
                <div class="chart" id="tempoChart"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Creative Tools View -->
        <div class="sample-view" id="toolsView">
          <div class="tools-header">
            <h3>🛠️ Creative Tools</h3>
          </div>

          <div class="tools-content">
            <div class="tool-section">
              <h4>🎵 Stem Separation</h4>
              <p>AI-powered stem separation to isolate drums, bass, vocals, and melody</p>
              <button class="btn btn-outline" id="stemSeparationBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18V5l12-2v13"></path>
                  <circle cx="6" cy="18" r="3"></circle>
                  <circle cx="18" cy="16" r="3"></circle>
                </svg>
                Separate Stems
              </button>
            </div>

            <div class="tool-section">
              <h4>✂️ Smart Chopping</h4>
              <p>Intelligent sample chopping with automatic transient detection</p>
              <button class="btn btn-outline" id="smartChoppingBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
                Chop Sample
              </button>
            </div>

            <div class="tool-section">
              <h4>🔄 Sample Morphing</h4>
              <p>Blend and morph between similar samples</p>
              <button class="btn btn-outline" id="sampleMorphingBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
                Morph Samples
              </button>
            </div>

            <div class="tool-section">
              <h4>🎯 Batch Processing</h4>
              <p>Process multiple samples simultaneously</p>
              <button class="btn btn-outline" id="batchProcessingBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"></path>
                  <rect x="9" y="3" width="6" height="8"></rect>
                </svg>
                Batch Process
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Insert the sample manager into the main content area
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.appendChild(container);
    }
  }

  setupEventListeners() {
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchView(e.target.dataset.view);
      });
    });

    // Search functionality
    document.getElementById('searchBtn')?.addEventListener('click', () => {
      this.performSearch();
    });

    document.getElementById('naturalLanguageSearch')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.performSearch();
      }
    });

    // Quick filters
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        this.applyFilter(e.target.dataset.filter);
      });
    });

    // Collection management
    document.getElementById('createCollectionBtn')?.addEventListener('click', () => {
      this.showCreateCollectionDialog();
    });

    // Creative tools
    document.getElementById('stemSeparationBtn')?.addEventListener('click', () => {
      this.showStemSeparationDialog();
    });

    document.getElementById('smartChoppingBtn')?.addEventListener('click', () => {
      this.showSmartChoppingDialog();
    });

    document.getElementById('sampleMorphingBtn')?.addEventListener('click', () => {
      this.showSampleMorphingDialog();
    });

    document.getElementById('batchProcessingBtn')?.addEventListener('click', () => {
      this.showBatchProcessingDialog();
    });

    // Refresh button
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
      this.refreshData();
    });
  }

  switchView(viewName) {
    // Update tab states
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

    // Update view states
    document.querySelectorAll('.sample-view').forEach(view => {
      view.classList.remove('active');
    });
    document.getElementById(`${viewName}View`).classList.add('active');

    this.currentView = viewName;

    // Load view-specific data
    this.loadViewData(viewName);
  }

  async loadViewData(viewName) {
    switch (viewName) {
      case 'discovery':
        await this.loadRecommendations();
        break;
      case 'collections':
        await this.loadCollections();
        break;
      case 'analysis':
        await this.loadAnalysisData();
        break;
      case 'tools':
        // Tools view doesn't need additional data loading
        break;
    }
  }

  async performSearch() {
    const query = document.getElementById('naturalLanguageSearch').value;
    if (!query.trim()) return;

    try {
      this.showLoading('Searching samples...');
      
      // Use natural language search for enhanced results
      const results = await window.electronAPI.sampleManager.naturalLanguageSearch(query);
      
      this.displaySearchResults(results);
      this.hideLoading();
      
    } catch (error) {
      console.error('Search failed:', error);
      this.showError('Search failed: ' + error.message);
      this.hideLoading();
    }
  }

  async simulateSearch(query) {
    // Simulate AI-powered search
    const mockResults = [
      {
        id: 1,
        name: 'Dark Trap Drums',
        genre: 'trap',
        mood: 'dark',
        tempo: 140,
        key: 'C minor',
        confidence: 0.95,
        reason: 'Matches "dark trap drums at 140 BPM"'
      },
      {
        id: 2,
        name: 'Aggressive 808',
        genre: 'trap',
        mood: 'aggressive',
        tempo: 142,
        key: 'F minor',
        confidence: 0.87,
        reason: 'Similar tempo and mood'
      },
      {
        id: 3,
        name: 'Heavy Kick Pattern',
        genre: 'trap',
        mood: 'dark',
        tempo: 138,
        key: 'G minor',
        confidence: 0.82,
        reason: 'Matching genre and mood'
      }
    ];

    return mockResults;
  }

  displaySearchResults(results) {
    const container = document.getElementById('searchResultsGrid');
    if (!container) return;

    container.innerHTML = results.map(result => `
      <div class="sample-card">
        <div class="sample-header">
          <h4>${result.name}</h4>
          <span class="confidence-badge">${Math.round(result.confidence * 100)}%</span>
        </div>
        <div class="sample-details">
          <div class="detail-item">
            <span class="label">Genre:</span>
            <span class="value">${result.genre}</span>
          </div>
          <div class="detail-item">
            <span class="label">Mood:</span>
            <span class="value">${result.mood}</span>
          </div>
          <div class="detail-item">
            <span class="label">Tempo:</span>
            <span class="value">${result.tempo} BPM</span>
          </div>
          <div class="detail-item">
            <span class="label">Key:</span>
            <span class="value">${result.key}</span>
          </div>
        </div>
        <div class="sample-actions">
          <button class="btn btn-primary btn-sm" onclick="sampleManager.previewSample(${result.id})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5,3 19,12 5,21"></polygon>
            </svg>
            Preview
          </button>
          <button class="btn btn-outline btn-sm" onclick="sampleManager.addToCollection(${result.id})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14"></path>
              <path d="M5 12h14"></path>
            </svg>
            Add
          </button>
        </div>
        <div class="ai-reason">
          <small>🤖 ${result.reason}</small>
        </div>
      </div>
    `).join('');
  }

  async loadRecommendations() {
    try {
      // Simulate loading recommendations
      const recommendations = [
        {
          id: 1,
          name: 'Cinematic Strings',
          genre: 'orchestral',
          mood: 'epic',
          tempo: 120,
          reason: 'Based on your recent orchestral selections'
        },
        {
          id: 2,
          name: 'Dark Ambient Pad',
          genre: 'ambient',
          mood: 'mysterious',
          tempo: 80,
          reason: 'Matches your current project mood'
        },
        {
          id: 3,
          name: 'Aggressive Trap Loop',
          genre: 'trap',
          mood: 'aggressive',
          tempo: 140,
          reason: 'Similar to your most used samples'
        }
      ];

      this.displayRecommendations(recommendations);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  }

  displayRecommendations(recommendations) {
    const container = document.getElementById('recommendationsGrid');
    if (!container) return;

    container.innerHTML = recommendations.map(rec => `
      <div class="recommendation-card">
        <div class="rec-header">
          <h4>${rec.name}</h4>
          <span class="ai-badge">AI</span>
        </div>
        <div class="rec-details">
          <span class="genre-tag">${rec.genre}</span>
          <span class="mood-tag">${rec.mood}</span>
          <span class="tempo-tag">${rec.tempo} BPM</span>
        </div>
        <div class="rec-reason">
          <small>🤖 ${rec.reason}</small>
        </div>
        <div class="rec-actions">
          <button class="btn btn-primary btn-sm" onclick="sampleManager.previewSample(${rec.id})">
            Preview
          </button>
          <button class="btn btn-outline btn-sm" onclick="sampleManager.addToCollection(${rec.id})">
            Add
          </button>
        </div>
      </div>
    `).join('');
  }

  async loadCollections() {
    try {
      // Simulate loading collections
      const collections = [
        {
          id: 1,
          name: 'Dark Trap Collection',
          description: 'Aggressive trap samples for dark beats',
          sampleCount: 45,
          isSmart: false
        },
        {
          id: 2,
          name: 'AI Recommended',
          description: 'Samples recommended by AI based on your preferences',
          sampleCount: 23,
          isSmart: true
        },
        {
          id: 3,
          name: 'Recent Favorites',
          description: 'Your most recently used samples',
          sampleCount: 12,
          isSmart: true
        }
      ];

      this.displayCollections(collections);
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  }

  displayCollections(collections) {
    const container = document.getElementById('collectionsGrid');
    if (!container) return;

    container.innerHTML = collections.map(collection => `
      <div class="collection-card">
        <div class="collection-header">
          <h4>${collection.name}</h4>
          ${collection.isSmart ? '<span class="smart-badge">Smart</span>' : ''}
        </div>
        <div class="collection-description">
          <p>${collection.description}</p>
        </div>
        <div class="collection-stats">
          <span class="stat">${collection.sampleCount} samples</span>
        </div>
        <div class="collection-actions">
          <button class="btn btn-primary btn-sm" onclick="sampleManager.openCollection(${collection.id})">
            Open
          </button>
          <button class="btn btn-outline btn-sm" onclick="sampleManager.editCollection(${collection.id})">
            Edit
          </button>
        </div>
      </div>
    `).join('');
  }

  async loadAnalysisData() {
    try {
      // Simulate loading analysis data
      const analytics = {
        analyzedSamples: 1250,
        queueLength: 5,
        similarityIndex: 1000,
        genreDistribution: [
          { genre: 'trap', count: 450 },
          { genre: 'hip hop', count: 320 },
          { genre: 'electronic', count: 280 },
          { genre: 'ambient', count: 200 }
        ],
        moodDistribution: [
          { mood: 'dark', count: 380 },
          { mood: 'aggressive', count: 320 },
          { mood: 'bright', count: 280 },
          { mood: 'calm', count: 270 }
        ],
        tempoDistribution: [
          { range: '60-80 BPM', count: 150 },
          { range: '80-120 BPM', count: 400 },
          { range: '120-160 BPM', count: 500 },
          { range: '160+ BPM', count: 200 }
        ]
      };

      this.displayAnalysisData(analytics);
    } catch (error) {
      console.error('Failed to load analysis data:', error);
    }
  }

  displayAnalysisData(analytics) {
    // Update stats
    document.getElementById('analyzedCount').textContent = analytics.analyzedSamples;
    document.getElementById('queueLength').textContent = analytics.queueLength;
    document.getElementById('similarityIndex').textContent = analytics.similarityIndex;

    // Display charts (simplified)
    this.displayGenreChart(analytics.genreDistribution);
    this.displayMoodChart(analytics.moodDistribution);
    this.displayTempoChart(analytics.tempoDistribution);
  }

  displayGenreChart(data) {
    const container = document.getElementById('genreChart');
    if (!container) return;

    container.innerHTML = data.map(item => `
      <div class="chart-bar">
        <div class="bar-label">${item.genre}</div>
        <div class="bar-container">
          <div class="bar-fill" style="width: ${(item.count / Math.max(...data.map(d => d.count))) * 100}%"></div>
        </div>
        <div class="bar-value">${item.count}</div>
      </div>
    `).join('');
  }

  displayMoodChart(data) {
    const container = document.getElementById('moodChart');
    if (!container) return;

    container.innerHTML = data.map(item => `
      <div class="chart-bar">
        <div class="bar-label">${item.mood}</div>
        <div class="bar-container">
          <div class="bar-fill" style="width: ${(item.count / Math.max(...data.map(d => d.count))) * 100}%"></div>
        </div>
        <div class="bar-value">${item.count}</div>
      </div>
    `).join('');
  }

  displayTempoChart(data) {
    const container = document.getElementById('tempoChart');
    if (!container) return;

    container.innerHTML = data.map(item => `
      <div class="chart-bar">
        <div class="bar-label">${item.range}</div>
        <div class="bar-container">
          <div class="bar-fill" style="width: ${(item.count / Math.max(...data.map(d => d.count))) * 100}%"></div>
        </div>
        <div class="bar-value">${item.count}</div>
      </div>
    `).join('');
  }

  // Dialog Methods
  showCreateCollectionDialog() {
    // Show create collection dialog
    console.log('Showing create collection dialog');
  }

  showStemSeparationDialog() {
    // Show stem separation dialog
    console.log('Showing stem separation dialog');
  }

  showSmartChoppingDialog() {
    // Show smart chopping dialog
    console.log('Showing smart chopping dialog');
  }

  showSampleMorphingDialog() {
    // Show sample morphing dialog
    console.log('Showing sample morphing dialog');
  }

  showBatchProcessingDialog() {
    // Show batch processing dialog
    console.log('Showing batch processing dialog');
  }

  // Action Methods
  previewSample(sampleId) {
    console.log('Previewing sample:', sampleId);
    // Implement sample preview
  }

  addToCollection(sampleId) {
    console.log('Adding sample to collection:', sampleId);
    // Implement add to collection
  }

  openCollection(collectionId) {
    console.log('Opening collection:', collectionId);
    // Implement open collection
  }

  editCollection(collectionId) {
    console.log('Editing collection:', collectionId);
    // Implement edit collection
  }

  applyFilter(filter) {
    // Update filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

    // Apply filter logic
    console.log('Applying filter:', filter);
  }

  async refreshData() {
    try {
      this.showLoading('Refreshing data...');
      await this.loadInitialData();
      await this.loadViewData(this.currentView);
      this.hideLoading();
    } catch (error) {
      console.error('Failed to refresh data:', error);
      this.showError('Failed to refresh data: ' + error.message);
      this.hideLoading();
    }
  }

  // Utility Methods
  showLoading(message = 'Loading...') {
    // Show loading indicator
    console.log('Loading:', message);
  }

  hideLoading() {
    // Hide loading indicator
    console.log('Loading complete');
  }

  showError(message) {
    // Show error message
    console.error('Error:', message);
  }

  // Simulated API methods
  async getCollections() {
    return [];
  }

  async getRecommendations() {
    return [];
  }

  async getRecentSamples() {
    return [];
  }
}

// Initialize sample manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.sampleManager = new SampleManager();
  window.sampleManager.initialize();
});
