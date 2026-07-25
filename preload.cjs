const { contextBridge, ipcRenderer } = require('electron');

// Preload script can be used to safely expose Node/Electron APIs to the renderer
window.addEventListener('DOMContentLoaded', () => {
  console.log('Tech Toolkit Electron Preload loaded successfully');
});

contextBridge.exposeInMainWorld('electronAPI', {
  getHardwareInfo: (forceRefresh) => ipcRenderer.invoke('get-hardware-info', forceRefresh),
  getRealtimeMetrics: () => ipcRenderer.invoke('get-realtime-metrics'),
  scanActivation: (options) => ipcRenderer.invoke('scan-activation', options),
  deepCleanActivation: (type) => ipcRenderer.invoke('deep-clean-activation', type),
  showConfirmDialog: (options) => ipcRenderer.invoke('show-confirm-dialog', options),
  showInfoDialog: (options) => ipcRenderer.invoke('show-info-dialog', options),
  restoreOemBiosKey: () => ipcRenderer.invoke('restore-oem-bios-key'),
  executeActivationAction: (args) => ipcRenderer.invoke('execute-activation-action', args),
  scanJunk: () => ipcRenderer.invoke('scan-junk'),
  cleanJunk: (categories) => ipcRenderer.invoke('clean-junk', categories),
  getBatteryHealth: () => ipcRenderer.invoke('get-battery-health'),
  getDiskHealth: () => ipcRenderer.invoke('get-disk-health'),
  runDxDiag: () => ipcRenderer.invoke('run-dxdiag'),
  runWindowsFixer: () => ipcRenderer.invoke('run-windows-fixer'),
  resetWindowsUpdate: () => ipcRenderer.invoke('reset-windows-update'),
  rebuildIconCache: () => ipcRenderer.invoke('rebuild-icon-cache'),
  deepCleanKms: (type) => ipcRenderer.invoke('deep-clean-kms', type),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdaterEvent: (callback) => {
    ipcRenderer.on('updater-event', (event, data) => callback(data));
  },
  diagnoseNetwork: () => ipcRenderer.invoke('diagnose-network'),
  applyDns: (args) => ipcRenderer.invoke('apply-dns', args),
  applyPowerPlan: (args) => ipcRenderer.invoke('apply-power-plan', args),
  // Office Utilities
  applyOfficeStandard: (options) => ipcRenderer.invoke('apply-office-standard', options),
  scanOfficeIntegrity: () => ipcRenderer.invoke('scan-office-integrity'),
  restoreOfficeIntegrity: () => ipcRenderer.invoke('restore-office-integrity'),
  scanOfficeDeepV2: () => ipcRenderer.invoke('scan-office-deep-v2'),
  restoreOfficeDeepV2: () => ipcRenderer.invoke('restore-office-deep-v2'),
  scanOfficeEngineV3: () => ipcRenderer.invoke('scan-office-engine-v3'),
  restoreOfficeEngineV3: () => ipcRenderer.invoke('restore-office-engine-v3'),
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
  // App Settings
  setAutoStart: (enabled) => ipcRenderer.invoke('set-auto-start', enabled),
  getAutoStart: () => ipcRenderer.invoke('get-auto-start'),
  setCloseToTray: (enabled) => ipcRenderer.invoke('set-close-to-tray', enabled),
  cleanRamNow: () => ipcRenderer.invoke('clean-ram-now'),
  // Window controls
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),
  isElectron: true
});

