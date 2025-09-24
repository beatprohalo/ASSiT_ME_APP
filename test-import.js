console.log('Testing Electron import...');

try {
  const electron = require('electron');
  console.log('Electron module loaded:', typeof electron);
  console.log('Electron keys:', Object.keys(electron));
  
  const { app, BrowserWindow } = electron;
  console.log('App:', typeof app);
  console.log('BrowserWindow:', typeof BrowserWindow);
  
  if (app) {
    console.log('App methods:', Object.getOwnPropertyNames(app));
  }
} catch (error) {
  console.error('Error loading Electron:', error);
}

