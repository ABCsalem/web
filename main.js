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

  mainWindow.loadFile('index.html');
  // mainWindow.webContents.openDevTools(); // اختياري
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ----- قراءة وكتابة users.json -----
const usersFilePath = path.join(__dirname, 'users.json');

function readUsers() {
  try {
    if (fs.existsSync(usersFilePath)) {
      const data = fs.readFileSync(usersFilePath, 'utf8');
      return JSON.parse(data);
    } else {
      // إنشاء ملف افتراضي مع مستخدم admin
      const defaultUsers = {
        admin: {
          password: 'admin123',
          isAdmin: true,
          quotas: { officers: 20, soldiers: 50, employees: 10 }
        }
      };
      fs.writeFileSync(usersFilePath, JSON.stringify(defaultUsers, null, 2));
      return defaultUsers;
    }
  } catch (e) {
    console.error('خطأ في قراءة users.json:', e);
    return {};
  }
}

function writeUsers(users) {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('خطأ في كتابة users.json:', e);
  }
}

// ----- معالجات IPC -----
ipcMain.handle('login', async (event, username, password) => {
  const users = readUsers();
  const user = users[username];
  if (user && user.password === password) {
    return {
      success: true,
      isAdmin: user.isAdmin || false,
      quotas: user.quotas || { officers: 0, soldiers: 0, employees: 0 }
    };
  }
  return { success: false };
});

ipcMain.handle('get-users', async () => {
  return readUsers();
});

ipcMain.handle('add-user', async (event, username, password, quotas, isAdmin = false) => {
  const users = readUsers();
  if (users[username]) {
    return { success: false, error: 'المستخدم موجود بالفعل' };
  }
  users[username] = {
    password,
    isAdmin,
    quotas
  };
  writeUsers(users);
  return { success: true };
});

ipcMain.handle('update-user-quotas', async (event, username, quotas) => {
  const users = readUsers();
  if (!users[username]) {
    return { success: false, error: 'المستخدم غير موجود' };
  }
  users[username].quotas = quotas;
  writeUsers(users);
  return { success: true };
});

ipcMain.handle('delete-user', async (event, username) => {
  const users = readUsers();
  if (username === 'admin') {
    return { success: false, error: 'لا يمكن حذف المدير الرئيسي' };
  }
  if (!users[username]) {
    return { success: false, error: 'المستخدم غير موجود' };
  }
  delete users[username];
  writeUsers(users);
  return { success: true };
});