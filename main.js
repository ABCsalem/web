const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const configPath = path.join(__dirname, 'config.json');
  fs.readFile(configPath, 'utf8', (err, data) => {
    if (!err) {
      try {
        const config = JSON.parse(data);
        mainWindow.webContents.on('did-finish-load', () => {
          mainWindow.webContents.send('credentials', config);
        });
      } catch (e) {
        console.error('خطأ في قراءة config.json', e);
        mainWindow.webContents.on('did-finish-load', () => {
          mainWindow.webContents.send('credentials', { username: 'شعبة القوى البشرية', password: '010203' });
        });
      }
    } else {
      console.error('config.json غير موجود', err);
      mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('credentials', { username: 'شعبة القوى البشرية', password: '010203' });
      });
    }
  });

  mainWindow.loadFile('index.html');
  // mainWindow.webContents.openDevTools(); // اختياري
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});