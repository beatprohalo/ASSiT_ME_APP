class ProgressManager {
  constructor() {
    this.currentProgress = 0;
    this.totalSteps = 100;
    this.currentStep = '';
    this.isActive = false;
    this.startTime = null;
    this.callbacks = [];
  }

  start(totalSteps = 100) {
    this.currentProgress = 0;
    this.totalSteps = totalSteps;
    this.isActive = true;
    this.startTime = Date.now();
    this.notifyCallbacks();
  }

  update(progress, step = '') {
    if (!this.isActive) return;
    
    this.currentProgress = Math.min(progress, this.totalSteps);
    this.currentStep = step;
    this.notifyCallbacks();
  }

  increment(step = '') {
    if (!this.isActive) return;
    
    this.currentProgress = Math.min(this.currentProgress + 1, this.totalSteps);
    this.currentStep = step;
    this.notifyCallbacks();
  }

  complete() {
    this.currentProgress = this.totalSteps;
    this.isActive = false;
    this.notifyCallbacks();
  }

  stop() {
    this.isActive = false;
    this.notifyCallbacks();
  }

  getProgress() {
    return {
      progress: this.currentProgress,
      total: this.totalSteps,
      percentage: Math.round((this.currentProgress / this.totalSteps) * 100),
      step: this.currentStep,
      isActive: this.isActive,
      elapsed: this.startTime ? Date.now() - this.startTime : 0
    };
  }

  onProgress(callback) {
    this.callbacks.push(callback);
  }

  notifyCallbacks() {
    this.callbacks.forEach(callback => {
      try {
        callback(this.getProgress());
      } catch (error) {
        console.error('Error in progress callback:', error);
      }
    });
  }
}

module.exports = ProgressManager;
