const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const { Database } = require('./database/database');
const { FileScanner } = require('./scanner/fileScanner');

class App {
  constructor() {
    this.mainWindow = null;
    this.database = null;
    this.fileScanner = null;
    this.isDev = process.argv.includes('--dev');
  }

  async initialize() {
    // Initialize database
    this.database = new Database();
    await this.database.initialize();
    
    // Initialize file scanner
    this.fileScanner = new FileScanner(this.database);
    
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
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 700,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true
      },
      titleBarStyle: 'hiddenInset',
      show: false
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
    // File scanning
    ipcMain.handle('scan-folder', async (event, folderPath) => {
      try {
        const results = await this.fileScanner.scanFolder(folderPath);
        return { success: true, results };
      } catch (error) {
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

// Initialize the app when Electron is ready
app.whenReady().then(async () => {
  const musicApp = new App();
  await musicApp.initialize();
});

module.exports = { App };
