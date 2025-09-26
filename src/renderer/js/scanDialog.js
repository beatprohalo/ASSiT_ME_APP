/**
 * Advanced Sample Manager 2025 - Pre-Scan Dialog
 * Comprehensive scanning workflow with AI-powered analysis
 */

class ScanDialog {
  constructor() {
    this.dialog = null;
    this.scanConfig = {
      scanMode: 'scan_with_approval',
      autoTagging: true,
      rememberLocations: true,
      deepAnalysis: false,
      autoTaggingOptions: {
        genreDetection: true,
        moodAnalysis: true,
        instrumentDetection: true,
        energyLevel: true
      },
      deepAnalysisOptions: {
        spectralAnalysis: true,
        harmonicAnalysis: true,
        transientDetection: false
      }
    };
  }

  show() {
    this.createDialog();
    this.setupEventListeners();
    this.dialog.style.display = 'flex';
  }

  createDialog() {
    // Remove existing dialog if any
    const existing = document.getElementById('scanDialog');
    if (existing) existing.remove();

    this.dialog = document.createElement('div');
    this.dialog.id = 'scanDialog';
    this.dialog.className = 'scan-dialog';
    this.dialog.innerHTML = `
      <div class="scan-dialog-content">
        <div class="scan-dialog-header">
          <h2>🎵 Advanced Sample Manager 2025</h2>
          <p>Configure your audio file scanning and analysis</p>
        </div>

        <div class="scan-dialog-body">
          <!-- Scan Mode Selection -->
          <div class="scan-section">
            <h3>📁 Scan Mode</h3>
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" name="scanMode" value="scan_only" ${this.scanConfig.scanMode === 'scan_only' ? 'checked' : ''}>
                <div class="option-content">
                  <strong>Scan Only (Preview)</strong>
                  <p>Analyze files and show results, but don't add to library yet</p>
                </div>
              </label>
              
              <label class="radio-option">
                <input type="radio" name="scanMode" value="scan_and_add" ${this.scanConfig.scanMode === 'scan_and_add' ? 'checked' : ''}>
                <div class="option-content">
                  <strong>Scan and Add to Library</strong>
                  <p>Automatically add files to library after scanning</p>
                </div>
              </label>
              
              <label class="radio-option">
                <input type="radio" name="scanMode" value="scan_with_approval" ${this.scanConfig.scanMode === 'scan_with_approval' ? 'checked' : ''}>
                <div class="option-content">
                  <strong>Scan with Manual Approval</strong>
                  <p>Review each file before adding to library</p>
                </div>
              </label>
            </div>
          </div>

          <!-- Auto-Tagging Options -->
          <div class="scan-section">
            <h3>🤖 AI-Powered Auto-Tagging</h3>
            <div class="checkbox-group">
              <label class="checkbox-option">
                <input type="checkbox" id="autoTagging" ${this.scanConfig.autoTagging ? 'checked' : ''}>
                <span>Apply Automatic Tags</span>
                <p>Let AI analyze and suggest tags for your samples</p>
              </label>
              
              <div class="sub-options" id="autoTaggingOptions" style="${this.scanConfig.autoTagging ? 'display: block' : 'display: none'}">
                <label class="sub-option">
                  <input type="checkbox" id="genreDetection" ${this.scanConfig.autoTaggingOptions.genreDetection ? 'checked' : ''}>
                  <span>Genre Detection</span>
                </label>
                <label class="sub-option">
                  <input type="checkbox" id="moodAnalysis" ${this.scanConfig.autoTaggingOptions.moodAnalysis ? 'checked' : ''}>
                  <span>Mood Analysis</span>
                </label>
                <label class="sub-option">
                  <input type="checkbox" id="instrumentDetection" ${this.scanConfig.autoTaggingOptions.instrumentDetection ? 'checked' : ''}>
                  <span>Instrument Detection</span>
                </label>
                <label class="sub-option">
                  <input type="checkbox" id="energyLevel" ${this.scanConfig.autoTaggingOptions.energyLevel ? 'checked' : ''}>
                  <span>Energy Level Analysis</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Advanced Options -->
          <div class="scan-section">
            <h3>⚙️ Advanced Options</h3>
            <div class="checkbox-group">
              <label class="checkbox-option">
                <input type="checkbox" id="rememberLocations" ${this.scanConfig.rememberLocations ? 'checked' : ''}>
                <span>Remember Scan Locations</span>
                <p>Save folder locations for future quick scans</p>
              </label>
              
              <label class="checkbox-option">
                <input type="checkbox" id="deepAnalysis" ${this.scanConfig.deepAnalysis ? 'checked' : ''}>
                <span>Enable Deep Audio Analysis</span>
                <p>Perform advanced analysis (takes longer but more accurate)</p>
              </label>
              
              <div class="sub-options" id="deepAnalysisOptions" style="${this.scanConfig.deepAnalysis ? 'display: block' : 'display: none'}">
                <label class="sub-option">
                  <input type="checkbox" id="spectralAnalysis" ${this.scanConfig.deepAnalysisOptions.spectralAnalysis ? 'checked' : ''}>
                  <span>Spectral Analysis</span>
                </label>
                <label class="sub-option">
                  <input type="checkbox" id="harmonicAnalysis" ${this.scanConfig.deepAnalysisOptions.harmonicAnalysis ? 'checked' : ''}>
                  <span>Harmonic Content Analysis</span>
                </label>
                <label class="sub-option">
                  <input type="checkbox" id="transientDetection" ${this.scanConfig.deepAnalysisOptions.transientDetection ? 'checked' : ''}>
                  <span>Transient Detection</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Supported Formats -->
          <div class="scan-section">
            <h3>🎼 Supported Audio Formats</h3>
            <div class="format-list">
              <span class="format-tag">WAV</span>
              <span class="format-tag">AIFF</span>
              <span class="format-tag">FLAC</span>
              <span class="format-tag">MP3</span>
              <span class="format-tag">OGG</span>
              <span class="format-tag">M4A</span>
              <span class="format-tag">WMA</span>
              <span class="format-tag">CAF</span>
              <span class="format-tag">AAC</span>
              <span class="format-tag">OPUS</span>
              <span class="format-tag">ALAC</span>
            </div>
          </div>
        </div>

        <div class="scan-dialog-footer">
          <button class="btn btn-outline" id="cancelScan">Cancel</button>
          <button class="btn btn-primary" id="startAdvancedScan">Start Advanced Scan</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.dialog);
  }

  setupEventListeners() {
    // Auto-tagging toggle
    document.getElementById('autoTagging').addEventListener('change', (e) => {
      const options = document.getElementById('autoTaggingOptions');
      options.style.display = e.target.checked ? 'block' : 'none';
    });

    // Deep analysis toggle
    document.getElementById('deepAnalysis').addEventListener('change', (e) => {
      const options = document.getElementById('deepAnalysisOptions');
      options.style.display = e.target.checked ? 'block' : 'none';
    });

    // Cancel button
    document.getElementById('cancelScan').addEventListener('click', () => {
      this.hide();
    });

    // Start scan button
    document.getElementById('startAdvancedScan').addEventListener('click', () => {
      this.collectConfig();
      this.hide();
      this.startAdvancedScan();
    });
  }

  collectConfig() {
    this.scanConfig = {
      scanMode: document.querySelector('input[name="scanMode"]:checked').value,
      autoTagging: document.getElementById('autoTagging').checked,
      rememberLocations: document.getElementById('rememberLocations').checked,
      deepAnalysis: document.getElementById('deepAnalysis').checked,
      autoTaggingOptions: {
        genreDetection: document.getElementById('genreDetection').checked,
        moodAnalysis: document.getElementById('moodAnalysis').checked,
        instrumentDetection: document.getElementById('instrumentDetection').checked,
        energyLevel: document.getElementById('energyLevel').checked
      },
      deepAnalysisOptions: {
        spectralAnalysis: document.getElementById('spectralAnalysis').checked,
        harmonicAnalysis: document.getElementById('harmonicAnalysis').checked,
        transientDetection: document.getElementById('transientDetection').checked
      }
    };
  }

  startAdvancedScan() {
    // Show folder selection dialog
    if (window.electronAPI && window.electronAPI.selectFolder) {
      window.electronAPI.selectFolder().then((result) => {
        if (result && result.length > 0) {
          this.performAdvancedScan(result[0]);
        }
      });
    } else {
      // Fallback to existing folder selection
      if (window.app && window.app.selectFolder) {
        window.app.selectFolder();
      }
    }
  }

  async performAdvancedScan(folderPath) {
    try {
      // Show progress dialog
      this.showProgressDialog();
      
      // Start the advanced scan with configuration
      const result = await window.electronAPI.scanFolder(folderPath);
      
      if (result && result.success) {
        this.handleScanResults(result.results, folderPath);
      }
    } catch (error) {
      console.error('Advanced scan failed:', error);
      this.showError('Scan failed: ' + error.message);
    }
  }

  showProgressDialog() {
    // Create progress dialog
    const progressDialog = document.createElement('div');
    progressDialog.id = 'progressDialog';
    progressDialog.className = 'progress-dialog';
    progressDialog.innerHTML = `
      <div class="progress-dialog-content">
        <div class="progress-header">
          <h3>🔍 Advanced Audio Analysis</h3>
          <p>Analyzing your audio files with AI-powered features...</p>
        </div>
        
        <div class="progress-body">
          <div class="progress-bar">
            <div class="progress-fill" id="progressFill"></div>
          </div>
          <div class="progress-info">
            <span id="currentFile">Initializing...</span>
            <span id="progressText">0%</span>
          </div>
          <div class="progress-stages">
            <div class="stage" id="stage1">📁 Discovering files</div>
            <div class="stage" id="stage2">🎵 Analyzing audio</div>
            <div class="stage" id="stage3">🤖 AI processing</div>
            <div class="stage" id="stage4">📊 Generating results</div>
          </div>
        </div>
        
        <div class="progress-footer">
          <button class="btn btn-outline" id="cancelProgress">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(progressDialog);
    
    // Setup cancel button
    document.getElementById('cancelProgress').addEventListener('click', () => {
      progressDialog.remove();
    });
  }

  handleScanResults(results, folderPath) {
    // Remove progress dialog
    const progressDialog = document.getElementById('progressDialog');
    if (progressDialog) progressDialog.remove();

    // Show results with advanced features
    if (window.app) {
      window.app.handleAdvancedScanResults(results, this.scanConfig);
    }
  }

  showError(message) {
    alert('Error: ' + message);
  }

  hide() {
    if (this.dialog) {
      this.dialog.remove();
    }
  }
}

// Export for use in other modules
window.ScanDialog = ScanDialog;
