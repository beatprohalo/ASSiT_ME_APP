const { app, BrowserWindow } = require('electron');

console.log('App object:', app);
console.log('App type:', typeof app);

app.whenReady().then(() => {
  console.log('App is ready!');
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  win.loadFile('index.html');
});

