declare namespace Electron {
  interface IpcRenderer {
    invoke(channel: string, ...args: any[]): Promise<any>;
    on(channel: string, listener: (event: any, ...args: any[]) => void): void;
    removeAllListeners(channel: string): void;
  }
}

interface ElectronAPI {
  getBitlockerStatus: () => Promise<{ success: boolean; data: string }>;
  disableBitlocker: (mountPoint: string) => Promise<{ success: boolean; error?: string }>;
  getDefenderStatus: () => Promise<{ enabled: boolean }>;
  toggleDefenderStatus: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  listWifiProfiles: () => Promise<Array<{ name: string; password: string; auth: string }>>;
  exportWifi: () => Promise<{ success: boolean; path?: string; error?: string }>;
  restoreWifi: () => Promise<{ success: boolean; count?: number; error?: string }>;
  exportDrivers: () => Promise<{ success: boolean; path?: string; error?: string }>;
  restoreDrivers: () => Promise<{ success: boolean; error?: string }>;
  setAutoStart: (enabled: boolean) => void;
  setCloseToTray: (enabled: boolean) => void;
  cleanRamNow: () => Promise<{ success: boolean; message?: string }>;
  checkForUpdates: () => Promise<{ hasUpdate: boolean; version?: string }>;
  showInfoDialog: (options: { title: string; message: string }) => Promise<void>;
  runPowerShell: (command: string) => Promise<void>;
}

interface Window {
  electronAPI: ElectronAPI;
}
