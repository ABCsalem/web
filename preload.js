const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getCredentials: () => new Promise((resolve) => {
    ipcRenderer.once('credentials', (event, data) => {
      resolve(data);
    });
  }),
});