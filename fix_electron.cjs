const fs = require('fs');
const file = 'electron.cjs';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `        [System.GC]::WaitForPendingFinalizers()
    try {
      if (global.__realtimeCache && Date.now() - global.__realtimeCache.ts < 3000) {`;

const replacement = `        [System.GC]::WaitForPendingFinalizers()
        Get-Process | ForEach-Object { try { $_.EmptyWorkingSet() } catch {} }
        Write-Output "OK"
      \`;
      await runPowerShellScriptElevated(script);
      return { success: true, message: 'Đã tự động giải phóng bộ nhớ RAM!' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('get-hardware-info', async (event, forceRefresh) => {
    // Return cached data immediately if available and not forcing refresh
    if (__hardwareCache && !forceRefresh) {
      return __hardwareCache.data;
    }
    // Otherwise wait for fresh data with a timeout to prevent infinite spinning in UI
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout fetching hardware info")), 15000));
      const info = await Promise.race([getRealHardwareInfo(), timeoutPromise]);
      __hardwareCache = { ts: Date.now(), data: info };
      writeDiskCache(info);
      return info;
    } catch (err) {
      console.error("Error fetching hardware info:", err);
      // Return null so the UI catches and falls back to mock data
      return null;
    }
  });

  ipcMain.handle('get-realtime-metrics', async () => {
    try {
      if (global.__realtimeCache && Date.now() - global.__realtimeCache.ts < 3000) {`;

content = content.replace(targetStr, replacement);
fs.writeFileSync(file, content);
console.log('Fixed electron.cjs');
