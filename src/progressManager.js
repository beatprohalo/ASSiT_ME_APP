class ProgressManager {
  constructor() {
    this.currentProgress = {
      isScanning: false,
      currentFile: '',
      filesProcessed: 0,
      totalFiles: 0,
      percentage: 0,
      startTime: null,
      estimatedTimeRemaining: 0,
      currentPhase: 'Initializing...',
      errors: []
    };
    this.listeners = [];
  }

  startScan(totalFiles = 0) {
    this.currentProgress = {
      isScanning: true,
      currentFile: '',
      filesProcessed: 0,
      totalFiles,
      percentage: 0,
      startTime: Date.now(),
      estimatedTimeRemaining: 0,
      currentPhase: 'Starting scan...',
      errors: []
    };
    this.notifyListeners();
  }

  updateProgress(filesProcessed, currentFile = '', phase = '') {
    this.currentProgress.filesProcessed = filesProcessed;
    this.currentProgress.currentFile = currentFile;
    this.currentProgress.percentage = this.currentProgress.totalFiles > 0 
      ? Math.round((filesProcessed / this.currentProgress.totalFiles) * 100) 
      : 0;
    
    if (phase) {
      this.currentProgress.currentPhase = phase;
    }

    // Calculate estimated time remaining
    if (filesProcessed > 0 && this.currentProgress.startTime) {
      const elapsed = Date.now() - this.currentProgress.startTime;
      const avgTimePerFile = elapsed / filesProcessed;
      const remainingFiles = this.currentProgress.totalFiles - filesProcessed;
      this.currentProgress.estimatedTimeRemaining = Math.round((remainingFiles * avgTimePerFile) / 1000);
    }

    this.notifyListeners();
  }

  addError(error) {
    this.currentProgress.errors.push({
      message: error,
      timestamp: new Date().toISOString()
    });
    this.notifyListeners();
  }

  completeScan() {
    this.currentProgress.isScanning = false;
    this.currentProgress.currentPhase = 'Scan completed';
    this.currentProgress.percentage = 100;
    this.notifyListeners();
  }

  getProgress() {
    return { ...this.currentProgress };
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.getProgress());
      } catch (error) {
        console.error('Error in progress listener:', error);
      }
    });
  }

  reset() {
    this.currentProgress = {
      isScanning: false,
      currentFile: '',
      filesProcessed: 0,
      totalFiles: 0,
      percentage: 0,
      startTime: null,
      estimatedTimeRemaining: 0,
      currentPhase: 'Ready',
      errors: []
    };
    this.notifyListeners();
  }
}

module.exports = ProgressManager;
