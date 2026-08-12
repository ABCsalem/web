const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getCredentials: () => new Promise((resolve) => {
    ipcRenderer.once('credentials', (event, data) => {
      resolve(data);
    });
  }),
});
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // تسجيل الدخول
  login: (username, password) => ipcRenderer.invoke('login', username, password),
  // جلب قائمة المستخدمين
  getUsers: () => ipcRenderer.invoke('get-users'),
  // إضافة مستخدم جديد
  addUser: (username, password, quotas, isAdmin) => ipcRenderer.invoke('add-user', username, password, quotas, isAdmin),
  // تحديث ملاكات مستخدم
  updateUserQuotas: (username, quotas) => ipcRenderer.invoke('update-user-quotas', username, quotas),
  // حذف مستخدم
  deleteUser: (username) => ipcRenderer.invoke('delete-user', username),
});