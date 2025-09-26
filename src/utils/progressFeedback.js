class ProgressFeedback {
  constructor() {
    this.currentProgress = 0;
    this.totalFiles = 0;
    this.currentPhase = '';
    this.startTime = null;
    this.estimatedTime = 0;
    this.callbacks = [];
  }

  start(totalFiles, phase = 'Scanning') {
    this.totalFiles = totalFiles;
    this.currentProgress = 0;
    this.currentPhase = phase;
    this.startTime = Date.now();
    this.estimatedTime = 0;
    this.notifyCallbacks();
  }

  update(processedFiles, phase = null) {
    this.currentProgress = processedFiles;
    if (phase) {
      this.currentPhase = phase;
    }
    
    // Calculate estimated time remaining
    if (this.currentProgress > 0 && this.startTime) {
      const elapsed = Date.now() - this.startTime;
      const rate = this.currentProgress / elapsed;
      const remaining = this.totalFiles - this.currentProgress;
      this.estimatedTime = remaining / rate;
    }
    
    this.notifyCallbacks();
  }

  complete() {
    this.currentProgress = this.totalFiles;
    this.currentPhase = 'Complete';
    this.estimatedTime = 0;
    this.notifyCallbacks();
  }

  getProgress() {
    const percentage = this.totalFiles > 0 ? (this.currentProgress / this.totalFiles) * 100 : 0;
    return {
      current: this.currentProgress,
      total: this.totalFiles,
      percentage: Math.round(percentage),
      phase: this.currentPhase,
      estimatedTime: this.estimatedTime,
      elapsedTime: this.startTime ? Date.now() - this.startTime : 0
    };
  }

  addCallback(callback) {
    this.callbacks.push(callback);
  }

  removeCallback(callback) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  notifyCallbacks() {
    const progress = this.getProgress();
    this.callbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Error in progress callback:', error);
      }
    });
  }

  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  getFormattedProgress() {
    const progress = this.getProgress();
    return {
      ...progress,
      formattedEstimatedTime: this.formatTime(progress.estimatedTime),
      formattedElapsedTime: this.formatTime(progress.elapsedTime)
    };
  }
}

module.exports = ProgressFeedback;
