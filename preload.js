const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // From LicenseManager
  scanActivation:       () => ipcRenderer.invoke('scan-activation'),
  deepCleanActivation:  (type) => ipcRenderer.invoke('deep-clean-activation', type),
  showConfirmDialog:    (options) => ipcRenderer.invoke('show-confirm-dialog', options),
  showInfoDialog:       (options) => ipcRenderer.invoke('show-info-dialog', options),
});