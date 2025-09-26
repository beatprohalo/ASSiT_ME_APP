const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { scanFolder } = require('./fileScanner.js'); // Import the scanner function

function createWindow() {
  const win = new BrowserWindow({
    width: 1200, // Wider to accommodate UI
    height: 900, // Taller for better layout
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // In a real app, consider security enhancements like contextIsolation: true
      // and a preload script. For this fix, we keep it simple.
    },
  });

  win.loadFile('index.html');
  // win.webContents.openDevTools(); // Optional: for debugging renderer process

  // Listen for the 'scan-folder' event from the renderer process
  ipcMain.on('scan-folder', (event, folderPath) => {
    // A default path can be used if none is provided, e.g., app.getPath('music')
    const pathToScan = folderPath || app.getPath('music');

    // Check if a path is provided, if not, open a dialog
    if (!folderPath) {
      dialog.showOpenDialog(win, {
        properties: ['openDirectory']
      }).then(result => {
        if (!result.canceled) {
          scanFolder(result.filePaths[0], win.webContents);
        }
      }).catch(err => {
        console.error(err);
      });
    } else {
      scanFolder(pathToScan, win.webContents);
    }
  });
}

app.whenReady().then(() => {
  createWindow();
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create a window when the dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
