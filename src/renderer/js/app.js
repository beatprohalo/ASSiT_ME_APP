// Main app functionality
class MusicOrganizerApp {
  // Helper function to get file extension
  getFileExtension(filePath) {
    if (!filePath) return '';
    const lastDot = filePath.lastIndexOf('.');
    if (lastDot === -1) return '';
    return filePath.substring(lastDot).toLowerCase();
  }
  constructor() {
    this.currentFilter = 'all'; // Default to showing all files
    this.scanResults = [];
    this.isScanning = false;
    this.selectedPath = null;
    this.scanHistory = [];
    this.recentLocations = [];
    this.progressManager = null;
    this.autoOrganizer = null;
    this.scanStats = null;
    this.favoriteLocations = [];
    this.analysisParameters = null;
    this.analysisStats = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadInitialData();
  }

  setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // File/Folder/Drive selection
    const selectFolderBtn = document.getElementById('selectFolderBtn');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const selectDriveBtn = document.getElementById('selectDriveBtn');
    
    console.log('Buttons found:', {
      selectFolderBtn: !!selectFolderBtn,
      selectFileBtn: !!selectFileBtn,
      selectDriveBtn: !!selectDriveBtn
    });
    
    if (selectFolderBtn) {
      selectFolderBtn.addEventListener('click', () => {
        console.log('Select folder button clicked');
        this.selectFolder();
      });
    }
    
    if (selectFileBtn) {
      selectFileBtn.addEventListener('click', () => {
        console.log('Select files button clicked');
        this.selectFiles();
      });
    }
    
    if (selectDriveBtn) {
      selectDriveBtn.addEventListener('click', () => {
        console.log('Select drive button clicked');
        this.selectDrive();
      });
    }

    // Clear selected path
    document.getElementById('clearPathBtn').addEventListener('click', () => {
      this.clearSelectedPath();
    });

    // Filter options
    document.querySelectorAll('.filter-option').forEach(option => {
      option.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-option').forEach(opt => opt.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentFilter = e.currentTarget.dataset.filter;
        this.filterResults();
      });
    });

    // Scan button
    document.getElementById('scanBtn').addEventListener('click', () => {
      this.startScan();
    });

    // Stop button
    document.getElementById('stopBtn').addEventListener('click', () => {
      this.stopScan();
    });

    // Clear results button
    document.getElementById('clearBtn').addEventListener('click', () => {
      this.clearResults();
    });

    // Clear all results button
    document.getElementById('clearAllBtn').addEventListener('click', () => {
      this.clearResults();
    });

    // Deep scan checkbox
    document.getElementById('deepScan').addEventListener('change', (e) => {
      console.log('Deep scan:', e.target.checked);
    });
  }

  async loadInitialData() {
    try {
      // Hide filter section initially - NEVER show it on startup
      const filterSection = document.querySelector('.filter-section');
      if (filterSection) {
        filterSection.style.display = 'none';
      }
      
      // Start with blank state - don't load existing tracks
      this.scanResults = [];
      
      // Always hide filter section on startup - only show after new scan
      // Reset filter to "all" on startup
      this.currentFilter = 'all';
      document.querySelectorAll('.filter-option').forEach(opt => opt.classList.remove('active'));
      const allFilter = document.querySelector('[data-filter="all"]');
      if (allFilter) allFilter.classList.add('active');
      
      // Load scan history
      await this.loadScanHistory();
      
      // Show empty state message
      this.displayResults();
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }

  setupProgressListener() {
    // Listen for scan progress updates
    window.electronAPI.onScanProgress((progress) => {
      this.updateProgressDisplay(progress);
    });
  }

  updateProgressDisplay(progress) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if (progressBar) {
      progressBar.style.width = `${progress.percentage}%`;
    }
    
    if (progressText) {
      progressText.textContent = `${progress.filesProcessed} files processed (${progress.percentage}%)`;
    }
  }

  // Advanced Audio Analysis Methods
  async analyzeFileAdvanced(filePath, options = {}) {
    try {
      console.log(`🎵 Starting advanced analysis of: ${filePath}`);
      const analysis = await window.electronAPI.analyzeAudioAdvanced(filePath, options);
      console.log('✅ Advanced analysis complete:', analysis);
      return analysis;
    } catch (error) {
      console.error('Error in advanced analysis:', error);
      return { error: error.message };
    }
  }

  async analyzeFileAI(audioData, options = {}) {
    try {
      console.log('🧠 Starting AI analysis...');
      const analysis = await window.electronAPI.analyzeAudioAI(audioData, options);
      console.log('✅ AI analysis complete:', analysis);
      return analysis;
    } catch (error) {
      console.error('Error in AI analysis:', error);
      return { error: error.message };
    }
  }

  async analyzeBatchAdvanced(filePaths, options = {}) {
    try {
      console.log(`🎵 Starting batch advanced analysis of ${filePaths.length} files`);
      const results = await window.electronAPI.analyzeBatchAdvanced(filePaths, options);
      console.log('✅ Batch advanced analysis complete');
      return results;
    } catch (error) {
      console.error('Error in batch advanced analysis:', error);
      return { error: error.message };
    }
  }

  async analyzeBatchAI(audioDataList, options = {}) {
    try {
      console.log(`🧠 Starting batch AI analysis of ${audioDataList.length} files`);
      const results = await window.electronAPI.analyzeBatchAI(audioDataList, options);
      console.log('✅ Batch AI analysis complete');
      return results;
    } catch (error) {
      console.error('Error in batch AI analysis:', error);
      return { error: error.message };
    }
  }

  async getAnalysisParameters() {
    try {
      return await window.electronAPI.getAnalysisParameters();
    } catch (error) {
      console.error('Error getting analysis parameters:', error);
      return null;
    }
  }

  async updateAnalysisParameters(parameters) {
    try {
      return await window.electronAPI.updateAnalysisParameters(parameters);
    } catch (error) {
      console.error('Error updating analysis parameters:', error);
      return { success: false, error: error.message };
    }
  }

  async getAnalysisStats() {
    try {
      return await window.electronAPI.getAnalysisStats();
    } catch (error) {
      console.error('Error getting analysis stats:', error);
      return null;
    }
  }

  async clearAnalysisCache() {
    try {
      return await window.electronAPI.clearAnalysisCache();
    } catch (error) {
      console.error('Error clearing analysis cache:', error);
      return { success: false, error: error.message };
    }
  }

  // Enhanced file analysis with both advanced and AI analysis
  async analyzeFileComprehensive(filePath, options = {}) {
    try {
      console.log(`🔍 Starting comprehensive analysis of: ${filePath}`);
      
      // Get basic metadata first
      const metadata = await this.getFileMetadata(filePath);
      
      // Perform advanced analysis
      const advancedAnalysis = await this.analyzeFileAdvanced(filePath, options.advanced || {});
      
      // Perform AI analysis on the advanced results
      const aiAnalysis = await this.analyzeFileAI(advancedAnalysis, options.ai || {});
      
      // Combine results
      const comprehensiveResults = {
        filePath,
        metadata,
        advancedAnalysis,
        aiAnalysis,
        timestamp: new Date().toISOString(),
        summary: this.generateComprehensiveSummary(advancedAnalysis, aiAnalysis)
      };
      
      console.log('✅ Comprehensive analysis complete');
      return comprehensiveResults;
      
    } catch (error) {
      console.error('Error in comprehensive analysis:', error);
      return { error: error.message };
    }
  }

  generateComprehensiveSummary(advancedAnalysis, aiAnalysis) {
    const summary = {
      overallScore: 0,
      strengths: [],
      weaknesses: [],
      recommendations: [],
      tags: [],
      confidence: 0
    };

    // Calculate overall score
    let score = 0;
    let factors = 0;

    if (advancedAnalysis.spectralAnalysis) {
      score += 0.2;
      factors++;
    }

    if (advancedAnalysis.harmonicAnalysis) {
      score += 0.2;
      factors++;
    }

    if (advancedAnalysis.rhythmAnalysis) {
      score += 0.2;
      factors++;
    }

    if (aiAnalysis.mood) {
      score += 0.2;
      factors++;
      summary.tags.push(aiAnalysis.mood.primary.name);
    }

    if (aiAnalysis.genre) {
      score += 0.2;
      factors++;
      summary.tags.push(aiAnalysis.genre.primary.name);
    }

    summary.overallScore = factors > 0 ? score / factors : 0;

    // Add AI-generated tags
    if (aiAnalysis.smartTags) {
      summary.tags.push(...aiAnalysis.smartTags);
    }

    // Add recommendations
    if (aiAnalysis.recommendations) {
      summary.recommendations.push(...aiAnalysis.recommendations);
    }

    // Remove duplicates
    summary.tags = [...new Set(summary.tags)];

    return summary;
  }

  async getFileMetadata(filePath) {
    // This would typically extract basic file metadata
    // For now, return a mock structure
    return {
      fileName: filePath.split('/').pop(),
      filePath: filePath,
      size: 0, // Would be filled by actual file stats
      format: filePath.split('.').pop().toLowerCase(),
      duration: null,
      bitrate: null,
      sampleRate: null,
      channels: null
    };
  }

  // Handle advanced scan results
  async handleAdvancedScanResults(results) {
    try {
      console.log('🔍 Handling advanced scan results:', results);
      
      if (results && results.tracks) {
        this.scanResults = results.tracks;
        this.displayResults();
        
        // Show scan summary
        this.displayScanSummary({
          totalFiles: results.tracks.length,
          audioFiles: results.tracks.filter(t => ['wav', 'mp3', 'aiff', 'aif', 'flac', 'm4a', 'ogg', 'wma', 'aac'].includes(t.format)).length,
          midiFiles: results.tracks.filter(t => ['mid', 'midi'].includes(t.format)).length,
          projectFiles: results.projects ? results.projects.length : 0,
          errors: results.errors || []
        });
        
        console.log('✅ Advanced scan results processed successfully');
        return { success: true };
      } else {
        console.error('❌ Invalid scan results received');
        return { success: false, error: 'Invalid scan results' };
      }
    } catch (error) {
      console.error('❌ Error handling advanced scan results:', error);
      this.showError(`Error processing scan results: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  displayScanSummary(scanData) {
    console.log('Displaying scan summary:', scanData);
    
    // Create or update scan summary display
    let summaryElement = document.getElementById('scanSummary');
    if (!summaryElement) {
      summaryElement = document.createElement('div');
      summaryElement.id = 'scanSummary';
      summaryElement.className = 'scan-summary';
      document.querySelector('.results-section').insertBefore(summaryElement, document.querySelector('.results-list'));
    }
    
    summaryElement.innerHTML = `
      <div class="summary-header">
        <h3>Scan Summary</h3>
        <button id="closeSummary" class="close-btn">&times;</button>
      </div>
      <div class="summary-content">
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-label">Total Files:</span>
            <span class="stat-value">${scanData.totalFiles}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Audio Files:</span>
            <span class="stat-value">${scanData.audioFiles}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">MIDI Files:</span>
            <span class="stat-value">${scanData.midiFiles}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Project Files:</span>
            <span class="stat-value">${scanData.projectFiles}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Duration:</span>
            <span class="stat-value">${Math.round(scanData.duration / 1000)}s</span>
          </div>
        </div>
        ${scanData.errors.length > 0 ? `
          <div class="summary-errors">
            <h4>Errors (${scanData.errors.length}):</h4>
            <ul>
              ${scanData.errors.slice(0, 5).map(error => `<li>${error}</li>`).join('')}
              ${scanData.errors.length > 5 ? `<li>... and ${scanData.errors.length - 5} more</li>` : ''}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
    
    // Add close button functionality
    document.getElementById('closeSummary').addEventListener('click', () => {
      summaryElement.remove();
    });
  }

  async loadScanHistory() {
    try {
      const history = await window.electronAPI.getScanHistory();
      this.scanHistory = history;
      console.log('Loaded scan history:', history);
    } catch (error) {
      console.error('Error loading scan history:', error);
    }
  }

  async selectFolder() {
    try {
      console.log('Selecting folder...');
      
      // Show the advanced scan dialog instead of direct folder selection
      if (window.ScanDialog) {
        const scanDialog = new window.ScanDialog();
        scanDialog.show();
        return;
      }
      
      if (!window.electronAPI) {
        this.showError('Electron API not available. Please restart the app.');
        return;
      }
      
      const result = await window.electronAPI.selectFolder();
      console.log('Folder selection result:', result);
      
      if (result && result.length > 0) {
        this.selectedPath = result[0];
        this.showSelectedPath();
        console.log('Selected folder:', this.selectedPath);
      } else {
        console.log('No folder selected');
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      this.showError('Failed to select folder: ' + error.message);
    }
  }

  async selectFiles() {
    try {
      console.log('Selecting files...');
      
      if (!window.electronAPI) {
        this.showError('Electron API not available. Please restart the app.');
        return;
      }
      
      const result = await window.electronAPI.selectFiles();
      console.log('File selection result:', result);
      
      if (result && result.length > 0) {
        this.selectedPath = result;
        this.showSelectedPath();
        console.log('Selected files:', this.selectedPath);
      } else {
        console.log('No files selected');
      }
    } catch (error) {
      console.error('Error selecting files:', error);
      this.showError('Failed to select files: ' + error.message);
    }
  }

  async selectDrive() {
    try {
      console.log('Selecting drive...');
      
      if (!window.electronAPI) {
        this.showError('Electron API not available. Please restart the app.');
        return;
      }
      
      const result = await window.electronAPI.selectDrive();
      console.log('Drive selection result:', result);
      
      if (result && result.length > 0) {
        this.selectedPath = result[0];
        this.showSelectedPath();
        console.log('Selected drive:', this.selectedPath);
      } else {
        console.log('No drive selected');
      }
    } catch (error) {
      console.error('Error selecting drive:', error);
      this.showError('Failed to select drive: ' + error.message);
    }
  }

  showSelectedPath() {
    const selectedPathDiv = document.getElementById('selectedPath');
    const pathText = document.getElementById('pathText');
    
    if (Array.isArray(this.selectedPath)) {
      pathText.textContent = `${this.selectedPath.length} files selected`;
    } else {
      pathText.textContent = this.selectedPath;
    }
    
    selectedPathDiv.style.display = 'block';
  }

  clearSelectedPath() {
    this.selectedPath = null;
    document.getElementById('selectedPath').style.display = 'none';
  }

  async startScan() {
    if (this.isScanning) return;
    
    if (!this.selectedPath) {
      this.showError('Please select a folder, files, or drive to scan first.');
      return;
    }

    this.isScanning = true;
    this.updateScanUI(true);
    
    try {
      // Show progress section
      document.getElementById('progressSection').style.display = 'block';
      
      // Get scan settings
      const deepScan = document.getElementById('deepScan').checked;
      
      // Enhanced scan with progress tracking and history
      const scanOptions = {
        estimatedFiles: 0,
        enableProgress: true,
        enableHistory: true,
        enableAutoOrganization: false,
        deepScan: deepScan
      };

      // Set up progress listener
      this.setupProgressListener();
      
      // Call the enhanced scan function
      const result = await window.electronAPI.scanFolder(this.selectedPath, scanOptions);
      
      if (result.success) {
        console.log('Enhanced scan completed, results:', result.results);
        
        // Handle different result formats
        if (result.results && result.results.tracks) {
          this.scanResults = result.results.tracks;
        } else if (Array.isArray(result.results)) {
          this.scanResults = result.results;
        } else {
          this.scanResults = [];
        }
        
        console.log('Final scan results:', this.scanResults);
        this.displayResults();
        
        // Show scan summary if available
        if (result.scanData) {
          this.displayScanSummary(result.scanData);
        }
        
        // Show clear buttons if we have results
        if (this.scanResults.length > 0) {
          const clearBtn = document.getElementById('clearBtn');
          const clearAllBtn = document.getElementById('clearAllBtn');
          if (clearBtn) clearBtn.style.display = 'inline-flex';
          if (clearAllBtn) clearAllBtn.style.display = 'flex';
          
          // Show filter section after scan is complete
          const filterSection = document.querySelector('.filter-section');
          if (filterSection) {
            filterSection.style.display = 'block';
          }
          
          // Reset filter to "all" and activate it
          this.currentFilter = 'all';
          document.querySelectorAll('.filter-option').forEach(opt => opt.classList.remove('active'));
          const allFilter = document.querySelector('[data-filter="all"]');
          if (allFilter) allFilter.classList.add('active');
        }
      } else if (result.cancelled) {
        console.log('Scan cancelled by user');
      } else {
        console.error('Scan failed:', result.error);
        this.showError('Scan failed: ' + result.error);
      }
      
      // Update progress text
      const progressText = document.getElementById('progressText');
      if (progressText) {
        progressText.textContent = `Scan complete! Found ${this.scanResults.length} files`;
      }
      
    } catch (error) {
      console.error('Scan error:', error);
      this.showError('Scan failed: ' + error.message);
    } finally {
      this.isScanning = false;
      this.updateScanUI(false);
    }
  }

  async simulateScanProgress() {
    const mainProgress = document.getElementById('mainProgress');
    const secondaryProgress = document.getElementById('secondaryProgress');
    const progressText = document.getElementById('progressText');
    
    // Simulate main progress
    for (let i = 0; i <= 100; i += 2) {
      mainProgress.style.width = i + '%';
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Simulate secondary progress
    for (let i = 0; i <= 100; i += 5) {
      secondaryProgress.style.width = i + '%';
      progressText.textContent = `Scanning files... ${i}% complete`;
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    
    progressText.textContent = 'Scan complete! Found 12 of 150 files (logic filter)';
  }

  async performScan(selectedPath, deepScan) {
    try {
      console.log('Starting scan of:', selectedPath);
      
      // Call the actual scan function from the main process
      const result = await window.electronAPI.scanFolder(selectedPath);
      console.log('Scan result:', result);
      
      if (result.success) {
        return result.results;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Scan error:', error);
      throw error;
    }
  }

  getMockScanResults() {
    return {
      tracks: [
        {
          id: 1,
          fileName: 'Live_Recording.logic',
          filePath: '/Volumes/T7/Music/Live_Recording.logic',
          fileSize: '30.2 MB',
          type: 'Logic Pro Project',
          details: 'Logic Pro Project - 12 tracks, 7 plugins',
          category: 'DAW Project',
          format: 'logic'
        },
        {
          id: 2,
          fileName: 'Studio_Session.alp',
          filePath: '/Volumes/T7/Music/Studio_Session.alp',
          fileSize: '45.8 MB',
          type: 'Ableton Live Pack',
          details: 'Ableton Live Pack - 8 tracks, 15 plugins',
          category: 'DAW Project',
          format: 'ableton'
        },
        {
          id: 3,
          fileName: 'Beat_Production.cpr',
          filePath: '/Volumes/T7/Music/Beat_Production.cpr',
          fileSize: '22.1 MB',
          type: 'Cubase Project',
          details: 'Cubase Project - 6 tracks, 4 plugins',
          category: 'DAW Project',
          format: 'cubase'
        }
      ]
    };
  }

  stopScan() {
    this.isScanning = false;
    this.updateScanUI(false);
    document.getElementById('progressSection').style.display = 'none';
  }

  clearResults() {
    console.log('Clearing scan results...');
    this.scanResults = [];
    this.selectedPath = null;
    
    // Clear the results display using new category system
    document.getElementById('emptyState').style.display = 'block';
    this.hideAllCategories();
    
    // Hide the clear buttons
    const clearBtn = document.getElementById('clearBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearBtn) clearBtn.style.display = 'none';
    if (clearAllBtn) clearAllBtn.style.display = 'none';
    
    // Hide the filter section
    const filterSection = document.querySelector('.filter-section');
    if (filterSection) {
      filterSection.style.display = 'none';
    }
    
    // Clear the selected path display
    const selectedPathDiv = document.getElementById('selectedPath');
    if (selectedPathDiv) {
      selectedPathDiv.style.display = 'none';
    }
    
    // Reset filter to default
    this.currentFilter = 'all';
    document.querySelectorAll('.filter-option').forEach(opt => opt.classList.remove('active'));
    document.querySelector('[data-filter="all"]').classList.add('active');
    
    console.log('Results cleared');
  }

  updateScanUI(scanning) {
    const scanBtn = document.getElementById('scanBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    scanBtn.disabled = scanning;
    stopBtn.disabled = !scanning;
    
    if (scanning) {
      scanBtn.innerHTML = `
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
        </svg>
        Scanning...
      `;
    } else {
      scanBtn.innerHTML = `
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="M21 21l-4.35-4.35"></path>
        </svg>
        Scan for Music
      `;
    }
  }

  filterResults() {
    if (this.currentFilter === 'all') {
      this.displayResults();
      return;
    }

    const filteredResults = this.scanResults.filter(result => {
      const format = result.format ? result.format.toLowerCase() : '';
      const fileName = result.file_name || result.fileName || '';
      const filePath = result.file_path || result.filePath || '';
      
      // Get file extension from path
      const ext = this.getFileExtension(filePath);
      
      switch (this.currentFilter) {
        case 'audio':
          return ['wav', 'mp3', 'aiff', 'aif', 'flac', 'm4a', 'wma', 'ogg', 'aac'].includes(format) || 
                 ['.wav', '.mp3', '.aiff', '.aif', '.flac', '.m4a', '.wma', '.ogg', '.aac'].includes(ext);
        case 'wav':
          return format === 'wav' || ext === '.wav';
        case 'mp3':
          return format === 'mp3' || ext === '.mp3';
        case 'aiff':
          return format === 'aiff' || format === 'aif' || ext === '.aiff' || ext === '.aif';
        case 'flac':
          return format === 'flac' || ext === '.flac';
        case 'm4a':
          return format === 'm4a' || ext === '.m4a';
        case 'logic':
          return format === 'logic' || format === 'logicx' || ext === '.logic' || ext === '.logicx' || fileName.toLowerCase().includes('.logic');
        case 'protools':
          return ['ptx', 'ptf'].includes(format) || ['.ptx', '.ptf'].includes(ext);
        case 'studioone':
          return format === 'song' || ext === '.song'; // Studio One project files
        case 'cubase':
          return format === 'cpr' || ext === '.cpr';
        case 'flstudio':
          return format === 'flp' || ext === '.flp'; // FL Studio project files
        case 'ableton':
          return ['als', 'alp'].includes(format) || ['.als', '.alp'].includes(ext);
        case 'midi':
          return ['mid', 'midi'].includes(format);
        default:
          return true;
      }
    });
    
    console.log(`Filtered ${filteredResults.length} results for filter: ${this.currentFilter}`);
    this.displayResults(filteredResults);
  }

  displayResults(results = null) {
    const resultsContainer = document.getElementById('resultsContainer');
    const displayResults = results || this.scanResults;
    
    console.log('Displaying results:', displayResults);
    
    if (!displayResults || displayResults.length === 0) {
      document.getElementById('emptyState').style.display = 'block';
      this.hideAllCategories();
      return;
    }

    // Hide empty state
    document.getElementById('emptyState').style.display = 'none';
    
    // Categorize results
    const categories = this.categorizeResults(displayResults);
    
    // Update each category
    this.updateCategory('audioCategory', categories.audio, 'audioFiles');
    this.updateCategory('midiCategory', categories.midi, 'midiFiles');
    this.updateCategory('logicCategory', categories.logic, 'logicFiles');
    this.updateCategory('dawCategory', categories.daw, 'dawFiles');
  }

  categorizeResults(results) {
    const categories = {
      audio: [],
      midi: [],
      logic: [],
      daw: []
    };
    
    results.forEach(result => {
      const format = result.format ? result.format.toLowerCase() : '';
      const fileName = result.file_name || result.fileName || '';
      const filePath = result.file_path || result.filePath || '';
      const ext = this.getFileExtension(filePath);
      
      // Categorize based on file type
      if (['mid', 'midi', 'kar', 'rmi'].includes(format) || ['.mid', '.midi', '.kar', '.rmi'].includes(ext)) {
        categories.midi.push(result);
      } else if (format === 'logic' || format === 'logicx' || ext === '.logic' || ext === '.logicx') {
        categories.logic.push(result);
      } else if (['als', 'alp', 'cpr', 'ptx', 'ptf', 'song', 'flp'].includes(format) || 
                 ['.als', '.alp', '.cpr', '.ptx', '.ptf', '.song', '.flp'].includes(ext)) {
        categories.daw.push(result);
      } else if (['wav', 'mp3', 'aiff', 'aif', 'flac', 'm4a', 'm4b', 'm4p', 'aac', 'ogg', 'wma', 'opus', 'wv', 'ape', 'tta', 'tak', 'ofr', 'ofs', 'off', 'rka', '3ga', 'aa', 'aax', 'act', 'alac', 'amr', 'au', 'awb', 'dct', 'dss', 'dvf', 'gsm', 'iklax', 'ivs', 'ivx', 'mmf', 'mpc', 'msv', 'nmf', 'oga', 'mogg', 'ra', 'rm', 'raw', 'rf64', 'sln', 'voc', 'vox', 'webm', '8svx', 'cda'].includes(format) ||
                 ['.wav', '.mp3', '.aiff', '.aif', '.flac', '.m4a', '.m4b', '.m4p', '.aac', '.ogg', '.wma', '.opus', '.wv', '.ape', '.tta', '.tak', '.ofr', '.ofs', '.off', '.rka', '.3ga', '.aa', '.aax', '.act', '.alac', '.amr', '.au', '.awb', '.dct', '.dss', '.dvf', '.gsm', '.iklax', '.ivs', '.ivx', '.mmf', '.mpc', '.msv', '.nmf', '.oga', '.mogg', '.ra', '.rm', '.raw', '.rf64', '.sln', '.voc', '.vox', '.webm', '.8svx', '.cda'].includes(ext)) {
        categories.audio.push(result);
      }
    });
    
    return categories;
  }

  updateCategory(categoryId, files, contentId) {
    const categoryElement = document.getElementById(categoryId);
    const countElement = document.getElementById(categoryId.replace('Category', 'Count'));
    const contentElement = document.getElementById(contentId);
    
    if (files.length > 0) {
      categoryElement.style.display = 'block';
      countElement.textContent = files.length;
      
      // Create filters for this category
      const filtersHtml = this.createCategoryFilters(categoryId, files);
      
      // Populate files with filters
      contentElement.innerHTML = filtersHtml + files.map(file => this.createFileItem(file)).join('');
      
      // Add event listeners for category filters
      this.setupCategoryFilters(categoryId, files, contentId);
    } else {
      categoryElement.style.display = 'none';
    }
  }

  setupCategoryFilters(categoryId, allFiles, contentId) {
    const filterButtons = document.querySelectorAll(`[data-category="${categoryId}"]`);
    const contentElement = document.getElementById(contentId);
    
    filterButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all buttons in this category
        filterButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Get the filter type and value
        const filterType = button.dataset.filter;
        const filterValue = button.dataset.value;
        
        // Filter files based on filter type
        let filteredFiles = allFiles;
        if (filterType === 'format') {
          filteredFiles = allFiles.filter(file => 
            (file.format || '').toLowerCase() === filterValue
          );
        } else if (filterType === 'type') {
          filteredFiles = allFiles.filter(file => {
            const isLoop = this.detectLoop(file);
            const sampleType = isLoop ? 'loop' : 'oneshot';
            return sampleType === filterValue;
          });
        } else if (filterType === 'mood') {
          filteredFiles = allFiles.filter(file => {
            const fileName = (file.file_name || file.fileName || '').toLowerCase();
            if (filterValue === 'dark') {
              return fileName.includes('dark') || fileName.includes('evil');
            } else if (filterValue === 'bright') {
              return fileName.includes('bright') || fileName.includes('happy');
            } else if (filterValue === 'chill') {
              return fileName.includes('chill') || fileName.includes('ambient');
            }
            return false;
          });
        }
        // If filterType is 'all', show all files (no filtering)
        
        // Update the file list (skip the filters div)
        const fileList = contentElement.querySelector('.file-list') || contentElement;
        const fileItems = filteredFiles.map(file => this.createFileItem(file)).join('');
        
        // Update only the file items, keep the filters
        const existingFilters = contentElement.querySelector('.category-filters');
        contentElement.innerHTML = existingFilters.outerHTML + fileItems;
        
        // Re-setup filters for the new content
        this.setupCategoryFilters(categoryId, allFiles, contentId);
      });
    });
  }

  createFileItem(file) {
    const fileName = file.file_name || file.fileName || 'Unknown';
    const format = file.format || 'Unknown';
    const fileSize = this.formatFileSize(file.file_size || file.fileSize);
    
    // Get file type display name
    let typeDisplay = format.toUpperCase();
    if (file.type) {
      typeDisplay = file.type;
    } else if (format === 'logic' || format === 'logicx') {
      typeDisplay = 'Logic Pro Project';
    } else if (format === 'als' || format === 'alp') {
      typeDisplay = 'Ableton Live Project';
    } else if (format === 'cpr') {
      typeDisplay = 'Cubase Project';
    } else if (format === 'ptx' || format === 'ptf') {
      typeDisplay = 'Pro Tools Project';
    } else if (['mid', 'midi', 'kar', 'rmi'].includes(format)) {
      typeDisplay = 'MIDI File';
    } else if (['wav', 'mp3', 'aiff', 'aif', 'flac', 'm4a', 'm4b', 'm4p', 'aac', 'ogg', 'wma', 'opus', 'wv', 'ape', 'tta', 'tak', 'ofr', 'ofs', 'off', 'rka', '3ga', 'aa', 'aax', 'act', 'alac', 'amr', 'au', 'awb', 'dct', 'dss', 'dvf', 'gsm', 'iklax', 'ivs', 'ivx', 'mmf', 'mpc', 'msv', 'nmf', 'oga', 'mogg', 'ra', 'rm', 'raw', 'rf64', 'sln', 'voc', 'vox', 'webm', '8svx', 'cda'].includes(format)) {
      typeDisplay = 'Audio File';
    }
    
    // Get duration if available
    let durationDisplay = '';
    if (file.duration) {
      const minutes = Math.floor(file.duration / 60);
      const seconds = Math.floor(file.duration % 60);
      durationDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Detect if it's a loop or one-shot based on duration and name
    const isLoop = this.detectLoop(file);
    const sampleType = isLoop ? 'LOOP' : 'ONE-SHOT';
    const sampleTypeClass = isLoop ? 'loop-tag' : 'oneshot-tag';
    
    return `
      <div class="file-item" data-file-path="${file.filePath || file.file_path}" onclick="app.showTaggingPrompt('${file.filePath || file.file_path}', '${fileName}')">
        <div class="file-header">
          <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${this.getFileIcon(format)}
              </svg>
          <div class="file-type-badge ${sampleTypeClass}">${sampleType}</div>
          </div>
        <div class="file-info">
          <div class="file-name" title="${fileName}">${fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName}</div>
          <div class="file-details">
            <span class="file-format">${typeDisplay}</span>
            <span class="file-size">${fileSize}</span>
            ${durationDisplay ? `<span class="file-duration">${durationDisplay}</span>` : ''}
        </div>
          <div class="file-tags">
            ${this.generateAutoTags(file)}
          </div>
          </div>
          </div>
    `;
  }

  detectLoop(file) {
    const fileName = (file.file_name || file.fileName || '').toLowerCase();
    const duration = file.duration || 0;
    
    // Check for loop indicators in filename
    const loopKeywords = ['loop', 'lup', 'lp', 'beat', 'pattern', 'riff'];
    const hasLoopKeyword = loopKeywords.some(keyword => fileName.includes(keyword));
    
    // Check duration - loops are typically 1-8 bars (2-32 seconds at 120 BPM)
    const isReasonableLoopDuration = duration >= 2 && duration <= 32;
    
    // Check for one-shot indicators
    const oneshotKeywords = ['hit', 'shot', 'kick', 'snare', 'hat', 'clap', 'crash'];
    const hasOneshotKeyword = oneshotKeywords.some(keyword => fileName.includes(keyword));
    
    // Very short duration is likely one-shot
    const isVeryShort = duration < 2;
    
    if (hasOneshotKeyword || isVeryShort) return false;
    if (hasLoopKeyword || isReasonableLoopDuration) return true;
    
    // Default to one-shot if uncertain
    return false;
  }

  generateAutoTags(file) {
    const fileName = (file.file_name || file.fileName || '').toLowerCase();
    const tags = [];
    
    // Genre detection
    if (fileName.includes('trap')) tags.push('Trap');
    if (fileName.includes('hip') || fileName.includes('hop')) tags.push('Hip Hop');
    if (fileName.includes('house')) tags.push('House');
    if (fileName.includes('techno')) tags.push('Techno');
    if (fileName.includes('dubstep')) tags.push('Dubstep');
    if (fileName.includes('drum') || fileName.includes('bass')) tags.push('Drum & Bass');
    
    // Instrument detection
    if (fileName.includes('kick')) tags.push('Kick');
    if (fileName.includes('snare')) tags.push('Snare');
    if (fileName.includes('hat') || fileName.includes('hihat')) tags.push('Hi-Hat');
    if (fileName.includes('clap')) tags.push('Clap');
    if (fileName.includes('crash')) tags.push('Crash');
    if (fileName.includes('cymbal')) tags.push('Cymbal');
    if (fileName.includes('bass')) tags.push('Bass');
    if (fileName.includes('lead')) tags.push('Lead');
    if (fileName.includes('pad')) tags.push('Pad');
    if (fileName.includes('vocal')) tags.push('Vocal');
    
    // Mood detection
    if (fileName.includes('dark') || fileName.includes('evil')) tags.push('Dark');
    if (fileName.includes('bright') || fileName.includes('happy')) tags.push('Bright');
    if (fileName.includes('chill') || fileName.includes('ambient')) tags.push('Chill');
    if (fileName.includes('aggressive') || fileName.includes('heavy')) tags.push('Aggressive');
    
    return tags.slice(0, 3).map(tag => `<span class="auto-tag">${tag}</span>`).join('');
  }

  showTaggingPrompt(filePath, fileName) {
    // Create modal for tagging
    const modal = document.createElement('div');
    modal.className = 'tagging-modal';
    modal.innerHTML = `
      <div class="tagging-modal-content">
        <div class="tagging-header">
          <h3>Tag Sample: ${fileName}</h3>
          <button class="close-btn" onclick="this.closest('.tagging-modal').remove()">×</button>
          </div>
        <div class="tagging-body">
          <div class="sample-preview">
            <div class="sample-info">
              <span class="sample-type">${this.detectLoop({file_name: fileName}) ? 'LOOP' : 'ONE-SHOT'}</span>
              <span class="sample-duration">Preview</span>
        </div>
        </div>
          <div class="tagging-options">
            <h4>Auto-detected Tags:</h4>
            <div class="suggested-tags" id="suggestedTags">
              ${this.generateTaggingOptions(fileName)}
          </div>
            <h4>Custom Tags:</h4>
            <input type="text" id="customTags" placeholder="Add custom tags (comma separated)" class="custom-tags-input">
            <div class="tagging-actions">
              <button class="btn btn-primary" onclick="app.saveTags('${filePath}')">Save Tags</button>
              <button class="btn btn-secondary" onclick="this.closest('.tagging-modal').remove()">Cancel</button>
          </div>
        </div>
      </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  generateTaggingOptions(fileName) {
    const lowerName = fileName.toLowerCase();
    const options = [];
    
    // Genre options
    if (lowerName.includes('trap')) options.push({text: 'Trap', type: 'genre'});
    if (lowerName.includes('hip') || lowerName.includes('hop')) options.push({text: 'Hip Hop', type: 'genre'});
    if (lowerName.includes('house')) options.push({text: 'House', type: 'genre'});
    if (lowerName.includes('techno')) options.push({text: 'Techno', type: 'genre'});
    
    // Instrument options
    if (lowerName.includes('kick')) options.push({text: 'Kick', type: 'instrument'});
    if (lowerName.includes('snare')) options.push({text: 'Snare', type: 'instrument'});
    if (lowerName.includes('hat')) options.push({text: 'Hi-Hat', type: 'instrument'});
    if (lowerName.includes('bass')) options.push({text: 'Bass', type: 'instrument'});
    
    // Mood options
    if (lowerName.includes('dark')) options.push({text: 'Dark', type: 'mood'});
    if (lowerName.includes('bright')) options.push({text: 'Bright', type: 'mood'});
    if (lowerName.includes('chill')) options.push({text: 'Chill', type: 'mood'});
    
    return options.map(option => 
      `<label class="tag-option">
        <input type="checkbox" value="${option.text}" data-type="${option.type}">
        <span class="tag-text">${option.text}</span>
        <span class="tag-type">${option.type}</span>
      </label>`
    ).join('');
  }

  saveTags(filePath) {
    const suggestedTags = Array.from(document.querySelectorAll('#suggestedTags input:checked')).map(cb => cb.value);
    const customTags = document.getElementById('customTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
    const allTags = [...suggestedTags, ...customTags];
    
    console.log(`Saving tags for ${filePath}:`, allTags);
    
    // Here you would save to database
    // await this.database.saveSampleTags(filePath, allTags);
    
    // Close modal
    document.querySelector('.tagging-modal').remove();
    
    // Show success message
    this.showNotification('Tags saved successfully!', 'success');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      border-radius: 8px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  createCategoryFilters(categoryId, files) {
    const formatCounts = {};
    const typeCounts = {};
    const moodCounts = {};
    
    files.forEach(file => {
      const format = (file.format || 'unknown').toLowerCase();
      formatCounts[format] = (formatCounts[format] || 0) + 1;
      
      // Count by sample type (loop vs one-shot)
      const isLoop = this.detectLoop(file);
      const sampleType = isLoop ? 'loop' : 'oneshot';
      typeCounts[sampleType] = (typeCounts[sampleType] || 0) + 1;
      
      // Count by mood/genre based on filename
      const fileName = (file.file_name || file.fileName || '').toLowerCase();
      if (fileName.includes('dark') || fileName.includes('evil')) {
        moodCounts['dark'] = (moodCounts['dark'] || 0) + 1;
      }
      if (fileName.includes('bright') || fileName.includes('happy')) {
        moodCounts['bright'] = (moodCounts['bright'] || 0) + 1;
      }
      if (fileName.includes('chill') || fileName.includes('ambient')) {
        moodCounts['chill'] = (moodCounts['chill'] || 0) + 1;
      }
    });

    const formatButtons = Object.entries(formatCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([format, count]) => `
        <button class="category-filter-btn" data-category="${categoryId}" data-filter="format" data-value="${format}">
          ${format.toUpperCase()} (${count})
        </button>
      `).join('');

    const typeButtons = Object.entries(typeCounts)
      .map(([type, count]) => `
        <button class="category-filter-btn" data-category="${categoryId}" data-filter="type" data-value="${type}">
          ${type.toUpperCase()} (${count})
        </button>
      `).join('');

    const moodButtons = Object.entries(moodCounts)
      .map(([mood, count]) => `
        <button class="category-filter-btn" data-category="${categoryId}" data-filter="mood" data-value="${mood}">
          ${mood.toUpperCase()} (${count})
        </button>
      `).join('');

    return `
      <div class="category-filters" id="${categoryId}Filters">
        <div class="filter-group">
          <h5>All Files</h5>
          <button class="category-filter-btn active" data-category="${categoryId}" data-filter="all" data-value="all">
            All (${files.length})
          </button>
          </div>
        <div class="filter-group">
          <h5>Format</h5>
          ${formatButtons}
        </div>
        <div class="filter-group">
          <h5>Type</h5>
          ${typeButtons}
          </div>
        <div class="filter-group">
          <h5>Mood</h5>
          ${moodButtons}
          </div>
        </div>
    `;
  }

  hideAllCategories() {
    document.getElementById('audioCategory').style.display = 'none';
    document.getElementById('midiCategory').style.display = 'none';
    document.getElementById('logicCategory').style.display = 'none';
    document.getElementById('dawCategory').style.display = 'none';
  }

  getFileIcon(format) {
    const iconMap = {
      'wav': '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>',
      'mp3': '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>',
      'aiff': '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>',
      'flac': '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>',
      'm4a': '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>',
      'mid': '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>',
      'midi': '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>',
      'logic': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 9h6v6H9z"></path>',
      'logicx': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 9h6v6H9z"></path>',
      'als': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 9h6v6H9z"></path>',
      'alp': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 9h6v6H9z"></path>',
      'cpr': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 9h6v6H9z"></path>',
      'ptx': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 9h6v6H9z"></path>',
      'ptf': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 9h6v6H9z"></path>',
      'song': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 9h6v6H9z"></path>',
      'flp': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 9h6v6H9z"></path>'
    };
    
    return iconMap[format.toLowerCase()] || '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline>';
  }

  formatFileSize(bytes) {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  openProject(projectId) {
    const project = this.scanResults.find(p => p.id === projectId);
    if (project) {
      console.log('Opening project:', project.fileName);
      // This would open the project in the appropriate DAW
      this.showNotification(`Opening ${project.fileName}...`);
    }
  }

  addTags(projectId) {
    const project = this.scanResults.find(p => p.id === projectId);
    if (project) {
      console.log('Adding tags to:', project.fileName);
      // This would open a tag editor
      this.showNotification(`Adding tags to ${project.fileName}...`);
    }
  }

  showError(message) {
    console.error(message);
    // Simple alert for now
    alert('Error: ' + message);
  }

  showNotification(message) {
    console.log(message);
  // Simple alert for now
  alert(message);
}

  // Advanced Audio Analysis Methods
  async analyzeAudioFile(filePath, options = {}) {
    try {
      console.log(`🎵 Starting advanced analysis for: ${filePath}`);
      
      // Show analysis progress
      this.showAnalysisProgress('Analyzing audio file...');
      
      // Perform advanced audio analysis
      const analysis = await window.electronAPI.analyzeAudioAdvanced(filePath, options);
      
      // Hide progress
      this.hideAnalysisProgress();
      
      console.log('✅ Advanced analysis complete:', analysis);
      return analysis;
      
    } catch (error) {
      console.error('❌ Error in advanced audio analysis:', error);
      this.hideAnalysisProgress();
      this.showError(`Analysis failed: ${error.message}`);
      return null;
    }
  }

  async analyzeAudioWithAI(audioData, options = {}) {
    try {
      console.log('🤖 Starting AI analysis...');
      
      // Show analysis progress
      this.showAnalysisProgress('AI analysis in progress...');
      
      // Perform AI analysis
      const analysis = await window.electronAPI.analyzeAudioAI(audioData, options);
      
      // Hide progress
      this.hideAnalysisProgress();
      
      console.log('✅ AI analysis complete:', analysis);
      return analysis;
      
    } catch (error) {
      console.error('❌ Error in AI analysis:', error);
      this.hideAnalysisProgress();
      this.showError(`AI analysis failed: ${error.message}`);
      return null;
    }
  }

  async analyzeBatchAdvanced(filePaths, options = {}) {
    try {
      console.log(`🔍 Starting batch analysis for ${filePaths.length} files`);
      
      // Show batch analysis progress
      this.showAnalysisProgress(`Analyzing ${filePaths.length} files...`);
      
      // Perform batch analysis
      const results = await window.electronAPI.analyzeBatchAdvanced(filePaths, {
        ...options,
        onProgress: (progress) => {
          this.updateAnalysisProgress(progress);
        }
      });
      
      // Hide progress
      this.hideAnalysisProgress();
      
      console.log('✅ Batch analysis complete:', results);
      return results;
      
    } catch (error) {
      console.error('❌ Error in batch analysis:', error);
      this.hideAnalysisProgress();
      this.showError(`Batch analysis failed: ${error.message}`);
      return null;
    }
  }

  async analyzeBatchAI(audioDataList, options = {}) {
    try {
      console.log(`🤖 Starting batch AI analysis for ${audioDataList.length} files`);
      
      // Show batch analysis progress
      this.showAnalysisProgress(`AI analyzing ${audioDataList.length} files...`);
      
      // Perform batch AI analysis
      const results = await window.electronAPI.analyzeBatchAI(audioDataList, {
        ...options,
        onProgress: (progress) => {
          this.updateAnalysisProgress(progress);
        }
      });
      
      // Hide progress
      this.hideAnalysisProgress();
      
      console.log('✅ Batch AI analysis complete:', results);
      return results;
      
    } catch (error) {
      console.error('❌ Error in batch AI analysis:', error);
      this.hideAnalysisProgress();
      this.showError(`Batch AI analysis failed: ${error.message}`);
      return null;
    }
  }

  async loadAnalysisParameters() {
    try {
      this.analysisParameters = await window.electronAPI.getAnalysisParameters();
      this.analysisStats = await window.electronAPI.getAnalysisStats();
      console.log('Analysis parameters loaded:', this.analysisParameters);
    } catch (error) {
      console.error('Error loading analysis parameters:', error);
    }
  }

  async updateAnalysisParameters(parameters) {
    try {
      const result = await window.electronAPI.updateAnalysisParameters(parameters);
        if (result.success) {
        console.log('Analysis parameters updated successfully');
        await this.loadAnalysisParameters(); // Reload parameters
        } else {
        throw new Error(result.error);
        }
      } catch (error) {
      console.error('Error updating analysis parameters:', error);
      this.showError(`Failed to update parameters: ${error.message}`);
    }
  }

  async clearAnalysisCache() {
    try {
      await window.electronAPI.clearAnalysisCache();
      console.log('Analysis cache cleared');
    } catch (error) {
      console.error('Error clearing analysis cache:', error);
    }
  }

  showAnalysisProgress(message) {
    // Create or update analysis progress indicator
    let progressElement = document.getElementById('analysisProgress');
    if (!progressElement) {
      progressElement = document.createElement('div');
      progressElement.id = 'analysisProgress';
      progressElement.className = 'analysis-progress';
      progressElement.innerHTML = `
        <div class="progress-content">
          <div class="progress-spinner"></div>
          <div class="progress-text">${message}</div>
      </div>
      `;
      document.body.appendChild(progressElement);
    } else {
      progressElement.querySelector('.progress-text').textContent = message;
    }
    progressElement.style.display = 'flex';
  }

  hideAnalysisProgress() {
    const progressElement = document.getElementById('analysisProgress');
    if (progressElement) {
      progressElement.style.display = 'none';
    }
  }

  updateAnalysisProgress(progress) {
    const progressElement = document.getElementById('analysisProgress');
    if (progressElement) {
      const text = progressElement.querySelector('.progress-text');
      if (text) {
        text.textContent = `Analyzing ${progress.completed}/${progress.total} files (${progress.percentage}%)`;
      }
    }
  }

  displayAnalysisResults(analysis) {
    // Display analysis results in a modal or dedicated section
    const modal = document.createElement('div');
    modal.className = 'analysis-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Advanced Audio Analysis Results</h3>
          <button class="close-btn" onclick="this.closest('.analysis-modal').remove()">×</button>
        </div>
        <div class="modal-body">
          ${this.formatAnalysisResults(analysis)}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  formatAnalysisResults(analysis) {
    if (!analysis) return '<p>No analysis results available</p>';
    
    let html = '<div class="analysis-results">';
    
    // Basic info
    if (analysis.fileInfo) {
      html += `
        <div class="analysis-section">
          <h4>File Information</h4>
          <p>Size: ${analysis.fileInfo.sizeFormatted || 'Unknown'}</p>
          <p>Extension: ${analysis.fileInfo.extension || 'Unknown'}</p>
        </div>
      `;
    }
    
    // AI Analysis
    if (analysis.aiAnalysis) {
      const ai = analysis.aiAnalysis;
      html += `
        <div class="analysis-section">
          <h4>AI Analysis</h4>
          ${ai.mood ? `<p><strong>Mood:</strong> ${ai.mood.primaryEmotion} (${Math.round(ai.mood.emotionConfidence * 100)}% confidence)</p>` : ''}
          ${ai.genre ? `<p><strong>Genre:</strong> ${ai.genre.primaryGenre} (${Math.round(ai.genre.genreConfidence * 100)}% confidence)</p>` : ''}
          ${ai.instruments ? `<p><strong>Instruments:</strong> ${ai.instruments.detected?.map(i => i.instrument).join(', ') || 'Unknown'}</p>` : ''}
      </div>
      `;
    }
    
    // Quality Assessment
    if (analysis.qualityAssessment) {
      const quality = analysis.qualityAssessment;
      html += `
        <div class="analysis-section">
          <h4>Quality Assessment</h4>
          <p><strong>Overall Quality:</strong> ${Math.round(quality.overall * 100)}%</p>
          <p><strong>Dynamic Range:</strong> ${Math.round(quality.dynamicRange * 100)}%</p>
          <p><strong>Frequency Response:</strong> ${Math.round(quality.frequencyResponse * 100)}%</p>
        </div>
      `;
    }
    
    // Recommendations
    if (analysis.recommendations) {
      const rec = analysis.recommendations;
      html += `
        <div class="analysis-section">
          <h4>Recommendations</h4>
          ${rec.organization ? `<p><strong>Organization:</strong> ${rec.organization.suggestedFolder}</p>` : ''}
          ${rec.creative ? `<p><strong>Use Cases:</strong> ${rec.creative.useCases?.join(', ')}</p>` : ''}
        </div>
      `;
    }
    
    html += '</div>';
    return html;
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new MusicOrganizerApp();
});

// Global function for toggling categories
function toggleCategory(categoryId) {
  const categoryElement = document.getElementById(categoryId);
  const isExpanded = categoryElement.classList.contains('expanded');
  
  if (isExpanded) {
    categoryElement.classList.remove('expanded');
      } else {
    categoryElement.classList.add('expanded');
  }








}

// Handle IPC messages from main process
if (window.electronAPI) {
  window.electronAPI.onScanComplete((results) => {
    console.log('Scan complete:', results);
    window.app.scanResults = results.tracks || [];
    window.app.displayResults();
    window.app.loadScanHistory(); // Refresh scan history
  });

  window.electronAPI.onScanError((error) => {
    console.error('Scan error:', error);
    window.app.showError(error);
  });

  // Listen for scan progress updates
  window.electronAPI.onScanProgress((progress) => {
    window.app.updateProgressDisplay(progress);
  });
}