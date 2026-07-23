const { contextBridge, ipcRenderer } = require('electron');

// Preload script can be used to safely expose Node/Electron APIs to the renderer
window.addEventListener('DOMContentLoaded', () => {
  console.log('Tech Toolkit Electron Preload loaded successfully');
});

contextBridge.exposeInMainWorld('electronAPI', {
  getHardwareInfo: (forceRefresh) => ipcRenderer.invoke('get-hardware-info', forceRefresh),
  getRealtimeMetrics: () => ipcRenderer.invoke('get-realtime-metrics'),
  scanActivation: () => ipcRenderer.invoke('scan-activation'),
  executeActivationAction: (args) => ipcRenderer.invoke('execute-activation-action', args),
  scanJunk: () => ipcRenderer.invoke('scan-junk'),
  cleanJunk: (categories) => ipcRenderer.invoke('clean-junk', categories),
  getBatteryHealth: () => ipcRenderer.invoke('get-battery-health'),
  getDiskHealth: () => ipcRenderer.invoke('get-disk-health'),
  runDxDiag: () => ipcRenderer.invoke('run-dxdiag'),
  runWindowsFixer: () => ipcRenderer.invoke('run-windows-fixer'),
  resetWindowsUpdate: () => ipcRenderer.invoke('reset-windows-update'),
  rebuildIconCache: () => ipcRenderer.invoke('rebuild-icon-cache'),
  deepCleanKms: () => ipcRenderer.invoke('deep-clean-kms'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdaterEvent: (callback) => {
    ipcRenderer.on('updater-event', (event, data) => callback(data));
  },
  diagnoseNetwork: () => ipcRenderer.invoke('diagnose-network'),
  applyDns: (args) => ipcRenderer.invoke('apply-dns', args),
  applyPowerPlan: (args) => ipcRenderer.invoke('apply-power-plan', args),
  applyOfficeStandard: (args) => ipcRenderer.invoke('apply-office-standard', args),
  // Backup: WiFi
  listWifiProfiles: () => ipcRenderer.invoke('list-wifi-profiles'),
  exportWifi: () => ipcRenderer.invoke('export-wifi'),
  restoreWifi: () => ipcRenderer.invoke('restore-wifi'),
  // Backup: Driver
  exportDrivers: () => ipcRenderer.invoke('export-drivers'),
  restoreDrivers: () => ipcRenderer.invoke('restore-drivers'),
  // BitLocker
  getBitlockerStatus: () => ipcRenderer.invoke('get-bitlocker-status'),
  disableBitlocker: (mountPoint) => ipcRenderer.invoke('disable-bitlocker', mountPoint),
  // Printer Utilities
  executePrinterAction: (action) => ipcRenderer.invoke('printer-action', action),
  setDefaultPrinter: (name) => ipcRenderer.invoke('set-default-printer', name),
  getPrintQueue: (name) => ipcRenderer.invoke('get-print-queue', name),
  printTestPage: (name) => ipcRenderer.invoke('print-test-page', name),
  openDeviceManagerPrinters: () => ipcRenderer.invoke('open-device-manager-printers'),
  removeReinstallPrinter: (name) => ipcRenderer.invoke('remove-reinstall-printer', name),
  // Windows Settings
  readWindowsSettings: () => ipcRenderer.invoke('read-windows-settings'),
  applyWindowsSettings: (settings) => ipcRenderer.invoke('apply-windows-settings', settings),
  applyTaskbarSettings: (settings) => ipcRenderer.invoke('apply-taskbar-settings', settings),
  applySystemOptimization: (settings) => ipcRenderer.invoke('apply-system-optimization', settings),
  applyAdvancedOptimization: (options) => ipcRenderer.invoke('apply-advanced-optimization', options),
  restoreAdvancedOptimization: () => ipcRenderer.invoke('restore-advanced-optimization'),
  // Defender Quick Toggle
  getDefenderStatus: () => ipcRenderer.invoke('get-defender-status'),
  toggleDefenderStatus: (enable) => ipcRenderer.invoke('toggle-defender-status', enable),
  // Advanced MAS Activation
  runMasAction: (mode) => ipcRenderer.invoke('run-mas-action', mode),
  // Window controls
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),
  isElectron: true
});

