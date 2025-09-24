const { app, BrowserWindow } = require('electron');

console.log('Electron app object:', app);
console.log('App is ready:', app.isReady);

if (app) {
  console.log('Electron is working!');
} else {
  console.log('Electron is not working!');
}


