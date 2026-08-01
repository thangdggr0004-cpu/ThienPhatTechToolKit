const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

  // ─── Hardware & Metrics ───────────────────────────────────────────
  getHardwareInfo:    (forceRefresh) => ipcRenderer.invoke('get-hardware-info', forceRefresh),
  getRealtimeMetrics: ()             => ipcRenderer.invoke('get-realtime-metrics'),

  // ─── Window Controls ─────────────────────────────────────────────
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose:    () => ipcRenderer.send('window-close'),

  // ─── App Settings ─────────────────────────────────────────────────
  setAutoStart:    (enabled) => ipcRenderer.invoke('set-auto-start', enabled),
  getAutoStart:    ()        => ipcRenderer.invoke('get-auto-start'),
  setCloseToTray:  (enabled) => ipcRenderer.invoke('set-close-to-tray', enabled),
  cleanRamNow:     ()        => ipcRenderer.invoke('clean-ram-now'),

  // ─── Activation / License ─────────────────────────────────────────
  scanActivation:          (opts) => ipcRenderer.invoke('scan-activation', opts),
  executeActivationAction: (opts) => ipcRenderer.invoke('execute-activation-action', opts),
  deepCleanActivation:     (type) => ipcRenderer.invoke('deep-clean-activation', type),
  restoreOemBiosKey:       ()     => ipcRenderer.invoke('restore-oem-bios-key'),

  // ─── Junk Cleaner ─────────────────────────────────────────────────
  scanJunk:  ()       => ipcRenderer.invoke('scan-junk'),
  cleanJunk: (cats)   => ipcRenderer.invoke('clean-junk', cats),

  // ─── Network ──────────────────────────────────────────────────────
  diagnoseNetwork:   ()     => ipcRenderer.invoke('diagnose-network'),
  applyDns:          (opts) => ipcRenderer.invoke('apply-dns', opts),
  resetNetworkStack: ()     => ipcRenderer.invoke('reset-network-stack'),

  // ─── Office ───────────────────────────────────────────────────────
  applyOfficeStandard:     (opts) => ipcRenderer.invoke('apply-office-standard', opts),
  scanOfficeIntegrity:     ()     => ipcRenderer.invoke('scan-office-integrity'),
  restoreOfficeIntegrity:  ()     => ipcRenderer.invoke('restore-office-integrity'),
  scanOfficeEngineV3:      ()     => ipcRenderer.invoke('scan-office-engine-v3'),
  restoreOfficeEngineV3:   ()     => ipcRenderer.invoke('restore-office-engine-v3'),

  // ─── Backup & Restore ─────────────────────────────────────────────
  listWifiProfiles: ()     => ipcRenderer.invoke('list-wifi-profiles'),
  exportWifi:       ()     => ipcRenderer.invoke('export-wifi'),
  restoreWifi:      ()     => ipcRenderer.invoke('restore-wifi'),
  exportDrivers:    ()     => ipcRenderer.invoke('export-drivers'),
  restoreDrivers:   ()     => ipcRenderer.invoke('restore-drivers'),

  // ─── Printers ─────────────────────────────────────────────────────
  executePrinterAction:       (action) => ipcRenderer.invoke('printer-action', action),
  setDefaultPrinter:          (name)   => ipcRenderer.invoke('set-default-printer', name),
  getPrintQueue:               (name)   => ipcRenderer.invoke('get-print-queue', name),
  printTestPage:               (name)   => ipcRenderer.invoke('print-test-page', name),
  openDeviceManagerPrinters:  ()       => ipcRenderer.invoke('open-device-manager-printers'),
  removeReinstallPrinter:     (name)   => ipcRenderer.invoke('remove-reinstall-printer', name),

  // ─── Windows Settings ─────────────────────────────────────────────
  readWindowsSettings:        ()        => ipcRenderer.invoke('read-windows-settings'),
  applyWindowsSettings:       (settings)=> ipcRenderer.invoke('apply-windows-settings', settings),
  applyTaskbarSettings:       (settings)=> ipcRenderer.invoke('apply-taskbar-settings', settings),
  applySystemOptimization:    (settings)=> ipcRenderer.invoke('apply-system-optimization', settings),
  applyPowerPlan:             (opts)    => ipcRenderer.invoke('apply-power-plan', opts),
  runWindowsFixer:            ()        => ipcRenderer.invoke('run-windows-fixer'),
  resetWindowsUpdate:         ()        => ipcRenderer.invoke('reset-windows-update'),
  rebuildIconCache:           ()        => ipcRenderer.invoke('rebuild-icon-cache'),
  applyAdvancedOptimization:  (opts)    => ipcRenderer.invoke('apply-advanced-optimization', opts),
  restoreAdvancedOptimization:()        => ipcRenderer.invoke('restore-advanced-optimization'),

  // ─── Security ─────────────────────────────────────────────────────
  getDefenderStatus:    ()        => ipcRenderer.invoke('get-defender-status'),
  toggleDefenderStatus: (enable)  => ipcRenderer.invoke('toggle-defender-status', enable),
  getBitlockerStatus:   ()        => ipcRenderer.invoke('get-bitlocker-status'),
  disableBitlocker:     (mp)      => ipcRenderer.invoke('disable-bitlocker', mp),
  backupBitlockerKey:   (mp)      => ipcRenderer.invoke('backup-bitlocker-key', mp),

  // ─── Laptop / Hardware Tests ──────────────────────────────────────
  getBatteryHealth:      () => ipcRenderer.invoke('get-battery-health'),
  openBatteryReportHtml: () => ipcRenderer.invoke('open-battery-report-html'),
  getDiskHealth:         () => ipcRenderer.invoke('get-disk-health'),
  runDxDiag:             () => ipcRenderer.invoke('run-dxdiag'),

  // ─── MAS (Advanced Activation) ────────────────────────────────────
  runMasAction: (mode) => ipcRenderer.invoke('run-mas-action', mode),

  // ─── Dialogs ──────────────────────────────────────────────────────
  showInfoDialog:    (opts) => ipcRenderer.invoke('show-info-dialog', opts),
  showConfirmDialog: (opts) => ipcRenderer.invoke('show-confirm-dialog', opts),

  // ─── Auto Updater ─────────────────────────────────────────────────
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate:  () => ipcRenderer.invoke('download-update'),
  installUpdate:   () => ipcRenderer.invoke('install-update'),
  onUpdaterEvent:  (callback) => ipcRenderer.on('updater-event', (_event, data) => callback(data)),

});
