const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  getScanHistory: () => ipcRenderer.invoke('get-scan-history'),
  sampleManager: {
    getStatus: () => ipcRenderer.invoke('sample-manager-status'),
    search: (query) => ipcRenderer.invoke('sample-manager-search', query),
    getRecommendations: (context) => ipcRenderer.invoke('sample-manager-recommendations', context),
    analyze: (samplePath) => ipcRenderer.invoke('sample-manager-analyze', samplePath),
    batchProcess: (samplePaths, operations) => ipcRenderer.invoke('sample-manager-batch-process', samplePaths, operations),
    getCollections: () => ipcRenderer.invoke('sample-manager-collections'),
    createCollection: (name, description, tags, isSmart, smartCriteria) => ipcRenderer.invoke('sample-manager-create-collection', name, description, tags, isSmart, smartCriteria),
    getAnalytics: () => ipcRenderer.invoke('sample-manager-analytics'),
    
    // Enhanced AI Analysis
    analyzeWithAI: (samplePath, options) => ipcRenderer.invoke('sample-manager-analyze-ai', samplePath, options),
    generateSmartTags: (samplePath) => ipcRenderer.invoke('sample-manager-smart-tags', samplePath),
    findSimilar: (samplePath, threshold) => ipcRenderer.invoke('sample-manager-find-similar', samplePath, threshold),
    
    // Audio Processing
    separateStems: (samplePath, options) => ipcRenderer.invoke('sample-manager-separate-stems', samplePath, options),
    detectTransients: (samplePath, options) => ipcRenderer.invoke('sample-manager-detect-transients', samplePath, options),
    chopSample: (samplePath, options) => ipcRenderer.invoke('sample-manager-chop-sample', samplePath, options),
    applyEffects: (samplePath, effects, options) => ipcRenderer.invoke('sample-manager-apply-effects', samplePath, effects, options),
    pitchShift: (samplePath, semitones, options) => ipcRenderer.invoke('sample-manager-pitch-shift', samplePath, semitones, options),
    timeStretch: (samplePath, factor, options) => ipcRenderer.invoke('sample-manager-time-stretch', samplePath, factor, options),
    
    // Workflow Integration
    sendToDAW: (daw, sample, options) => ipcRenderer.invoke('sample-manager-send-to-daw', daw, sample, options),
    syncWithCloud: (direction) => ipcRenderer.invoke('sample-manager-sync-cloud', direction),
    shareSamplePack: (samplePack, users) => ipcRenderer.invoke('sample-manager-share-pack', samplePack, users),
    createVersion: (sample) => ipcRenderer.invoke('sample-manager-create-version', sample),
    getIntegrationStatus: () => ipcRenderer.invoke('sample-manager-integration-status'),
    
    // Advanced Search
    naturalLanguageSearch: (query) => ipcRenderer.invoke('sample-manager-natural-search', query),
    getSmartRecommendations: (context, preferences) => ipcRenderer.invoke('sample-manager-smart-recommendations', context, preferences)
  }
});

contextBridge.exposeInMainWorld('electronAPI', {
  // File/Folder/Drive selection
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectFolderAndScan: () => ipcRenderer.invoke('select-folder-and-scan'),
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectDrive: () => ipcRenderer.invoke('select-drive'),
  
  // Enhanced file scanning
  scanFolder: (path, options) => ipcRenderer.invoke('scan-folder', path, options),
  
  // Database operations
  getTracks: () => ipcRenderer.invoke('get-tracks'),
  getTrack: (id) => ipcRenderer.invoke('get-track', id),
  updateTrack: (id, data) => ipcRenderer.invoke('update-track', id, data),
  
  // Task operations
  getTasks: (trackId) => ipcRenderer.invoke('get-tasks', trackId),
  updateTask: (taskId, completed) => ipcRenderer.invoke('update-task', taskId, completed),
  
  // Creative engine
  generateIdea: (prompt) => ipcRenderer.invoke('generate-idea', prompt),
  
  // Voice assistant
  startVoiceInput: () => ipcRenderer.invoke('start-voice-input'),
  
  // Enhanced features
  getScanHistory: () => ipcRenderer.invoke('get-scan-history'),
  getRecentScans: (limit) => ipcRenderer.invoke('get-recent-scans', limit),
  getScanStats: () => ipcRenderer.invoke('get-scan-stats'),
  getFavoriteLocations: () => ipcRenderer.invoke('get-favorite-locations'),
  clearScanHistory: () => ipcRenderer.invoke('clear-scan-history'),
  
  // Progress Management
  getScanProgress: () => ipcRenderer.invoke('get-scan-progress'),
  
  // Auto-Organization
  analyzeFileOrganization: (fileData) => ipcRenderer.invoke('analyze-file-organization', fileData),
  generateSmartTags: (fileData) => ipcRenderer.invoke('generate-smart-tags', fileData),
  suggestOrganization: (fileData) => ipcRenderer.invoke('suggest-organization', fileData),
  
  // Confirmation Dialogs
  confirmClearResults: () => ipcRenderer.invoke('confirm-clear-results'),
  confirmStopScan: () => ipcRenderer.invoke('confirm-stop-scan'),
  
  // Advanced Audio Analysis
  analyzeAudioAdvanced: (filePath, options) => ipcRenderer.invoke('analyze-audio-advanced', filePath, options),
  analyzeAudioAI: (audioData, options) => ipcRenderer.invoke('analyze-audio-ai', audioData, options),
  analyzeBatchAdvanced: (filePaths, options) => ipcRenderer.invoke('analyze-batch-advanced', filePaths, options),
  analyzeBatchAI: (audioDataList, options) => ipcRenderer.invoke('analyze-batch-ai', audioDataList, options),
  getAnalysisParameters: () => ipcRenderer.invoke('get-analysis-parameters'),
  updateAnalysisParameters: (parameters) => ipcRenderer.invoke('update-analysis-parameters', parameters),
  getAnalysisStats: () => ipcRenderer.invoke('get-analysis-stats'),
  clearAnalysisCache: () => ipcRenderer.invoke('clear-analysis-cache'),
  
  
  // Sample Manager API
  sampleManager: {
    getStatus: () => ipcRenderer.invoke('sample-manager-status'),
    search: (query) => ipcRenderer.invoke('sample-manager-search', query),
    getRecommendations: (context) => ipcRenderer.invoke('sample-manager-recommendations', context),
    analyze: (samplePath) => ipcRenderer.invoke('sample-manager-analyze', samplePath),
    batchProcess: (samplePaths, operations) => ipcRenderer.invoke('sample-manager-batch-process', samplePaths, operations),
    getCollections: () => ipcRenderer.invoke('sample-manager-collections'),
    createCollection: (name, description, tags, isSmart, smartCriteria) => ipcRenderer.invoke('sample-manager-create-collection', name, description, tags, isSmart, smartCriteria),
    getAnalytics: () => ipcRenderer.invoke('sample-manager-analytics'),
    
    // Enhanced AI Analysis
    analyzeWithAI: (samplePath, options) => ipcRenderer.invoke('sample-manager-analyze-ai', samplePath, options),
    generateSmartTags: (samplePath) => ipcRenderer.invoke('sample-manager-smart-tags', samplePath),
    findSimilar: (samplePath, threshold) => ipcRenderer.invoke('sample-manager-find-similar', samplePath, threshold),
    
    // Audio Processing
    separateStems: (samplePath, options) => ipcRenderer.invoke('sample-manager-separate-stems', samplePath, options),
    detectTransients: (samplePath, options) => ipcRenderer.invoke('sample-manager-detect-transients', samplePath, options),
    chopSample: (samplePath, options) => ipcRenderer.invoke('sample-manager-chop-sample', samplePath, options),
    applyEffects: (samplePath, effects, options) => ipcRenderer.invoke('sample-manager-apply-effects', samplePath, effects, options),
    pitchShift: (samplePath, semitones, options) => ipcRenderer.invoke('sample-manager-pitch-shift', samplePath, semitones, options),
    timeStretch: (samplePath, factor, options) => ipcRenderer.invoke('sample-manager-time-stretch', samplePath, factor, options),
    
    // Workflow Integration
    sendToDAW: (daw, sample, options) => ipcRenderer.invoke('sample-manager-send-to-daw', daw, sample, options),
    syncWithCloud: (direction) => ipcRenderer.invoke('sample-manager-sync-cloud', direction),
    shareSamplePack: (samplePack, users) => ipcRenderer.invoke('sample-manager-share-pack', samplePack, users),
    createVersion: (sample) => ipcRenderer.invoke('sample-manager-create-version', sample),
    getIntegrationStatus: () => ipcRenderer.invoke('sample-manager-integration-status'),
    
    // Advanced Search
    naturalLanguageSearch: (query) => ipcRenderer.invoke('sample-manager-natural-search', query),
    getSmartRecommendations: (context, preferences) => ipcRenderer.invoke('sample-manager-smart-recommendations', context, preferences)
  },
  
  // Event listeners
  onScanComplete: (callback) => ipcRenderer.on('scan-complete', callback),
  onScanError: (callback) => ipcRenderer.on('scan-error', callback),
  onScanProgress: (callback) => ipcRenderer.on('scan-progress', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});