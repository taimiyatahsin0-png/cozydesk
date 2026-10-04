const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('cozy', {
  systemAction: (key) => ipcRenderer.invoke('system-action', key)
});
