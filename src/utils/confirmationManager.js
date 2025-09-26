class ConfirmationManager {
  constructor() {
    this.dialogs = new Map();
  }

  async showConfirmation(options) {
    return new Promise((resolve) => {
      const dialogId = this.generateDialogId();
      
      const dialog = {
        id: dialogId,
        title: options.title || 'Confirmation',
        message: options.message || 'Are you sure?',
        type: options.type || 'info', // info, warning, error, success
        buttons: options.buttons || ['Cancel', 'OK'],
        defaultButton: options.defaultButton || 1,
        resolve
      };

      this.dialogs.set(dialogId, dialog);
      this.showDialog(dialog);
    });
  }

  async showScanConfirmation(scanLocation, estimatedFiles) {
    return this.showConfirmation({
      title: 'Start Scan',
      message: `Scan ${scanLocation}?\n\nEstimated files: ${estimatedFiles}\nThis may take several minutes.`,
      type: 'info',
      buttons: ['Cancel', 'Start Scan'],
      defaultButton: 1
    });
  }

  async showMemoryWarning(currentMemory, estimatedMemory) {
    return this.showConfirmation({
      title: 'Memory Warning',
      message: `High memory usage detected!\n\nCurrent: ${currentMemory}MB\nEstimated after scan: ${estimatedMemory}MB\n\nContinue anyway?`,
      type: 'warning',
      buttons: ['Cancel', 'Continue'],
      defaultButton: 0
    });
  }

  async showClearResultsConfirmation() {
    return this.showConfirmation({
      title: 'Clear Results',
      message: 'Are you sure you want to clear all scan results?',
      type: 'warning',
      buttons: ['Cancel', 'Clear'],
      defaultButton: 0
    });
  }

  async showDeleteHistoryConfirmation() {
    return this.showConfirmation({
      title: 'Delete History',
      message: 'Are you sure you want to delete all scan history?',
      type: 'warning',
      buttons: ['Cancel', 'Delete'],
      defaultButton: 0
    });
  }

  showDialog(dialog) {
    // Create dialog element
    const dialogElement = document.createElement('div');
    dialogElement.className = 'confirmation-dialog-overlay';
    dialogElement.innerHTML = `
      <div class="confirmation-dialog">
        <div class="dialog-header">
          <h3 class="dialog-title">${dialog.title}</h3>
          <button class="dialog-close" onclick="window.confirmationManager.closeDialog('${dialog.id}', false)">×</button>
        </div>
        <div class="dialog-body">
          <p class="dialog-message">${dialog.message}</p>
        </div>
        <div class="dialog-footer">
          ${dialog.buttons.map((button, index) => `
            <button class="dialog-button ${index === dialog.defaultButton ? 'primary' : 'secondary'}" 
                    onclick="window.confirmationManager.closeDialog('${dialog.id}', ${index})">
              ${button}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    // Add to DOM
    document.body.appendChild(dialogElement);

    // Add styles if not already added
    if (!document.getElementById('confirmation-styles')) {
      const styles = document.createElement('style');
      styles.id = 'confirmation-styles';
      styles.textContent = `
        .confirmation-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
        }
        
        .confirmation-dialog {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          max-width: 400px;
          width: 90%;
          max-height: 80vh;
          overflow: hidden;
        }
        
        .dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
        }
        
        .dialog-title {
          color: var(--text-primary);
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }
        
        .dialog-close {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .dialog-close:hover {
          color: var(--text-primary);
        }
        
        .dialog-body {
          padding: 1rem;
        }
        
        .dialog-message {
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
          white-space: pre-line;
        }
        
        .dialog-footer {
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
          border-top: 1px solid var(--border-color);
          justify-content: flex-end;
        }
        
        .dialog-button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        
        .dialog-button.primary {
          background: var(--accent-color);
          color: white;
        }
        
        .dialog-button.primary:hover {
          background: var(--accent-hover);
        }
        
        .dialog-button.secondary {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }
        
        .dialog-button.secondary:hover {
          background: var(--bg-primary);
        }
      `;
      document.head.appendChild(styles);
    }
  }

  closeDialog(dialogId, result) {
    const dialog = this.dialogs.get(dialogId);
    if (dialog) {
      dialog.resolve(result);
      this.dialogs.delete(dialogId);
      
      // Remove dialog element
      const dialogElement = document.querySelector('.confirmation-dialog-overlay');
      if (dialogElement) {
        dialogElement.remove();
      }
    }
  }

  generateDialogId() {
    return 'dialog_' + Math.random().toString(36).substr(2, 9);
  }
}

// Make it globally available
if (typeof window !== 'undefined') {
  window.confirmationManager = new ConfirmationManager();
}

module.exports = ConfirmationManager;
