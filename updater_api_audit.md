Existing updater IPC:
- `ipcMain.handle('check-for-updates', ...)`
- `ipcMain.handle('download-update', ...)`
- `ipcMain.handle('install-update', ...)`
- `win.webContents.send('updater-event', { type, ... })`

Existing preload APIs:
- `scanActivation`
- `deepCleanActivation`
- `showConfirmDialog`
- `showInfoDialog`
- `getHardwareInfo`

Required change:
The `preload.cjs` script is missing the exports for all updater-related functions. It needs to expose `checkForUpdates`, `downloadUpdate`, `installUpdate`, and `onUpdaterEvent` on the `electronAPI` object.
