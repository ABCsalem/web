const { app, BrowserWindow, ipcMain } = require('electron');
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

  // قراءة بيانات الدخول من config.json وإرسالها إلى renderer
  const configPath = path.join(__dirname, 'config.json');
  fs.readFile(configPath, 'utf8', (err, data) => {
    if (!err) {
      try {
        const config = JSON.parse(data);
        // ننتظر تحميل الصفحة ثم نرسل البيانات
        mainWindow.webContents.on('did-finish-load', () => {
          mainWindow.webContents.send('credentials', config);
        });
      } catch (e) {
        console.error('خطأ في قراءة config.json', e);
        // إرسال بيانات افتراضية للاختبار إذا فشل القراءة
        mainWindow.webContents.on('did-finish-load', () => {
          mainWindow.webContents.send('credentials', { username: 'شعبة القوى البشرية', password: '010203' });
        });
      }
    } else {
      console.error('config.json غير موجود', err);
      // إرسال بيانات افتراضية للاختبار
      mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('credentials', { username: 'شعبة القوى البشرية', password: '010203' });
      });
    }
  });

  mainWindow.loadFile('index.html');

  // فتح أدوات المطور (للتصحيح)
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});