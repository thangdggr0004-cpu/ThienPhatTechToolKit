const { contextBridge, ipcRenderer } = require('electron');

const invokeWithTrace = async (channel, ...args) => {
  const ts = new Date().toISOString();
  console.debug(`[PRELOAD][${ts}] invoke -> ${channel}`, args[0]);
  try {
    const result = await ipcRenderer.invoke(channel, ...args);
    console.debug(`[PRELOAD][${new Date().toISOString()}] result <- ${channel}`, result);
    return result;
  } catch (error) {
    console.error(`[PRELOAD][${new Date().toISOString()}] error <- ${channel}`, error);
    throw error;
  }
};

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // From LicenseManager
  scanActivation:       (payload) => invokeWithTrace('scan-activation', payload),
  deepCleanActivation:  (type) => invokeWithTrace('deep-clean-activation', type),
  restoreOemBiosKey:    () => invokeWithTrace('restore-oem-bios-key'),
  showConfirmDialog:    (options) => invokeWithTrace('show-confirm-dialog', options),
  showInfoDialog:       (options) => invokeWithTrace('show-info-dialog', options),
});
