const { dialog } = require('electron');

class ConfirmationDialogs {
  static async confirmScanStart(scanLocation, estimatedFiles) {
    return await dialog.showMessageBox({
      type: 'question',
      buttons: ['Start Scan', 'Cancel'],
      defaultId: 0,
      title: 'Confirm Scan',
      message: `Start scanning ${scanLocation}?`,
      detail: `This scan may find approximately ${estimatedFiles} files. This could take several minutes depending on the number of files.`,
      icon: 'question'
    });
  }

  static async confirmLargeScan(fileCount) {
    return await dialog.showMessageBox({
      type: 'warning',
      buttons: ['Continue', 'Cancel'],
      defaultId: 0,
      title: 'Large Scan Detected',
      message: `This scan will process ${fileCount} files`,
      detail: `Processing this many files may take a significant amount of time and could use substantial memory. Do you want to continue?`,
      icon: 'warning'
    });
  }

  static async confirmClearResults() {
    return await dialog.showMessageBox({
      type: 'question',
      buttons: ['Clear All', 'Cancel'],
      defaultId: 1,
      title: 'Clear Scan Results',
      message: 'Are you sure you want to clear all scan results?',
      detail: 'This action cannot be undone. All current scan results will be lost.',
      icon: 'question'
    });
  }

  static async confirmStopScan() {
    return await dialog.showMessageBox({
      type: 'question',
      buttons: ['Stop Scan', 'Continue'],
      defaultId: 1,
      title: 'Stop Scan',
      message: 'Are you sure you want to stop the current scan?',
      detail: 'Any progress made so far will be lost.',
      icon: 'question'
    });
  }

  static async showScanComplete(results) {
    const { audioFiles, midiFiles, projectFiles, errors } = results;
    const totalFiles = audioFiles + midiFiles + projectFiles;
    
    return await dialog.showMessageBox({
      type: 'info',
      buttons: ['OK'],
      title: 'Scan Complete',
      message: `Scan completed successfully!`,
      detail: `Found ${totalFiles} files:\n• ${audioFiles} audio files\n• ${midiFiles} MIDI files\n• ${projectFiles} project files${errors.length > 0 ? `\n• ${errors.length} errors encountered` : ''}`,
      icon: 'info'
    });
  }

  static async showScanError(error) {
    return await dialog.showErrorBox(
      'Scan Error',
      `An error occurred during scanning: ${error.message}`
    );
  }

  static async confirmMemoryWarning() {
    return await dialog.showMessageBox({
      type: 'warning',
      buttons: ['Continue with Limited Scan', 'Cancel'],
      defaultId: 0,
      title: 'Memory Usage Warning',
      message: 'High memory usage detected',
      detail: 'The system is using a lot of memory. Continuing may cause the application to become unstable. Consider scanning a smaller directory or reducing the file limit.',
      icon: 'warning'
    });
  }

  static async showProgressDialog(progress) {
    // This would be implemented as a custom dialog
    // For now, we'll use a simple message box
    return await dialog.showMessageBox({
      type: 'info',
      buttons: ['OK'],
      title: 'Scan Progress',
      message: `Scanning: ${progress.phase}`,
      detail: `Progress: ${progress.current}/${progress.total} files (${progress.percentage}%)\nEstimated time remaining: ${progress.formattedEstimatedTime || 'Calculating...'}`,
      icon: 'info'
    });
  }
}

module.exports = ConfirmationDialogs;
