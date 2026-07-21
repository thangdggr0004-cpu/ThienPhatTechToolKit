const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Để React gọi trực tiếp các tính năng của Node.js
    }
  });

  // Khi đang phát triển (development), load từ localhost của Vite
  // Khi đã đóng gói (production), load file index.html trong thư mục dist
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(createWindow);

// --- ĐÂY LÀ PHẦN QUAN TRỌNG: Tiếp nhận yêu cầu chạy lệnh trực tiếp từ React ---
ipcMain.handle('execute-windows-command', async (event, command) => {
  return new Promise((resolve) => {
    // exec sẽ thực thi trực tiếp các lệnh CMD hoặc PowerShell trên Windows của bạn
    exec(command, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, log: error.message });
        return;
      }
      resolve({ success: true, log: stdout || stderr });
    });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});