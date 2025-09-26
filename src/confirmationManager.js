const { dialog } = require('electron');

class ConfirmationManager {
  constructor() {
    this.defaultOptions = {
      type: 'question',
      buttons: ['Yes', 'No'],
      defaultId: 0,
      cancelId: 1
    };
  }

  async confirmScan(location, estimatedFiles = 0) {
    const options = {
      ...this.defaultOptions,
      title: 'Confirm Scan',
      message: `Start scanning ${location}?`,
      detail: estimatedFiles > 0 
        ? `Estimated files to scan: ${estimatedFiles}\nThis may take several minutes.`
        : 'This may take several minutes.',
      buttons: ['Start Scan', 'Cancel']
    };

    const result = await dialog.showMessageBox(options);
    return result.response === 0;
  }

  async confirmLargeScan(location, estimatedFiles) {
    const options = {
      ...this.defaultOptions,
      type: 'warning',
      title: 'Large Scan Detected',
      message: `This scan will process approximately ${estimatedFiles} files.`,
      detail: 'This may take a very long time and use significant system resources.\n\nDo you want to continue?',
      buttons: ['Continue', 'Cancel']
    };

    const result = await dialog.showMessageBox(options);
    return result.response === 0;
  }

  async confirmClearHistory() {
    const options = {
      ...this.defaultOptions,
      type: 'warning',
      title: 'Clear Scan History',
      message: 'Are you sure you want to clear all scan history?',
      detail: 'This action cannot be undone.',
      buttons: ['Clear History', 'Cancel']
    };

    const result = await dialog.showMessageBox(options);
    return result.response === 0;
  }

  async confirmDeleteScan(scanId) {
    const options = {
      ...this.defaultOptions,
      type: 'warning',
      title: 'Delete Scan Record',
      message: 'Are you sure you want to delete this scan record?',
      detail: 'This action cannot be undone.',
      buttons: ['Delete', 'Cancel']
    };

    const result = await dialog.showMessageBox(options);
    return result.response === 0;
  }

  async showScanComplete(results) {
    const options = {
      type: 'info',
      title: 'Scan Complete',
      message: `Scan completed successfully!`,
      detail: `Found ${results.totalFiles} files:\n• Audio files: ${results.audioFiles}\n• MIDI files: ${results.midiFiles}\n• Project files: ${results.projectFiles}${results.errors.length > 0 ? `\n• Errors: ${results.errors.length}` : ''}`,
      buttons: ['OK']
    };

    await dialog.showMessageBox(options);
  }

  async showScanError(error) {
    const options = {
      type: 'error',
      title: 'Scan Error',
      message: 'An error occurred during scanning',
      detail: error.message || error.toString(),
      buttons: ['OK']
    };

    await dialog.showMessageBox(options);
  }

  async confirmAutoOrganization() {
    const options = {
      ...this.defaultOptions,
      title: 'Auto-Organization',
      message: 'Enable automatic file organization?',
      detail: 'This will automatically organize your scanned files into folders based on their type and metadata.',
      buttons: ['Enable', 'Skip']
    };

    const result = await dialog.showMessageBox(options);
    return result.response === 0;
  }

  async confirmAdvancedScan() {
    const options = {
      ...this.defaultOptions,
      title: 'Advanced Scan Options',
      message: 'Use advanced scanning with AI analysis?',
      detail: 'This will enable AI-powered file analysis, auto-tagging, and smart categorization. It may take longer but provides better results.',
      buttons: ['Enable Advanced', 'Standard Scan']
    };

    const result = await dialog.showMessageBox(options);
    return result.response === 0;
  }
}

module.exports = ConfirmationManager;
