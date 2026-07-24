const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // From LicenseManager
  scanActivation: () => ipcRenderer.invoke('scan-activation'),
  deepCleanActivation: (type) => ipcRenderer.invoke('deep-clean-activation', type),
  showConfirmDialog: (options) => ipcRenderer.invoke('show-confirm-dialog', options),
  showInfoDialog: (options) => ipcRenderer.invoke('show-info-dialog', options),

  // From OfficeStandardizer
  applyOfficeStandard: (options) => ipcRenderer.invoke('apply-office-standard', options),

  // From WindowsSettings
  readWindowsSettings: () => ipcRenderer.invoke('read-windows-settings'),
  applyWindowsSettings: (settings) => ipcRenderer.invoke('apply-windows-settings', settings),
  applyTaskbarSettings: (settings) => ipcRenderer.invoke('apply-taskbar-settings', settings),
  applySystemOptimization: (settings) => ipcRenderer.invoke('apply-system-optimization', settings),
  runWindowsFixer: () => ipcRenderer.invoke('run-windows-fixer'),
  resetWindowsUpdate: () => ipcRenderer.invoke('reset-windows-update'),
  rebuildIconCache: () => ipcRenderer.invoke('rebuild-icon-cache'),
  applyPowerPlan: (options) => ipcRenderer.invoke('apply-power-plan', options),
  applyAdvancedOptimization: (options) => ipcRenderer.invoke('apply-advanced-optimization', options),
  restoreAdvancedOptimization: () => ipcRenderer.invoke('restore-advanced-optimization'),

  // From App
  getRealtimeMetrics: () => ipcRenderer.invoke('get-realtime-metrics'),
});