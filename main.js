const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const { runPipeline } = require('./diagnosticPipeline.js');

let mainWindow;

function traceMain(stage, channel, meta) {
    const ts = new Date().toISOString();
    if (meta !== undefined) {
        console.log(`[MAIN][${ts}][${channel}] ${stage}`, meta);
    } else {
        console.log(`[MAIN][${ts}][${channel}] ${stage}`);
    }
}

// Helper to run PowerShell scripts robustly
function runPowerShell(script) {
    const tempDir = os.tmpdir();
    const scriptPath = path.join(tempDir, `tpt-script-${Date.now()}.ps1`);
    const startedAt = Date.now();

    // Use UTF8 with BOM for PowerShell to correctly handle special characters
    fs.writeFileSync(scriptPath, "\ufeff" + script, { encoding: 'utf8' });
    traceMain('powershell-script-written', 'powershell', { scriptPath });

    const command = `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`;
    traceMain('powershell-exec-start', 'powershell', { command });

    return new Promise((resolve, reject) => {
        exec(command, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
            try {
                if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath); // Clean up the script file
            } catch (cleanupErr) {
                console.warn(`Failed to cleanup temp PowerShell script: ${cleanupErr.message}`);
            }

            const durationMs = Date.now() - startedAt;

            if (error) {
                console.error(`PowerShell Error: ${error.message}`);
                console.error(`PowerShell Stderr: ${stderr}`);
                traceMain('powershell-exec-error', 'powershell', { durationMs, message: error.message, stderr });
                return reject(new Error(`Lỗi thực thi PowerShell: ${stderr || error.message}`));
            }
            if (stderr) {
                console.warn(`PowerShell Stderr: ${stderr}`);
            }

            traceMain('powershell-exec-success', 'powershell', {
                durationMs,
                stdoutLength: typeof stdout === 'string' ? stdout.length : 0
            });
            resolve(stdout);
        });
    });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Securely expose IPC functions via a preload script
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // Recommended for security
      contextIsolation: true, // Recommended for security
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

// --- IPC Handlers ---

ipcMain.handle('scan-activation', async (event, payload) => {
    traceMain('request-received', 'scan-activation', { payload });
    try {
        const script = `
        $ErrorActionPreference = 'SilentlyContinue'
        $result = @{
            Windows = @{}
            Office  = @{}
            System  = @{}
        }

        # --- Windows Scan ---
        $winInfo = Get-CimInstance -ClassName SoftwareLicensingProduct | Where-Object { $_.Name -like 'Windows*' -and $_.PartialProductKey } | Select-Object -First 1
        if ($winInfo) {
            $result.Windows.LicenseFamily = $winInfo.LicenseFamily
            $result.Windows.Description = $winInfo.Description
            $result.Windows.LicenseStatus = $winInfo.LicenseStatus
            $result.Windows.PartialProductKey = $winInfo.PartialProductKey
            $result.Windows.ProductKeyChannel = $winInfo.ProductKeyChannel
            $result.Windows.KeyManagementServiceMachine = $winInfo.KeyManagementServiceMachine
            $result.Windows.IsGenericKey = if ($winInfo.Description -like '*GVLK*') { $true } else { $false }
            $result.Windows.Channel = $winInfo.ProductKeyChannel
        }

        try {
            $oa3key = (Get-CimInstance -ClassName SoftwareLicensingService).OA3xOriginalProductKey
            if ($oa3key) {
                $result.Windows.HasOA3Key = $true
                $result.Windows.OA3Key = $oa3key.Substring($oa3key.Length - 5)
            } else { $result.Windows.HasOA3Key = $false }
        } catch { $result.Windows.HasOA3Key = $false }

        # --- Office Scan ---
        $officeProducts = Get-CimInstance -ClassName OfficeSoftwareProtectionProduct -ErrorAction SilentlyContinue
        $result.Office.Products = @()
        if($officeProducts) {
            foreach ($prod in $officeProducts) {
                if($prod.PartialProductKey){
                    $result.Office.Products += @{
                        Name = $prod.Name; Description = $prod.Description; LicenseStatus = $prod.LicenseStatus;
                        PartialProductKey = $prod.PartialProductKey; KeyManagementServiceMachine = $prod.KeyManagementServiceMachine
                    }
                }
            }
        }

        $officePath = ""
        if (Test-Path "C:\\Program Files\\Microsoft Office\\Office16") { $officePath = "C:\\Program Files\\Microsoft Office\\Office16" }
        elseif (Test-Path "C:\\Program Files (x86)\\Microsoft Office\\Office16") { $officePath = "C:\\Program Files (x86)\\Microsoft Office\\Office16" }
        elseif (Test-Path "C:\\Program Files\\Microsoft Office\\Office15") { $officePath = "C:\\Program Files\\Microsoft Office\\Office15" }
        elseif (Test-Path "C:\\Program Files (x86)\\Microsoft Office\\Office15") { $officePath = "C:\\Program Files (x86)\\Microsoft Office\\Office15" }

        if ($officePath -ne "" -and (Test-Path (Join-Path $officePath "ospp.vbs"))) {
            $dstatus = cscript //nologo (Join-Path $officePath "ospp.vbs") /dstatus
            $result.Office.Dstatus = $dstatus -join \\\`n
        }

        # --- System Crack Footprints ---
        $result.System.PiratedFiles = @()
        $piratePaths = "C:\\Program Files\\AutoKMS", "C:\\Program Files\\KMSpico", "C:\\Program Files\\Microsoft Toolkit", "C:\\Windows\\AutoKMS", "C:\\Windows\\KMS-R@1n", "C:\\Windows\\SECOH-QAD"
        foreach ($p in $piratePaths) { if (Test-Path $p) { $result.System.PiratedFiles += $p } }

        $result.System.SuspiciousTasks = @()
        Get-ScheduledTask | Where-Object { $_.TaskName -like '*KMS*' -or $_.TaskName -like '*AutoPico*' -or $_.TaskName -like '*Office*Renewal*' -or ($_.Actions.Execute -match 'KMS|AutoKMS|KMSpico')} | ForEach-Object {
            $result.System.SuspiciousTasks += @{ Name = $_.TaskName; Action = ($_.Actions | Select-Object -ExpandProperty Execute) }
        }

        $result.System.SuspiciousServices = @()
        Get-Service | Where-Object { $_.Name -like '*KMS*' -or $_.DisplayName -like '*KMS*' -or $_.Name -like 'SECOH-QAD' } | ForEach-Object { $result.System.SuspiciousServices += $_.Name }

        $result.System.HostsRedirects = @()
        try {
            $hostsContent = Get-Content "C:\\Windows\\System32\\drivers\\etc\\hosts"
            foreach ($line in $hostsContent) { if (($line -notlike '#*') -and ($line -like '*kms*' -or $line -like '*microsoft.com*')) { $result.System.HostsRedirects += $line } }
        } catch {}

        $result.Office.OhookFiles = @()
        if (Test-Path "$env:ProgramFiles\\Common Files\\Microsoft Shared\\OfficeSoftwareProtectionPlatform\\osppc.dll") { $result.Office.OhookFiles += "osppc.dll" }

        $result | ConvertTo-Json -Depth 5
    `;
        const jsonResult = await runPowerShell(script);

        let evidenceMatrix;
        try {
            evidenceMatrix = JSON.parse(jsonResult);
        } catch (parseErr) {
            traceMain('json-parse-error', 'scan-activation', { parseError: parseErr.message, raw: jsonResult });
            throw new Error(`Không thể parse JSON từ PowerShell: ${parseErr.message}`);
        }

        // The Orchestrator's only job is to call the pipeline.
        // All business logic is encapsulated within the pipeline.
        const finalReport = runPipeline(evidenceMatrix);

        traceMain('request-success', 'scan-activation');
        // The Public Contract returns the final report from the pipeline,
        // ensuring the frontend receives the processed assessment.
        return finalReport;
    } catch (err) {
        traceMain('request-error', 'scan-activation', { message: err.message });
        throw err;
    }
});

ipcMain.handle('deep-clean-activation', async (event, type) => {
    traceMain('request-received', 'deep-clean-activation', { type });
    try {
        let script = '';
        if (type === 'windows') {
            script = `
            cscript //nologo C:\\Windows\\System32\\slmgr.vbs /upk
            cscript //nologo C:\\Windows\\System32\\slmgr.vbs /cpky
            cscript //nologo C:\\Windows\\System32\\slmgr.vbs /rearm
            "Hoàn tất gỡ bản quyền Windows. Vui lòng khởi động lại máy."
        `;
        } else if (type === 'office') {
            script = `
            $officePath = ""
            if (Test-Path "C:\\Program Files\\Microsoft Office\\Office16") { $officePath = "C:\\Program Files\\Microsoft Office\\Office16" }
            elseif (Test-Path "C:\\Program Files (x86)\\Microsoft Office\\Office16") { $officePath = "C:\\Program Files (x86)\\Microsoft Office\\Office16" }
            
            if ($officePath -ne "" -and (Test-Path (Join-Path $officePath "ospp.vbs"))) {
                $ospp = Join-Path $officePath "ospp.vbs"
                $status = cscript //nologo $ospp /dstatus
                $keys = $status | Select-String -Pattern "Last 5 characters of installed product key: " | ForEach-Object { $_.ToString().Split(':').Trim()[-1] }
                
                $log = @()
                if ($keys.Length -gt 0) {
                    foreach ($key in $keys) { $log += cscript //nologo $ospp /unpkey:$key }
                } else {
                    $log += "Không tìm thấy Product Key nào của Office để gỡ bỏ."
                }
                $log -join \`n
            } else { "Không tìm thấy tệp ospp.vbs để reset bản quyền Office." }
        `;
        }

        if (script) {
            const output = await runPowerShell(script);
            traceMain('request-success', 'deep-clean-activation');
            return output;
        }

        traceMain('request-success', 'deep-clean-activation', { note: 'invalid-type' });
        return "Loại không hợp lệ.";
    } catch (err) {
        traceMain('request-error', 'deep-clean-activation', { message: err.message });
        throw err;
    }
});

ipcMain.handle('restore-oem-bios-key', async () => {
    traceMain('request-received', 'restore-oem-bios-key');
    try {
        const script = `
        $ErrorActionPreference = 'Stop'
        $oa3 = (Get-CimInstance -ClassName SoftwareLicensingService).OA3xOriginalProductKey
        if (-not $oa3) {
            throw "Không tìm thấy OEM key trong BIOS."
        }

        cscript //nologo C:\\Windows\\System32\\slmgr.vbs /upk | Out-Null
        cscript //nologo C:\\Windows\\System32\\slmgr.vbs /cpky | Out-Null
        cscript //nologo C:\\Windows\\System32\\slmgr.vbs /ipk $oa3 | Out-Null
        $ato = cscript //nologo C:\\Windows\\System32\\slmgr.vbs /ato

        "Đã khôi phục OEM key thành công. Kết quả kích hoạt:\`n$($ato -join \`n)"
    `;
        const output = await runPowerShell(script);
        traceMain('request-success', 'restore-oem-bios-key');
        return output;
    } catch (err) {
        traceMain('request-error', 'restore-oem-bios-key', { message: err.message });
        throw err;
    }
});

ipcMain.handle('show-confirm-dialog', async (event, options) => {
    traceMain('request-received', 'show-confirm-dialog', { options });
    try {
        const result = await dialog.showMessageBox(mainWindow, {
            type: options?.type || 'question',
            buttons: ['Hủy', 'OK'],
            defaultId: 1,
            title: options?.title,
            message: options?.message,
        });
        const confirmed = result.response === 1;
        traceMain('request-success', 'show-confirm-dialog', { confirmed });
        return confirmed;
    } catch (err) {
        traceMain('request-error', 'show-confirm-dialog', { message: err.message });
        throw err;
    }
});

ipcMain.handle('show-info-dialog', async (event, options) => {
    traceMain('request-received', 'show-info-dialog', { options });
    try {
        const result = await dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: options?.title,
            message: options?.message,
        });
        traceMain('request-success', 'show-info-dialog', { response: result.response });
        return result;
    } catch (err) {
        traceMain('request-error', 'show-info-dialog', { message: err.message });
        throw err;
    }
});

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
