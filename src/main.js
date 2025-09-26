const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { Database } = require('./database/database');
const { FileScanner } = require('./scanner/fileScanner');
const { AdvancedSampleManager } = require('./sampleManager/advancedSampleManager');
const { SampleDatabase } = require('./database/sampleDatabase');
const ScanHistory = require('./utils/scanHistory');
const ProgressFeedback = require('./utils/progressFeedback');
const AutoOrganization = require('./utils/autoOrganization');
const ConfirmationDialogs = require('./utils/confirmationDialogs');
const AdvancedAudioAnalysis = require('./audio/advancedAudioAnalysis');
const AIAnalysisEngine = require('./audio/aiAnalysisEngine');
const { scanFolderRecursively } = require('../scanner');

class App {
  constructor() {
    this.mainWindow = null;
    this.database = null;
    this.fileScanner = null;
    this.sampleManager = null;
    this.sampleDatabase = null;
    this.scanHistory = null;
    this.progressFeedback = null;
    this.autoOrganization = null;
    this.advancedAudioAnalysis = null;
    this.aiAnalysisEngine = null;
    this.isDev = process.argv.includes('--dev');
  }

  async initialize() {
    // Initialize database
    this.database = new Database();
    await this.database.initialize();
    
    // Initialize sample database
    this.sampleDatabase = new SampleDatabase();
    await this.sampleDatabase.initialize();
    
    // Initialize file scanner
    this.fileScanner = new FileScanner(this.database, this.progressFeedback);
    
    // Initialize advanced sample manager
    this.sampleManager = new AdvancedSampleManager(this.sampleDatabase, this.fileScanner);
    
    // Initialize new features
    this.scanHistory = new ScanHistory();
    this.progressFeedback = new ProgressFeedback();
    this.autoOrganization = new AutoOrganization();
    this.advancedAudioAnalysis = new AdvancedAudioAnalysis();
    this.aiAnalysisEngine = new AIAnalysisEngine();
    await this.aiAnalysisEngine.initialize();
    
    this.setupApp();
    this.setupMenu();
    this.setupIPC();
  }

  setupApp() {
    this.createWindow();
    
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    this.mainWindow.loadFile('src/renderer/index.html');

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      
      if (this.isDev) {
        this.mainWindow.webContents.openDevTools();
      }
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  setupMenu() {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Scan Music Folder',
            accelerator: 'CmdOrCtrl+O',
            click: () => this.scanMusicFolder()
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => app.quit()
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      }
    ];

    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  setupIPC() {
    // File/Folder/Drive selection
    ipcMain.handle('select-folder', async () => {
      try {
        const result = await dialog.showOpenDialog(this.mainWindow, {
          properties: ['openDirectory'],
          title: 'Select Folder to Scan'
        });

        if (result.canceled || result.filePaths.length === 0) return [];

        const folderPath = result.filePaths[0];
        const files = scanFolderRecursively(folderPath);
        return files;
      } catch (error) {
        throw error;
      }
    });

    // Enhanced folder selection with direct scanning
    ipcMain.handle('select-folder-and-scan', async () => {
      try {
        const result = await dialog.showOpenDialog(this.mainWindow, {
          properties: ['openDirectory'],
          title: 'Select Folder to Scan'
        });

        if (result.canceled || result.filePaths.length === 0) return [];

        const folderPath = result.filePaths[0];
        console.log(`Starting scan of folder: ${folderPath}`);
        
        try {
          const files = scanFolder(folderPath);
          console.log(`Scan completed. Found ${files.length} files.`);
          return files;
        } catch (scanError) {
          console.error(`Scan error for ${folderPath}:`, scanError.message);
          // Return empty array instead of throwing error
          return [];
        }
      } catch (error) {
        console.error('Dialog error:', error.message);
        // Return empty array instead of throwing error
        return [];
      }
    });

    ipcMain.handle('select-files', async () => {
      try {
        const result = await dialog.showOpenDialog(this.mainWindow, {
          properties: ['openFile', 'multiSelections'],
          title: 'Select Files to Scan',
          filters: [
            { name: 'Audio Files', extensions: ['wav', 'mp3', 'aiff', 'flac', 'm4a'] },
            { name: 'MIDI Files', extensions: ['mid', 'midi'] },
            { name: 'Project Files', extensions: ['als', 'alp', 'logic', 'cpr', 'rpp', 'ptx', 'ptf'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });
        return result.canceled ? [] : result.filePaths;
      } catch (error) {
        throw error;
      }
    });

    ipcMain.handle('select-drive', async () => {
      try {
        const result = await dialog.showOpenDialog(this.mainWindow, {
          properties: ['openDirectory'],
          title: 'Select Drive to Scan',
          defaultPath: '/Volumes',
          buttonLabel: 'Select Drive'
        });
        
        console.log('Drive dialog result:', result);
        return result.canceled ? [] : result.filePaths;
      } catch (error) {
        console.error('Drive selection error:', error);
        return [];
      }
    });

    // Enhanced file scanning with progress and history
    ipcMain.handle('scan-folder', async (event, folderPath, options = {}) => {
      try {
        // Show confirmation dialog
        const confirmed = await ConfirmationDialogs.confirmScanStart(folderPath, options.estimatedFiles);
        if (confirmed.response === 1) { // Cancel button
          return { success: false, cancelled: true };
        }

        // Start progress tracking
        this.progressFeedback.start(options.estimatedFiles, 'Scanning files');
        
        // Set up progress listener
        const progressListener = (progress) => {
          this.mainWindow.webContents.send('scan-progress', progress);
        };
        this.progressFeedback.addCallback(progressListener);

        const startTime = Date.now();
        
        // Check if the path is a file or directory
        const stats = await fs.stat(folderPath);
        let results;
        
        if (stats.isFile()) {
          // If it's a single file, process it directly
          console.log(`📄 Processing single file: ${folderPath}`);
          results = await this.fileScanner.processSingleFile(folderPath);
        } else {
          // If it's a directory, scan it
          results = await this.fileScanner.scanFolder(folderPath);
        }
        
        const duration = Date.now() - startTime;

        // Complete progress tracking
        this.progressFeedback.complete();
        this.progressFeedback.removeCallback(progressListener);

        // Save to scan history
        const scanData = {
          location: folderPath,
          fileCount: results.tracks.length,
          audioFiles: results.tracks.filter(t => ['wav', 'mp3', 'aiff', 'aif', 'flac', 'm4a', 'ogg', 'wma', 'aac'].includes(t.format)).length,
          midiFiles: results.tracks.filter(t => ['mid', 'midi'].includes(t.format)).length,
          projectFiles: results.projects.length,
          errors: results.errors,
          duration
        };
        await this.scanHistory.addScanRecord(scanData);

        // Show completion dialog
        await ConfirmationDialogs.showScanComplete(scanData);

        return { success: true, results, scanData };
      } catch (error) {
        await ConfirmationDialogs.showScanError(error);
        return { success: false, error: error.message };
      }
    });

    // Database operations
    ipcMain.handle('get-tracks', async () => {
      return await this.database.getAllTracks();
    });

    ipcMain.handle('get-track', async (event, id) => {
      return await this.database.getTrack(id);
    });

    ipcMain.handle('update-track', async (event, id, data) => {
      return await this.database.updateTrack(id, data);
    });

    ipcMain.handle('get-tasks', async (event, trackId) => {
      return await this.database.getTasks(trackId);
    });

    ipcMain.handle('update-task', async (event, taskId, completed) => {
      return await this.database.updateTask(taskId, completed);
    });

    // Creative engine
    ipcMain.handle('generate-idea', async (event, prompt) => {
      // TODO: Implement AI-powered idea generation
      return { success: true, idea: "Generated idea placeholder" };
    });

    // Voice assistant
    ipcMain.handle('start-voice-input', async () => {
      // TODO: Implement voice recognition
      return { success: true };
    });

    // Sample Manager IPC handlers
    ipcMain.handle('sample-manager-status', async () => {
      return this.sampleManager.getStatus();
    });

    ipcMain.handle('sample-manager-search', async (event, query) => {
      return await this.sampleManager.searchSamples(query);
    });

    ipcMain.handle('sample-manager-recommendations', async (event, context) => {
      return await this.sampleManager.getRecommendations(context);
    });

    ipcMain.handle('sample-manager-analyze', async (event, samplePath) => {
      return await this.sampleManager.startAnalysis(samplePath);
    });

    ipcMain.handle('sample-manager-collections', async () => {
      return await this.sampleDatabase.getCollections();
    });

    ipcMain.handle('sample-manager-create-collection', async (event, name, description, tags, isSmart, smartCriteria) => {
      return await this.sampleDatabase.createCollection(name, description, tags, isSmart, smartCriteria);
    });

    ipcMain.handle('sample-manager-analytics', async () => {
      return await this.sampleDatabase.getAnalytics();
    });

    // Enhanced Sample Manager IPC handlers
    ipcMain.handle('sample-manager-analyze-ai', async (event, samplePath, options) => {
      return await this.sampleManager.analyzeSampleWithAI(samplePath, options);
    });

    ipcMain.handle('sample-manager-smart-tags', async (event, samplePath) => {
      return await this.sampleManager.generateSmartTags(samplePath);
    });

    ipcMain.handle('sample-manager-find-similar', async (event, samplePath, threshold) => {
      return await this.sampleManager.findSimilarSamples(samplePath, threshold);
    });

    ipcMain.handle('sample-manager-separate-stems', async (event, samplePath, options) => {
      return await this.sampleManager.separateStems(samplePath, options);
    });

    ipcMain.handle('sample-manager-detect-transients', async (event, samplePath, options) => {
      return await this.sampleManager.detectTransients(samplePath, options);
    });

    ipcMain.handle('sample-manager-chop-sample', async (event, samplePath, options) => {
      return await this.sampleManager.chopSample(samplePath, options);
    });

    // Scan History IPC handlers
    ipcMain.handle('get-scan-history', async () => {
      return await this.scanHistory.getRecentScans();
    });

    ipcMain.handle('get-recent-scans', async (event, limit = 10) => {
      return await this.scanHistory.getRecentScans(limit);
    });



    ipcMain.handle('clear-scan-history', async () => {
      await this.scanHistory.clearHistory();
      return { success: true };
    });

    // Progress Feedback IPC handlers
    ipcMain.handle('get-scan-progress', async () => {
      return this.progressFeedback.getFormattedProgress();
    });

    // Auto Organization IPC handlers
    ipcMain.handle('analyze-file-organization', async (event, fileData) => {
      return this.autoOrganization.analyzeFile(fileData);
    });

    ipcMain.handle('generate-smart-tags', async (event, fileData) => {
      return this.autoOrganization.generateSmartTags(fileData);
    });

    ipcMain.handle('suggest-organization', async (event, fileData) => {
      return this.autoOrganization.suggestOrganization(fileData);
    });

    // Confirmation Dialog IPC handlers
    ipcMain.handle('confirm-clear-results', async () => {
      const result = await ConfirmationDialogs.confirmClearResults();
      return result.response === 0; // Clear All button
    });

    ipcMain.handle('confirm-stop-scan', async () => {
      const result = await ConfirmationDialogs.confirmStopScan();
      return result.response === 0; // Stop Scan button
    });

    // Advanced Audio Analysis IPC handlers
    ipcMain.handle('analyze-audio-advanced', async (event, filePath, options) => {
      try {
        return await this.advancedAudioAnalysis.analyzeAudioFile(filePath, options);
      } catch (error) {
        console.error('Error in advanced audio analysis:', error);
        return { error: error.message };
      }
    });

    ipcMain.handle('analyze-audio-ai', async (event, audioData, options) => {
      try {
        return await this.aiAnalysisEngine.performComprehensiveAnalysis(audioData, options);
      } catch (error) {
        console.error('Error in AI audio analysis:', error);
        return { error: error.message };
      }
    });

    ipcMain.handle('analyze-batch-advanced', async (event, filePaths, options) => {
      try {
        return await this.advancedAudioAnalysis.analyzeBatch(filePaths, options);
      } catch (error) {
        console.error('Error in batch advanced analysis:', error);
        return { error: error.message };
      }
    });

    ipcMain.handle('analyze-batch-ai', async (event, audioDataList, options) => {
      try {
        return await this.aiAnalysisEngine.analyzeBatch(audioDataList, options);
      } catch (error) {
        console.error('Error in batch AI analysis:', error);
        return { error: error.message };
      }
    });

    ipcMain.handle('get-analysis-parameters', async () => {
      return {
        advanced: this.advancedAudioAnalysis.analysisOptions,
        ai: this.aiAnalysisEngine.confidenceThreshold
      };
    });

    ipcMain.handle('update-analysis-parameters', async (event, parameters) => {
      try {
        if (parameters.advanced) {
          Object.assign(this.advancedAudioAnalysis.analysisOptions, parameters.advanced);
        }
        if (parameters.ai) {
          this.aiAnalysisEngine.confidenceThreshold = parameters.ai.confidenceThreshold || this.aiAnalysisEngine.confidenceThreshold;
        }
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('get-analysis-stats', async () => {
      return {
        advanced: this.advancedAudioAnalysis.getCacheStats(),
        ai: this.aiAnalysisEngine.getModelStatus()
      };
    });

    ipcMain.handle('clear-analysis-cache', async () => {
      this.advancedAudioAnalysis.clearCache();
      return { success: true };
    });

    ipcMain.handle('get-last-scan-location', async () => {
      return this.scanHistory.getLastScanLocation();
    });

    // Re-add missing handlers
    ipcMain.handle('get-favorite-locations', async () => {
      return await this.scanHistory.getFavoriteLocations();
    });

    ipcMain.handle('get-scan-stats', async () => {
      return await this.scanHistory.getScanStats();
    });



    // Auto-Organization IPC handlers
    ipcMain.handle('organize-files', async (event, files, targetDirectory) => {
      try {
        const results = await this.autoOrganizer.organizeFiles(files, targetDirectory);
        return { success: true, results };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('create-smart-collections', async (event, files) => {
      try {
        const collections = await this.autoOrganizer.createSmartCollections(files);
        return { success: true, collections };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('generate-auto-tags', async (event, file) => {
      try {
        const tags = await this.autoOrganizer.generateAutoTags(file);
        return { success: true, tags };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Confirmation Dialog IPC handlers
    ipcMain.handle('confirm-large-scan', async (event, location, estimatedFiles) => {
      return await this.confirmationManager.confirmLargeScan(location, estimatedFiles);
    });

    ipcMain.handle('confirm-auto-organization', async () => {
      return await this.confirmationManager.confirmAutoOrganization();
    });

    ipcMain.handle('confirm-advanced-scan', async () => {
      return await this.confirmationManager.confirmAdvancedScan();
    });


    ipcMain.handle('get-recent-locations', async () => {
      return await this.scanHistory.getRecentLocations();
    });


    ipcMain.handle('save-scan-history', async (event, scanData) => {
      return await this.scanHistory.saveScanHistory(scanData);
    });

    ipcMain.handle('toggle-favorite-location', async (event, locationPath) => {
      return await this.scanHistory.toggleFavorite(locationPath);
    });




    ipcMain.handle('suggest-smart-collections', async (event, files) => {
      return this.autoOrganizer.suggestSmartCollections(files);
    });

    ipcMain.handle('create-playlist-file', async (event, playlist, outputPath) => {
      return await this.autoOrganizer.createPlaylistFile(playlist, outputPath);
    });

    ipcMain.handle('generate-organization-report', async (event, organizedStructure) => {
      return this.autoOrganizer.generateOrganizationReport(organizedStructure);
    });

    ipcMain.handle('sample-manager-apply-effects', async (event, samplePath, effects, options) => {
      return await this.sampleManager.applyEffects(samplePath, effects, options);
    });

    ipcMain.handle('sample-manager-pitch-shift', async (event, samplePath, semitones, options) => {
      return await this.sampleManager.pitchShift(samplePath, semitones, options);
    });

    ipcMain.handle('sample-manager-time-stretch', async (event, samplePath, factor, options) => {
      return await this.sampleManager.timeStretch(samplePath, factor, options);
    });

    ipcMain.handle('sample-manager-send-to-daw', async (event, daw, sample, options) => {
      return await this.sampleManager.sendToDAW(daw, sample, options);
    });

    ipcMain.handle('sample-manager-sync-cloud', async (event, direction) => {
      return await this.sampleManager.syncWithCloud(direction);
    });

    ipcMain.handle('sample-manager-share-pack', async (event, samplePack, users) => {
      return await this.sampleManager.shareSamplePack(samplePack, users);
    });

    ipcMain.handle('sample-manager-create-version', async (event, sample) => {
      return await this.sampleManager.createVersion(sample);
    });

    ipcMain.handle('sample-manager-integration-status', async () => {
      return await this.sampleManager.getIntegrationStatus();
    });

    ipcMain.handle('sample-manager-natural-search', async (event, query) => {
      return await this.sampleManager.searchWithNaturalLanguage(query);
    });

    ipcMain.handle('sample-manager-smart-recommendations', async (event, context, preferences) => {
      return await this.sampleManager.getSmartRecommendations(context, preferences);
    });
  }

  async scanMusicFolder() {
    const result = await dialog.showOpenDialog(this.mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Music Folder'
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const folderPath = result.filePaths[0];
      try {
        const results = await this.fileScanner.scanFolder(folderPath);
        this.mainWindow.webContents.send('scan-complete', results);
      } catch (error) {
        this.mainWindow.webContents.send('scan-error', error.message);
      }
    }
  }
}

// Enhanced scanning function with proper file type detection
const validExtensions = ['.wav', '.mp3', '.aiff', '.flac'];

function scanFolder(dir) {
  let results = [];
  
  try {
    // Check if directory exists and is accessible before trying to read it
    if (!fs.existsSync(dir)) {
      console.log(`Directory does not exist: ${dir}`);
      return [];
    }
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip system directories and hidden files that might cause permission errors
      if (entry.name.startsWith('.') || 
          entry.name === 'System Volume Information' ||
          entry.name === '.DocumentRevisions-V100' ||
          entry.name === '.Trashes' ||
          entry.name === '.fseventsd' ||
          entry.name === '.Spotlight-V100' ||
          entry.name === 'node_modules' ||
          entry.name === '.git' ||
          entry.name === '.DS_Store') {
        continue;
      }
      
      if (entry.isDirectory()) {
        try {
          results = results.concat(scanFolder(fullPath));
        } catch (error) {
          // Skip directories we can't access (permission denied, etc.)
          console.log(`Skipping inaccessible directory: ${fullPath} (${error.message})`);
          continue;
        }
      } else if (validExtensions.includes(path.extname(fullPath).toLowerCase())) {
        results.push(fullPath);
      }
    }
  } catch (error) {
    // Handle permission errors for the root directory
    console.log(`Cannot access directory: ${dir} (${error.message})`);
    return [];
  }

  return results;
}

// Initialize the app when Electron is ready
app.whenReady().then(async () => {
  const musicApp = new App();
  await musicApp.initialize();
});

module.exports = { App };
