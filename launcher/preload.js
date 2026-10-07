const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  getApps: () => ipcRenderer.invoke('get-apps'),
  onApps: cb => ipcRenderer.on('apps', (_e, a) => cb(a)),
  onReset: cb => ipcRenderer.on('reset', cb),
  launch: lnk => ipcRenderer.send('launch', lnk),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSettings: s => ipcRenderer.send('set-settings', s),
  setAutostart: on => ipcRenderer.send('set-autostart', on),
  hide: () => ipcRenderer.send('hide'),
  setOverride: (name, mode) => ipcRenderer.send('set-override', name, mode),
});

