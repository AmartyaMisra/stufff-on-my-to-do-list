const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('blackops', {
  fetchStations: (tag) => ipcRenderer.invoke('fetch-stations', tag),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  closeWindow: () => ipcRenderer.send('window-close')
});
