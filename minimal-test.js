console.log('Starting minimal test...');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);

try {
  const { app, BrowserWindow } = require('electron');
  console.log('Electron imported successfully');
  console.log('App object:', app);
  console.log('App type:', typeof app);
  
  if (app && typeof app.whenReady === 'function') {
    console.log('App.whenReady is available');
  } else {
    console.log('App.whenReady is NOT available');
  }
} catch (error) {
  console.error('Error importing Electron:', error);
}


