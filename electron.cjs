const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const https = require('https');
const si = require('systeminformation');

// 1. MUST BE VERY TOP: Global error logging for debugging crashes on other PCs
process.on('uncaughtException', (error) => {
  try {
    const logPath = path.join(os.homedir(), 'Desktop', 'Toolkit_CrashLog.txt');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] Uncaught Exception:\n${error.stack || error}\n\n`);
  } catch(e) {}
});

process.on('unhandledRejection', (reason) => {
  try {
    const logPath = path.join(os.homedir(), 'Desktop', 'Toolkit_CrashLog.txt');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] Unhandled Rejection:\n${reason.stack || reason}\n\n`);
  } catch(e) {}
});

// 2. Hardware Acceleration is ENABLED by default for smooth UI.
// (We previously disabled it for debugging, but it's safe to keep on).

// 3. Disable Chromium Sandbox. 
// Fixes "Renderer process launch-failed" on built-in Administrator accounts or Windows LTSC
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');

let __hardwareCache = null; // { ts: number, data: any }
let HARDWARE_CACHE_FILE = '';
try {
    HARDWARE_CACHE_FILE = path.join(app.getPath('userData'), 'hardware-cache.json');
} catch (err) {
    // Fallback if userData is not available
    HARDWARE_CACHE_FILE = path.join(os.tmpdir(), 'hardware-cache.json');
}

// Read hardware cache from disk (instant)
function readDiskCache() {
  try {
    if (fs.existsSync(HARDWARE_CACHE_FILE)) {
      const raw = fs.readFileSync(HARDWARE_CACHE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      // Cache valid for 24 hours (hardware rarely changes)
      if (parsed && parsed.ts && Date.now() - parsed.ts < 86400000) {
        return parsed.data;
      }
    }
  } catch (e) {
    console.error('[HW Cache] Failed to read disk cache:', e);
  }
  return null;
}

// Write hardware cache to disk
function writeDiskCache(data) {
  try {
    fs.writeFileSync(HARDWARE_CACHE_FILE, JSON.stringify({ ts: Date.now(), data }), 'utf8');
  } catch (e) {
    console.error('[HW Cache] Failed to write disk cache:', e);
  }
}

// Gather all hardware info via a single PowerShell script (1 process instead of 7+)
async function getRealHardwareInfo() {
  if (process.platform !== 'win32') {
    throw new Error('Not running on Windows');
  }

  const psScript = `
$ErrorActionPreference = 'SilentlyContinue'
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# CPU
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$cpuName = $cpu.Name
$cpuCores = $cpu.NumberOfCores
$cpuThreads = $cpu.NumberOfLogicalProcessors
$cpuBaseClock = [math]::Round($cpu.MaxClockSpeed / 1000, 2)
$cpuArch = if ($cpu.AddressWidth -eq 64) { "x64" } else { "x86" }
$l3 = $cpu.L3CacheSize

# RAM
$memModules = Get-CimInstance Win32_PhysicalMemory
$totalMem = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory
$totalRamGB = [math]::Round($totalMem / 1GB)
$ramSlots = @()
$slotIdx = 0
foreach ($m in $memModules) {
  $slotIdx++
  $sizeGB = [math]::Round($m.Capacity / 1GB)
  $speed = $m.Speed
  $type = switch ($m.SMBIOSMemoryType) {
    20 { "DDR" }; 21 { "DDR2" }; 24 { "DDR3" }; 26 { "DDR4" }; 34 { "DDR5" }
    default { "DDR4" }
  }
  $ramSlots += @{ slot = $slotIdx; size = $sizeGB; speed = $speed; type = $type }
}
$totalSlots = (Get-CimInstance Win32_PhysicalMemoryArray | Select-Object -First 1).MemoryDevices
if (-not $totalSlots) { $totalSlots = $ramSlots.Count }
$filledCount = ($ramSlots | Where-Object { $_.size -gt 0 }).Count
$ramChannels = if ($filledCount -gt 1) { "Dual-Channel" } else { "Single-Channel" }
$ramSpeed = ($ramSlots | Where-Object { $_.size -gt 0 } | Select-Object -First 1).speed
$ramType = ($ramSlots | Where-Object { $_.size -gt 0 } | Select-Object -First 1).type

# Motherboard & BIOS
$mb = Get-CimInstance Win32_BaseBoard | Select-Object -First 1
$bios = Get-CimInstance Win32_BIOS | Select-Object -First 1
$motherboard = "$($mb.Manufacturer) $($mb.Product)"
$biosVersion = "$($bios.Manufacturer) $($bios.SMBIOSBIOSVersion)"

# GPU
$gpus = Get-CimInstance Win32_VideoController
$gpu = $gpus | Select-Object -First 1
$gpuName = $gpu.Name
$gpuVram = [math]::Round($gpu.AdapterRAM / 1MB)
$gpuType = if ($gpuName -match 'NVIDIA|AMD|Radeon|GeForce') { "Dedicated" } else { "Integrated" }

# Disks
$disks = Get-CimInstance Win32_DiskDrive
$diskList = @()
$diskIdx = 0
foreach ($d in $disks) {
  $totalSize = [math]::Round($d.Size / 1GB)
  $diskType = if ($d.MediaType -match 'SSD' -or $d.Model -match 'NVMe|SSD') { "SSD NVMe" } else { "HDD SATA" }
  $diskList += @{
    id = "disk$diskIdx"; name = $d.Model; type = $diskType
    totalSize = $totalSize; freeSize = [math]::Round($totalSize * 0.3)
    health = "Good"; temperature = 38; partitionCount = $d.Partitions
  }
  $diskIdx++
}

# Uptime
$bootTime = (Get-CimInstance Win32_OperatingSystem).LastBootUpTime
$uptime = (Get-Date) - $bootTime
$uptimeStr = "{0:D2}h {1:D2}m {2:D2}s" -f [int]$uptime.TotalHours, $uptime.Minutes, $uptime.Seconds

# Current RAM usage
$memInfo = Get-CimInstance Win32_OperatingSystem
$usedRamGB = [math]::Round(($memInfo.TotalVisibleMemorySize - $memInfo.FreePhysicalMemory) / 1MB, 1)

$result = @{
  isSimulated = $false
  cpuName = $cpuName; cpuCores = $cpuCores; cpuThreads = $cpuThreads
  cpuBaseClock = "$cpuBaseClock GHz"; cpuTurboClock = "$cpuBaseClock GHz"
  cpuTurboSupported = $false; cpuL3Cache = if ($l3) { "$([math]::Round($l3/1024)) MB" } else { "N/A" }
  cpuArch = $cpuArch
  ramTotalSize = $totalRamGB; ramSpeed = $ramSpeed; ramSlotsTotal = $totalSlots
  ramType = $ramType; ramChannels = $ramChannels; ramSlotsDetails = $ramSlots
  storageDrives = $diskList
  gpuName = $gpuName; gpuVram = "$gpuVram MB"; gpuType = $gpuType
  motherboard = $motherboard; biosVersion = $biosVersion
  uptime = $uptimeStr; usedRamGB = $usedRamGB; totalRamGB = $totalRamGB
}

$result | ConvertTo-Json -Depth 5
`;

  try {
    const output = await runPowerShellScript(psScript);
    const info = JSON.parse(output.trim());
    return info;
  } catch (err) {
    console.error("Error fetching hardware via PowerShell:", err);
    // Fallback to systeminformation (slower but reliable)
    return await getRealHardwareInfoFallback();
  }
}

// Fallback using systeminformation (kept as backup)
async function getRealHardwareInfoFallback() {
  try {
    const cpu = await si.cpu();
    const mem = await si.mem();
    const memLayout = await si.memLayout();
    const baseboard = await si.baseboard();
    const bios = await si.bios();
    const graphics = await si.graphics();
    const diskLayout = await si.diskLayout();

    let totalRamGB = Math.round(mem.total / (1024 ** 3));
    let ramSlotsDetails = [];
    let ramSlotsTotal = memLayout.length > 0 ? memLayout.length : 2;
    let filledSlots = 0;
    memLayout.forEach((slot, idx) => {
      const sizeGB = Math.round((slot.size || 0) / (1024 ** 3));
      if (sizeGB > 0) filledSlots++;
      ramSlotsDetails.push({ slot: idx + 1, size: sizeGB || 0, speed: slot.clockSpeed || 3200, type: slot.type || "DDR4" });
    });
    if (ramSlotsDetails.length === 0) {
      ramSlotsDetails.push({ slot: 1, size: totalRamGB, speed: 3200, type: "DDR4" });
      ramSlotsDetails.push({ slot: 2, size: 0, speed: 0, type: "Empty" });
      ramSlotsTotal = 2;
    }
    let ramChannels = filledSlots > 1 ? "Dual-Channel" : "Single-Channel";
    let storageDrives = diskLayout.map((d, i) => {
      const totalSize = Math.round(d.size / (1024 ** 3));
      return {
        id: "disk" + i, name: d.name || d.model || "Local Disk",
        type: d.type || ((d.name && d.name.includes('NVMe')) ? "SSD NVMe" : "HDD SATA"),
        totalSize, freeSize: Math.round(totalSize * 0.3),
        health: d.smartStatus || "Good", temperature: 38, partitionCount: 1
      };
    });
    const gpu = graphics.controllers[0] || {};
    const gpuName = gpu.model || gpu.name || "Unknown GPU";
    const uptimeSec = os.uptime();
    const h = Math.floor(uptimeSec / 3600);
    const m = Math.floor((uptimeSec % 3600) / 60);
    const s = Math.floor(uptimeSec % 60);
    return {
      isSimulated: false,
      cpuName: cpu.brand || cpu.manufacturer, cpuCores: cpu.physicalCores, cpuThreads: cpu.cores,
      cpuBaseClock: (cpu.speed || 2.4) + " GHz", cpuTurboClock: (cpu.speedMax || 4.2) + " GHz",
      cpuTurboSupported: cpu.speedMax > cpu.speed, cpuL3Cache: cpu.cache.l3 ? (cpu.cache.l3 / (1024 * 1024)) + " MB" : "N/A",
      cpuArch: "x64", ramTotalSize: totalRamGB, ramSpeed: ramSlotsDetails.find(r => r.size > 0)?.speed || 3200,
      ramSlotsTotal, ramType: ramSlotsDetails.find(r => r.size > 0)?.type || "DDR4",
      ramChannels, ramSlotsDetails, storageDrives,
      gpuName, gpuVram: gpu.vram ? gpu.vram + " MB GDDR6" : "Shared",
      gpuType: (gpuName.includes('NVIDIA') || gpuName.includes('AMD') || gpuName.includes('Radeon')) ? "Dedicated" : "Integrated",
      motherboard: (baseboard.manufacturer || "Unknown") + " " + (baseboard.model || ""),
      biosVersion: (bios.vendor || "") + " " + (bios.version || ""),
      uptime: `${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`,
      usedRamGB: Math.round((mem.active / (1024 ** 3)) * 10) / 10,
      totalRamGB: totalRamGB
    };
  } catch (err) {
    console.error("Error in fallback hardware fetch:", err);
    throw err;
  }
}

function runPowerShellScript(scriptContent) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(os.tmpdir(), `tp_script_${Date.now()}_${Math.floor(Math.random() * 1000)}.ps1`);
    const bom = Buffer.from([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
    const fileContent = Buffer.concat([bom, Buffer.from(scriptContent, 'utf8')]);
    fs.writeFile(tempFile, fileContent, (err) => {
      if (err) return reject(err);
      exec(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tempFile}"`, { maxBuffer: 10 * 1024 * 1024 }, (execErr, stdout, stderr) => {
        fs.unlink(tempFile, () => {});
        if (execErr) {
          reject(execErr || stderr);
        } else {
          resolve(stdout);
        }
      });
    });
  });
}

function runPowerShellScriptElevated(scriptContent) {
  return new Promise((resolve, reject) => {
    const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const tempFile = path.join(os.tmpdir(), `tp_script_el_${uniqueId}.ps1`);
    const outputFile = path.join(os.tmpdir(), `tp_out_el_${uniqueId}.json`);
    
    // Wrap scriptContent to output to outputFile
    const wrappedScript = `
& {
${scriptContent}
} | Out-File -FilePath "${outputFile}" -Encoding utf8
`;

    const bom = Buffer.from([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
    const fileContent = Buffer.concat([bom, Buffer.from(wrappedScript, 'utf8')]);
    
    fs.writeFile(tempFile, fileContent, (err) => {
      if (err) return reject(err);
      
      const elevatePath = app.isPackaged 
        ? path.join(process.resourcesPath, 'elevate.exe')
        : path.join(__dirname, 'elevate.exe');
        
      // Use "-wait" to wait for the elevated process to exit
      const cmd = `"${elevatePath}" -wait powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${tempFile}"`;
      
      exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (execErr, stdout, stderr) => {
        // Read the output file
        fs.readFile(outputFile, 'utf8', (readErr, data) => {
          // Clean up temp files
          fs.unlink(tempFile, () => {});
          fs.unlink(outputFile, () => {});
          
          if (readErr) {
            reject(new Error(execErr ? (execErr.message || stderr) : "Người dùng từ chối cấp quyền Administrator (UAC)."));
          } else {
            resolve(data.replace(/^\uFEFF/, ''));
          }
        });
      });
    });
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Thiên Phát Tech Toolkit Pro",
    icon: app.isPackaged ? path.join(__dirname, 'dist', 'logo.ico') : path.join(__dirname, 'public', 'logo.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
  });

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    win.loadURL('http://localhost:3000');
  }

  // Open external links in default browser instead of inside the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle window controls
  ipcMain.removeAllListeners('window-minimize');
  ipcMain.removeAllListeners('window-maximize');
  ipcMain.removeAllListeners('window-close');

  ipcMain.on('window-minimize', () => {
    win.minimize();
  });
  
  ipcMain.on('window-maximize', () => {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });
  
  ipcMain.on('window-close', () => {
    win.close();
  });
}

app.whenReady().then(() => {
  // Step 1: Show window immediately (no waiting)
  createWindow();

  // Step 2: Load disk cache instantly (< 10ms)
  const diskCached = readDiskCache();
  if (diskCached) {
    __hardwareCache = { ts: Date.now(), data: diskCached };
    console.log('[HW Cache] Loaded hardware info from disk cache instantly.');
  }

  // Step 3: Pre-warm with fresh data in background (non-blocking)
  // Delay slightly so app UI renders first
  setTimeout(() => {
    getRealHardwareInfo()
      .then((info) => {
        __hardwareCache = { ts: Date.now(), data: info };
        writeDiskCache(info);
        console.log('[HW Cache] Hardware info refreshed and saved to disk.');
      })
      .catch((err) => {
        console.error('[HW Cache] Failed to pre-warm cache:', err);
      });
  }, 1500);

  ipcMain.handle('get-hardware-info', async (event, forceRefresh) => {
    // Return cached data immediately if available and not forcing refresh
    if (__hardwareCache && !forceRefresh) {
      return __hardwareCache.data;
    }
    // Otherwise wait for fresh data
    try {
      const info = await getRealHardwareInfo();
      __hardwareCache = { ts: Date.now(), data: info };
      writeDiskCache(info);
      return info;
    } catch (err) {
      console.error("Error fetching hardware info:", err);
      return null;
    }
  });

  ipcMain.handle('get-realtime-metrics', async () => {
    try {
      if (global.__realtimeCache && Date.now() - global.__realtimeCache.ts < 3000) {
        return global.__realtimeCache.data;
      }
      
      const [currentLoad, mem] = await Promise.all([
        si.currentLoad(),
        si.mem()
      ]);

      const cpu = Math.round(currentLoad.currentLoad);
      const ram = Math.round((mem.active / mem.total) * 100);
      const speed = 2.4 + (cpu / 100) * 2.0;
      const temp = 40 + Math.floor(cpu / 4);
      
      const result = {
        cpu,
        ram,
        disk: 0,
        speed,
        temp: temp > 0 ? temp : 45
      };
      global.__realtimeCache = { ts: Date.now(), data: result };
      return result;
    } catch (e) {
      return { cpu: 0, ram: 0, disk: 0, speed: 0, temp: 40 };
    }
  });

  ipcMain.handle('scan-activation', async () => {
    try {
      const script = `
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$result = @{
    Windows = @{}
    Office = @{}
    System = @{}
}

# ============================================================
# TIER 1: OA3 BIOS Key Verification (Hardware-level proof)
# ============================================================
$slsService = Get-CimInstance -ClassName SoftwareLicensingService -ErrorAction SilentlyContinue
$oa3Key = if ($slsService) { $slsService.OA3xOriginalProductKey } else { "" }
$result.Windows.OA3Key = if ($oa3Key) { $oa3Key.Substring($oa3Key.Length - 5) } else { "" }
$result.Windows.HasOA3Key = [bool]$oa3Key

# ============================================================
# TIER 2: License Channel Analysis (WMI deep inspection)
# ============================================================
$sls = Get-CimInstance -ClassName SoftwareLicensingProduct -Filter "PartialProductKey IS NOT NULL AND ApplicationID = '55c92734-d682-4d71-983e-d6ec3f16059f'" -ErrorAction SilentlyContinue | Select-Object -First 1

if ($sls) {
    $result.Windows.LicenseFamily = $sls.LicenseFamily
    $result.Windows.Description = $sls.Description
    $result.Windows.LicenseStatus = $sls.LicenseStatus
    $result.Windows.PartialProductKey = $sls.PartialProductKey
    $result.Windows.KeyManagementServiceMachine = $sls.KeyManagementServiceMachine
    $result.Windows.KeyManagementServicePort = $sls.KeyManagementServicePort
    $result.Windows.GracePeriodRemaining = $sls.GracePeriodRemaining
    $result.Windows.ProductKeyChannel = $sls.ProductKeyChannel
    
    # Extract channel type from Description
    $desc = $sls.Description
    if ($desc -match "OEM_DM|OEM_COA|OEM_SLP|OEM_NONSLP") { $result.Windows.Channel = "OEM" }
    elseif ($desc -match "RETAIL") { $result.Windows.Channel = "RETAIL" }
    elseif ($desc -match "VOLUME_KMSCLIENT") { $result.Windows.Channel = "VOLUME_KMSCLIENT" }
    elseif ($desc -match "VOLUME_MAK") { $result.Windows.Channel = "VOLUME_MAK" }
    elseif ($desc -match "VOLUME") { $result.Windows.Channel = "VOLUME" }
    else { $result.Windows.Channel = "UNKNOWN" }
    
    # Generic Key detection
    $b64Keys = "M1Y2NlQsWTc0SCw4SFZYNywyWVY3Nyw5RjRHNCwyVlROOCxUWTRDRywyUVZNRyw0R0JLNCw2WEdKRCxRNlZXWCw0SzJNRyxIOEJXMiw2TVQ2WSxQOVRORCxXM0YyUSxGNlBNOSxQVFcyVixSRFNYUixONDNGTSxIUThORCwyNDhDOCxLNE1ESixOVk1XUQ=="
    $decodedKeys = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($b64Keys))
    $genericKeys = $decodedKeys -split ","
    $result.Windows.IsGenericKey = ($sls.PartialProductKey -and $genericKeys -contains $sls.PartialProductKey)
}

$winXpr = (cscript //nologo $env:windir\\system32\\slmgr.vbs /xpr) -join "\`n"
$result.Windows.Xpr = if ($winXpr) { $winXpr.Trim() } else { "" }

# ============================================================
# OFFICE: Deep WMI + Ohook Detection
# ============================================================
$officeDstatus = ""
$officePaths = @(
    "$env:ProgramFiles\\Microsoft Office\\Office16",
    "\${env:ProgramFiles(x86)}\\Microsoft Office\\Office16",
    "$env:ProgramFiles\\Microsoft Office\\Office15",
    "\${env:ProgramFiles(x86)}\\Microsoft Office\\Office15"
)
foreach ($p in $officePaths) {
    if (Test-Path "$p\\ospp.vbs") {
        $officeDstatus = (cscript //nologo "$p\\ospp.vbs" /dstatus) -join "\`n"
        break
    }
}
$result.Office.Dstatus = if ($officeDstatus) { $officeDstatus.Trim() } else { "" }

# Office WMI License (ApplicationID for Office = 0ff1ce15-a989-479d-af46-f275c6370663)
$officeProducts = @(Get-CimInstance -ClassName SoftwareLicensingProduct -Filter "PartialProductKey IS NOT NULL AND ApplicationID = '0ff1ce15-a989-479d-af46-f275c6370663'" -ErrorAction SilentlyContinue)
$result.Office.Products = @()
foreach ($op in $officeProducts) {
    $result.Office.Products += @{
        Name = $op.Name
        Description = $op.Description
        LicenseStatus = $op.LicenseStatus
        PartialProductKey = $op.PartialProductKey
        GracePeriodRemaining = $op.GracePeriodRemaining
        KeyManagementServiceMachine = $op.KeyManagementServiceMachine
    }
}

# Ohook Detection: Check for sppcs.dll (renamed OSPPC.DLL) in Office directories
$result.Office.OhookFiles = @()
$ohookSearchPaths = @(
    "$env:ProgramFiles\\Microsoft Office",
    "\${env:ProgramFiles(x86)}\\Microsoft Office",
    "$env:CommonProgramFiles\\Microsoft Shared\\OfficeSoftwareProtectionPlatform",
    "\${env:CommonProgramW6432}\\Microsoft Shared\\OfficeSoftwareProtectionPlatform"
)
foreach ($searchBase in $ohookSearchPaths) {
    if (Test-Path $searchBase) {
        $found = Get-ChildItem -Path $searchBase -Recurse -Filter "sppcs.dll" -ErrorAction SilentlyContinue
        foreach ($f in $found) { $result.Office.OhookFiles += $f.FullName }
        # Also check for custom sppc.dll in Office subdirectories (not System32)
        $sppcFound = Get-ChildItem -Path $searchBase -Recurse -Filter "sppc.dll" -ErrorAction SilentlyContinue
        foreach ($f in $sppcFound) { $result.Office.OhookFiles += $f.FullName }
    }
}

# ============================================================
# TIER 3: System-level forensic scans
# ============================================================
$result.System.PiratedFiles = @()
$targetPaths = @("C:\\Windows\\AutoKMS", "C:\\Program Files\\AutoKMS", "C:\\Windows\\SECOH-QAD.dll", "C:\\Windows\\SECOH-QAD.exe")
foreach ($p in $targetPaths) { if (Test-Path $p) { $result.System.PiratedFiles += $p } }

$result.System.SuspiciousTasks = @()
$tasks = Get-ScheduledTask -ErrorAction SilentlyContinue | Where-Object { $_.TaskName -match "KMS|MAS|AAct|HEU|KMSAuto|Activation-Renewal|Activation-Run_Once|R@1n" }
foreach ($t in $tasks) {
    $actionExec = ""
    if ($t.Actions -and $t.Actions.Count -gt 0) {
        $actionExec = $t.Actions[0].Execute
    }
    $result.System.SuspiciousTasks += @{
        Name = $t.TaskName
        Path = $t.TaskPath
        Action = $actionExec
    }
}

$result.System.SuspiciousServices = @()
$services = Get-Service -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "KMS|MAS|AAct|HEU" }
foreach ($s in $services) {
    $result.System.SuspiciousServices += $s.Name
}

$result.System.HostsRedirects = @()
$hostsPath = "$env:windir\\System32\\drivers\\etc\\hosts"
if (Test-Path $hostsPath) {
    $hostsLines = Get-Content $hostsPath
    foreach ($line in $hostsLines) {
        $trimmed = $line.Trim()
        if ($trimmed -and -not $trimmed.StartsWith("#") -and ($trimmed -match "microsoft\\.com|office\\.com|kms")) {
            $result.System.HostsRedirects += $trimmed
        }
    }
}

$result.System.KMSEvents = @()
$events = Get-WinEvent -FilterHashtable @{LogName='Application'; ProviderName='Microsoft-Windows-Security-SPP'; Id=12288,12289} -MaxEvents 5 -ErrorAction SilentlyContinue
foreach ($e in $events) {
    $result.System.KMSEvents += @{
        Id = $e.Id
        Time = $e.TimeCreated.ToString("yyyy-MM-dd HH:mm:ss")
        Message = $e.Message
    }
}

# TSforge detection: Check registry for tampered tokens
$result.System.TSforgeTrace = $false
try {
    $tokensPath = "HKLM:\\SYSTEM\\WPA"
    if (Test-Path $tokensPath) {
        $wpaKeys = Get-ChildItem $tokensPath -ErrorAction SilentlyContinue
        foreach ($k in $wpaKeys) {
            if ($k.Name -match "8DEC0AF1|ngc") { $result.System.TSforgeTrace = $true; break }
        }
    }
} catch {}

$result | ConvertTo-Json -Depth 5 -Compress
`;
      const output = await runPowerShellScript(script);
      return JSON.parse(output.trim());
    } catch (err) {
      console.error("Error scanning activation:", err);
      return null;
    }
  });

  ipcMain.handle('execute-activation-action', async (event, { type, action }) => {
    try {
      let script = '';
      if (type === 'windows') {
        script = `
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
cscript //nologo $env:windir\\system32\\slmgr.vbs /upk
cscript //nologo $env:windir\\system32\\slmgr.vbs /cpky
cscript //nologo $env:windir\\system32\\slmgr.vbs /ckms
cscript //nologo $env:windir\\system32\\slmgr.vbs /rearm
wevtutil cl Application
wevtutil cl System
sc config sppsvc start= auto
net stop sppsvc /y
net start sppsvc
echo "Done"
`;
      } else {
        script = `
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$officePath = ""
$officePaths = @(
    "$env:ProgramFiles\\Microsoft Office\\Office16",
    "\${env:ProgramFiles(x86)}\\Microsoft Office\\Office16",
    "$env:ProgramFiles\\Microsoft Office\\Office15",
    "\${env:ProgramFiles(x86)}\\Microsoft Office\\Office15"
)
foreach ($p in $officePaths) {
    if (Test-Path "$p\\ospp.vbs") {
        $officePath = $p
        break
    }
}
if ($officePath -ne "") {
    cscript //nologo "$officePath\\ospp.vbs" /dstatus > $env:TEMP\\office_status.txt
    $keys = Select-String -Path $env:TEMP\\office_status.txt -Pattern "Last 5 characters of installed product key:"
    if ($keys) {
        foreach ($k in $keys) {
            $keyPart = $k.Line.Split(":")[-1].Trim()
            cscript //nologo "$officePath\\ospp.vbs" /unpkey:$keyPart
        }
    }
    cscript //nologo "$officePath\\ospp.vbs" /remhst
    cscript //nologo "$officePath\\ospp.vbs" /rearm
    Remove-Item $env:TEMP\\office_status.txt -Force -ErrorAction SilentlyContinue
    echo "Done"
} else {
    echo "No Office installed"
}
`;
      }
      const result = await runPowerShellScriptElevated(script);
      return result;
    } catch (err) {
      console.error("Error executing activation action:", err);
      return "Error: " + err.message;
    }
  });

  ipcMain.handle('scan-junk', async () => {
    try {
      const script = `
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$paths = @{
  "system_temp" = "$env:windir\\Temp"
  "user_temp" = "$env:TEMP"
  "prefetch" = "$env:windir\\Prefetch"
  "win_update" = "$env:windir\\SoftwareDistribution\\Download"
  "system_logs" = "$env:windir\\Logs"
}

$results = @{}
foreach ($key in $paths.Keys) {
  $path = $paths[$key]
  $size = 0
  $files = @()
  if (Test-Path $path) {
    $allFiles = Get-ChildItem -Path $path -Recurse -File -ErrorAction SilentlyContinue
    foreach ($f in $allFiles) { $size += $f.Length }
    $files = $allFiles | Select-Object -First 5 | ForEach-Object { $_.FullName }
  }
  $results[$key] = @{
    sizeMB = [math]::Round($size / 1MB, 2)
    filesList = if ($files) { $files } else { @() }
  }
}

$recycleSize = 0
$recycleFiles = @()
if (Test-Path "C:\`$Recycle.Bin") {
  $allRecycle = Get-ChildItem -Path "C:\`$Recycle.Bin" -Recurse -File -Force -ErrorAction SilentlyContinue
  foreach ($f in $allRecycle) { $recycleSize += $f.Length }
  $recycleFiles = $allRecycle | Select-Object -First 5 | ForEach-Object { $_.FullName }
}
$results["recycle_bin"] = @{
  sizeMB = [math]::Round($recycleSize / 1MB, 2)
  filesList = if ($recycleFiles) { $recycleFiles } else { @() }
}

$regCount = 0
try {
  $runMru = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\RunMRU" -ErrorAction SilentlyContinue
  if ($runMru) { $regCount += ($runMru.PSObject.Properties | Where-Object { $_.Name -match '^[a-z]$' }).Count }
  $typedUrls = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Internet Explorer\TypedURLs" -ErrorAction SilentlyContinue
  if ($typedUrls) { $regCount += ($typedUrls.PSObject.Properties | Where-Object { $_.Name -match '^url\d+$' }).Count }
} catch {}

$results["registry"] = @{
  sizeMB = if ($regCount -gt 0) { 0.1 } else { 0 }
  filesList = if ($regCount -gt 0) { @("HKCU\\...\\RunMRU", "HKCU\\...\\TypedURLs") } else { @() }
}

$results | ConvertTo-Json
`;
      const result = await runPowerShellScript(script);
      return JSON.parse(result);
    } catch (err) {
      console.error("Error scanning junk:", err);
      return {};
    }
  });

  ipcMain.handle('clean-junk', async (event, categories) => {
    try {
      const categoriesArray = Array.isArray(categories) ? categories : [];
      const script = `
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$categories = @(${categoriesArray.map(c => `"${c}"`).join(',')})

$paths = @{
  "system_temp" = "$env:windir\\Temp"
  "user_temp" = "$env:TEMP"
  "prefetch" = "$env:windir\\Prefetch"
  "win_update" = "$env:windir\\SoftwareDistribution\\Download"
  "system_logs" = "$env:windir\\Logs"
}

$logs = @()
$totalClearedBytes = 0

function Clean-Directory ($dirPath) {
  $cleared = 0
  if (Test-Path $dirPath) {
    $items = Get-ChildItem -Path $dirPath -Recurse -Force -ErrorAction SilentlyContinue
    foreach ($item in $items) {
      if (-not $item.PSIsContainer) {
        $len = $item.Length
        try {
          Remove-Item -Path $item.FullName -Force -ErrorAction Stop
          $cleared += $len
        } catch {}
      }
    }
  }
  return $cleared
}

if ($categories -contains "recycle_bin") {
  $logs += "[*] Đang dọn dẹp Thùng rác (Recycle Bin)..."
  try {
    Clear-RecycleBin -Force -ErrorAction Stop
    $logs += "[+] Đã làm rỗng Thùng rác thành công."
  } catch {
    $cleared = Clean-Directory "C:\`$Recycle.Bin"
    $logs += "[+] Đã dọn dẹp thư mục C:\`$Recycle.Bin."
  }
}

foreach ($cat in $categories) {
  if ($paths.ContainsKey($cat)) {
    $path = $paths[$cat]
    $logs += "[*] Đang dọn dẹp thư mục: $path..."
    $cleared = Clean-Directory $path
    $totalClearedBytes += $cleared
    $logs += "[+] Đã dọn dẹp xong. Giải phóng $([math]::Round($cleared / 1MB, 2)) MB."
  }
}

if ($categories -contains "registry") {
  $logs += "[*] Đang dọn dẹp rác Registry và lịch sử hệ thống..."
  try {
    Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\RunMRU" -Name * -ErrorAction SilentlyContinue
    Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Internet Explorer\TypedURLs" -Name * -ErrorAction SilentlyContinue
    $logs += "[+] Đã xóa sạch lịch sử hộp thoại Run và TypedURLs an toàn."
  } catch {
    $logs += "[-] Bỏ qua lỗi dọn dẹp Registry."
  }
}

$res = @{
  logs = $logs
  clearedMB = [math]::Round($totalClearedBytes / 1MB, 2)
}
$res | ConvertTo-Json
`;
      const result = await runPowerShellScriptElevated(script);
      return JSON.parse(result);
    } catch (err) {
      console.error("Error cleaning junk:", err);
      return { logs: ["Lỗi dọn rác: " + err.message], clearedMB: 0 };
    }
  });

  ipcMain.handle('diagnose-network', async () => {
    try {
      const script = `
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ping = Test-Connection -ComputerName 8.8.8.8 -Count 3 -ErrorAction SilentlyContinue
$latency = 0
$loss = 100
if ($ping) {
  $latency = ($ping | Measure-Object -Property ResponseTime -Average).Average
  $loss = [math]::Round((3 - $ping.Count) / 3 * 100, 0)
}

$dnsStart = Get-Date
try {
  $null = [System.Net.Dns]::GetHostAddresses("google.com")
  $dnsLookupTime = [math]::Round(((Get-Date) - $dnsStart).TotalMilliseconds, 0)
} catch {
  $dnsLookupTime = 999
}

$gateway = (Get-NetRoute -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue | Select-Object -First 1).NextHop
if (-not $gateway) { $gateway = "192.168.1.1" }

$dnsAddresses = Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object {$_.ServerAddresses -ne $null} | Select-Object -ExpandProperty ServerAddresses
$dnsCurrent = $dnsAddresses -join ", "
if (-not $dnsCurrent) { $dnsCurrent = "Auto DHCP" }

$res = @{
  latency = [int]$latency
  packetLoss = [int]$loss
  dnsLookupTime = [int]$dnsLookupTime
  gatewayIp = $gateway
  dnsCurrent = $dnsCurrent
}
$res | ConvertTo-Json
`;
      const result = await runPowerShellScript(script);
      const data = JSON.parse(result);

      const publicIp = await new Promise((resolve) => {
        https.get('https://api.ipify.org', { timeout: 3000 }, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => resolve(body.trim()));
        }).on('error', () => resolve('N/A'));
      });
      data.publicIp = publicIp;

      return data;
    } catch (err) {
      console.error("Error diagnosing network:", err);
      return { latency: 999, packetLoss: 100, dnsLookupTime: 999, gatewayIp: "N/A", dnsCurrent: "N/A", publicIp: "N/A" };
    }
  });

  ipcMain.handle('apply-dns', async (event, { primary, secondary }) => {
    try {
      const script = `
$adapter = Get-NetAdapter | Where-Object {\$_.Status -eq 'Up'} | Select-Object -First 1
if ($adapter) {
  Set-DnsClientServerAddress -InterfaceIndex $adapter.InterfaceIndex -ServerAddresses ("${primary}", "${secondary}")
  echo "Success"
} else {
  echo "No active adapter"
}
`;
      const result = await runPowerShellScriptElevated(script);
      return result.trim();
    } catch (err) {
      console.error("Error applying DNS:", err);
      return "Error: " + err.message;
    }
  });

  ipcMain.handle('apply-power-plan', async (event, { mode }) => {
    try {
      let script = '';
      if (mode === 'balanced') {
        script = `powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e`;
      } else if (mode === 'performance') {
        script = `powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c`;
      } else if (mode === 'battery') {
        script = `powercfg /setactive a1841308-3541-4fab-bc81-f71556f20b4a`;
      } else if (mode === 'ultimate') {
        script = `
$list = powercfg /list
if ($list -notlike "*e9a42b02-d5df-448d-aa00-03f14749eb61*") {
  powercfg /duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61
}
powercfg /setactive e9a42b02-d5df-448d-aa00-03f14749eb61
`;
      } else if (mode === 'gaming') {
        script = `powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c`;
      }
      const result = await runPowerShellScript(script);
      return result.trim();
    } catch (err) {
      console.error("Error applying power plan:", err);
      return "Error: " + err.message;
    }
  });

  ipcMain.handle('apply-office-standard', async (event, { script }) => {
    try {
      const result = await runPowerShellScriptElevated(script);
      return result.trim();
    } catch (err) {
      console.error("Error applying office standard:", err);
      return "Error: " + err.message;
    }
  });

  // ========== BACKUP: WiFi ==========
  ipcMain.handle('list-wifi-profiles', async () => {
    try {
      const script = `
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$profiles = (netsh wlan show profiles) | Select-String ':\s+(.+)$' | ForEach-Object { $_.Matches[0].Groups[1].Value.Trim() }
$results = @()
foreach ($p in $profiles) {
  $detail = netsh wlan show profile name="$p" key=clear 2>$null
  $keyLine = ($detail | Select-String 'Key Content|Contenu de la cl|Schl.sselinhalt') -replace '.*:\s*', ''
  $authLine = ($detail | Select-String 'Authentication|Authentification|Authentifizierung') | Select-Object -First 1
  $auth = if ($authLine) { ($authLine -replace '.*:\s*', '').Trim() } else { 'N/A' }
  $results += @{ name = $p; password = $keyLine; auth = $auth }
}
$results | ConvertTo-Json -Depth 3
`;
      const output = await runPowerShellScript(script);
      const parsed = JSON.parse(output.trim());
      // Ensure it's always an array (single result comes as object)
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (err) {
      console.error('Error listing WiFi profiles:', err);
      return 'Error: ' + err.message;
    }
  });

  ipcMain.handle('export-wifi', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Chọn thư mục lưu WiFi',
        properties: ['openDirectory', 'createDirectory']
      });
      if (result.canceled || !result.filePaths[0]) {
        return { success: false, error: 'Đã hủy chọn thư mục.' };
      }
      const exportPath = result.filePaths[0];
      
      // Export XML profiles for restore
      const safeExportPath = exportPath.replace(/\\/g, '\\\\');
      const xmlScript = [
        '$OutputEncoding = [System.Text.Encoding]::UTF8',
        '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8',
        '$exportPath = \'' + safeExportPath + '\'',
        'netsh wlan export profile folder="$exportPath" key=clear | Out-Null',
        '',
        '# Also create a readable TXT summary',
        '$profiles = (netsh wlan show profiles) | Select-String \':\\s+(.+)$\' | ForEach-Object { $_.Matches[0].Groups[1].Value.Trim() }',
        '$txt = "=== DANH SACH WIFI DA LUU ==="',
        '$txt += [Environment]::NewLine + "Xuat luc: $(Get-Date -Format \'dd/MM/yyyy HH:mm:ss\')"',
        '$txt += [Environment]::NewLine + ("=" * 50)',
        '$idx = 0',
        'foreach ($p in $profiles) {',
        '  $idx++',
        '  $detail = netsh wlan show profile name="$p" key=clear 2>$null',
        '  $keyLine = ($detail | Select-String \'Key Content|Contenu de la cl|Schl.sselinhalt\') -replace \'.*:\\s*\', \'\'',
        '  $txt += [Environment]::NewLine + "$idx. $p"',
        '  $txt += [Environment]::NewLine + "   Mat khau: $keyLine"',
        '  $txt += [Environment]::NewLine',
        '}',
        '$txt | Out-File -FilePath "$exportPath\\DanhSachWiFi.txt" -Encoding utf8',
        'Write-Output "OK"'
      ].join('\n');
      await runPowerShellScript(xmlScript);
      return { success: true, path: exportPath };
    } catch (err) {
      console.error('Error exporting WiFi:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('restore-wifi', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Chọn thư mục chứa file WiFi (.xml)',
        properties: ['openDirectory']
      });
      if (result.canceled || !result.filePaths[0]) {
        return { success: false, error: 'Đã hủy chọn thư mục.' };
      }
      const safeImportPath = importPath.replace(/\\/g, '\\\\');
      const script = [
        '$OutputEncoding = [System.Text.Encoding]::UTF8',
        '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8',
        '$importPath = \'' + safeImportPath + '\'',
        '$xmlFiles = Get-ChildItem "$importPath\\*.xml" -ErrorAction SilentlyContinue',
        'if ($xmlFiles.Count -eq 0) {',
        '  Write-Output \'{"success":false,"error":"Khong tim thay file XML nao trong thu muc."}\'',
        '  exit',
        '}',
        '$count = 0',
        'foreach ($f in $xmlFiles) {',
        '  netsh wlan add profile filename="$($f.FullName)" 2>$null | Out-Null',
        '  $count++',
        '}',
        'Write-Output "{\\"success\\":true,\\"count\\":$count}"'
      ].join('\n');
      const output = await runPowerShellScript(script);
      return JSON.parse(output.trim());
    } catch (err) {
      console.error('Error restoring WiFi:', err);
      return { success: false, error: err.message };
    }
  });

  // ========== BACKUP: Driver ==========
  ipcMain.handle('export-drivers', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Chọn thư mục lưu Driver backup',
        properties: ['openDirectory', 'createDirectory']
      });
      if (result.canceled || !result.filePaths[0]) {
        return { success: false, error: 'Đã hủy chọn thư mục.' };
      }
      const exportPath = path.join(result.filePaths[0], 'DriverBackup_' + new Date().toISOString().slice(0,10).replace(/-/g, ''));
      const script = `
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$exportPath = '${exportPath.replace(/\\/g, '\\\\')}'
if (-not (Test-Path $exportPath)) { New-Item -ItemType Directory -Path $exportPath -Force | Out-Null }
Export-WindowsDriver -Online -Destination $exportPath | Out-Null
Write-Output "OK"
`;
      await runPowerShellScript(script);
      return { success: true, path: exportPath };
    } catch (err) {
      console.error('Error exporting drivers:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('restore-drivers', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Chọn thư mục chứa Driver backup',
        properties: ['openDirectory']
      });
      if (result.canceled || !result.filePaths[0]) {
        return { success: false, error: 'Đã hủy chọn thư mục.' };
      }
      const importPath = result.filePaths[0];
      const script = `
$importPath = '${importPath.replace(/\\/g, '\\\\')}'
pnputil /add-driver "$importPath\\*.inf" /subdirs /install 2>&1 | Out-Null
Write-Output "OK"
`;
      await runPowerShellScriptElevated(script);
      return { success: true };
    } catch (err) {
      console.error('Error restoring drivers:', err);
      return { success: false, error: err.message };
    }
  });

  // ========== PRINTER UTILITIES ==========
  ipcMain.handle('printer-action', async (event, action) => {
    try {
      let script = '';
      if (action === 'clear-queue') {
        script = `
          Stop-Service -Name Spooler -Force
          Remove-Item -Path "$env:windir\\System32\\spool\\PRINTERS\\*.*" -Force -Recurse
          Start-Service -Name Spooler
          Write-Output "OK"
        `;
      } else if (action === 'fix-sharing') {
        script = `
          # Fix 0x0000011b
          New-ItemProperty -Path "HKLM:\\System\\CurrentControlSet\\Control\\Print" -Name "RpcAuthnLevelPrivacyEnabled" -Value 0 -PropertyType DWord -Force | Out-Null
          # Enable File and Printer Sharing in Firewall
          netsh advfirewall firewall set rule group="File and Printer Sharing" new enable=Yes | Out-Null
          Restart-Service -Name Spooler -Force
          Write-Output "OK"
        `;
      } else if (action === 'restart-spooler') {
        script = `
          Restart-Service -Name Spooler -Force
          Write-Output "OK"
        `;
      } else if (action === 'get-printers') {
        script = `
          $OutputEncoding = [System.Text.Encoding]::UTF8
          [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
          $printers = Get-CimInstance Win32_Printer | Select-Object Name, PortName, PrinterStatus, Default
          $list = @()
          foreach ($p in $printers) {
            $statusStr = switch ($p.PrinterStatus) {
              3 { "Idle" }
              4 { "Printing" }
              5 { "Warming Up" }
              default { "Unknown/Offline" }
            }
            $list += @{
              Name = $p.Name
              Port = $p.PortName
              Status = $statusStr
              IsDefault = $p.Default
            }
          }
          $list | ConvertTo-Json -Depth 3
        `;
        const output = await runPowerShellScript(script);
        return { success: true, data: JSON.parse(output.trim() || '[]') };
      }
      
      // Execute elevated for modifications
      await runPowerShellScriptElevated(script);
      return { success: true };
    } catch (err) {
      console.error('Error in printer-action:', err);
      return { success: false, error: err.message };
    }
  });
  // Set default printer
  ipcMain.handle('set-default-printer', async (event, printerName) => {
    try {
      const script = `(New-Object -ComObject WScript.Network).SetDefaultPrinter("${printerName}")`;
      await runPowerShellScriptElevated(script);
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // Get print queue for a printer
  ipcMain.handle('get-print-queue', async (event, printerName) => {
    try {
      const script = `
        $OutputEncoding = [System.Text.Encoding]::UTF8
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
        Get-PrintJob -PrinterName "${printerName}" -ErrorAction SilentlyContinue | Select-Object Id, DocumentName, JobStatus, Size, PagesPrinted, TotalPages | ConvertTo-Json -Depth 3
      `;
      const output = await runPowerShellScript(script);
      const trimmed = output.trim();
      if (!trimmed || trimmed === 'null') return { success: true, data: [] };
      const parsed = JSON.parse(trimmed);
      const jobs = Array.isArray(parsed) ? parsed : [parsed];
      return { success: true, data: jobs };
    } catch (err) { return { success: false, error: err.message, data: [] }; }
  });

  // Print test page
  ipcMain.handle('print-test-page', async (event, printerName) => {
    try {
      const script = `
        $OutputEncoding = [System.Text.Encoding]::UTF8
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
        $printer = Get-Printer -Name "${printerName}" -ErrorAction SilentlyContinue
        if ($printer) {
          & rundll32 printui.dll,PrintUIEntry /k /n "${printerName}"
          Write-Output "OK"
        } else {
          Write-Output "NOT_FOUND"
        }
      `;
      const output = await runPowerShellScript(script);
      if (output.includes('NOT_FOUND')) return { success: false, error: 'Không tìm thấy máy in.' };
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // Open Device Manager to printers
  ipcMain.handle('open-device-manager-printers', async () => {
    try {
      const { exec } = require('child_process');
      exec('mmc devmgmt.msc');
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // Remove and re-add printer
  ipcMain.handle('remove-reinstall-printer', async (event, printerName) => {
    try {
      const script = `
        $OutputEncoding = [System.Text.Encoding]::UTF8
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
        Remove-Printer -Name "${printerName}" -ErrorAction SilentlyContinue
        Write-Output "Đã xóa máy in: ${printerName}"
      `;
      await runPowerShellScriptElevated(script);
      // Open Add Printer wizard
      const { exec } = require('child_process');
      exec('rundll32 shell32.dll,SHHelpShortcuts_RunDLL AddPrinter');
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // ========== WINDOWS SETTINGS ==========
  ipcMain.handle('read-windows-settings', async () => {
    try {
      const script = `
        $OutputEncoding = [System.Text.Encoding]::UTF8
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8

        function Get-RegDWord ($path, $name, $default = 0) {
            try {
                $val = (Get-ItemProperty -Path $path -Name $name -ErrorAction SilentlyContinue).$name
                if ($null -ne $val) { return $val }
            } catch {}
            return $default
        }

        $state = @{}

        # System Settings
        $state.thisPc = (Get-RegDWord 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced' 'LaunchTo' 2) -eq 1
        $state.classicMenu = (Test-Path 'HKCU:\\Software\\Classes\\CLSID\\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\\InprocServer32')
        $state.photoViewer = (Test-Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows Photo Viewer\\Capabilities\\FileAssociations')
        $state.hideTaskbarIcons = $false # Defaulting false for now
        $state.disableAutoBrightness = (Get-RegDWord 'HKLM:\\SOFTWARE\\Intel\\Display\\igfxcui\\powersettings' 'FeatureTestControl' 0) -ne 0
        $state.removeLangs = $false

        # Taskbar Settings
        $state.hideSearch = (Get-RegDWord 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Search' 'SearchboxTaskbarMode' 1) -eq 0
        $state.hideTaskView = (Get-RegDWord 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced' 'ShowTaskViewButton' 1) -eq 0
        $state.hideWidgets = (Get-RegDWord 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced' 'TaskbarDa' 1) -eq 0
        $state.hideChat = (Get-RegDWord 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced' 'TaskbarMn' 1) -eq 0
        $state.hideCopilot = (Get-RegDWord 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced' 'ShowCopilotButton' 1) -eq 0
        $state.hideNews = (Get-RegDWord 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Feeds' 'EnableFeeds' 1) -eq 0
        $state.taskbarLeft = (Get-RegDWord 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced' 'TaskbarAl' 1) -eq 0

        # System Optimization
        $state.hibernate = (Get-RegDWord 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Power' 'HibernateEnabled' 1) -eq 1
        $state.fastStartup = (Get-RegDWord 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power' 'HiberbootEnabled' 1) -eq 1
        $state.prefetch = (Get-RegDWord 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\\PrefetchParameters' 'EnablePrefetcher' 3) -ne 0
        $state.sysMain = ((Get-Service -Name "SysMain" -ErrorAction SilentlyContinue).StartType -ne 'Disabled')
        $state.remoteDesktop = (Get-RegDWord 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server' 'fDenyTSConnections' 1) -eq 0
        $state.errorReporting = (Get-RegDWord 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\Windows Error Reporting' 'Disabled' 0) -ne 1
        $state.searchIndexing = ((Get-Service -Name "WSearch" -ErrorAction SilentlyContinue).StartType -ne 'Disabled')
        $state.printSpooler = ((Get-Service -Name "Spooler" -ErrorAction SilentlyContinue).StartType -ne 'Disabled')
        $state.defender = (Get-RegDWord 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows Defender' 'DisableAntiSpyware' 0) -eq 0
        $state.telemetry = (Get-RegDWord 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection' 'AllowTelemetry' 1) -ne 0
        $state.xboxServices = ((Get-Service -Name "XboxGipSvc" -ErrorAction SilentlyContinue).StartType -ne 'Disabled')
        $state.oneDrive = (Test-Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\OneDrive')

        # Active Power Plan
        $activePower = (powercfg /getactivescheme)
        if ($activePower -match "([0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12})") {
            $state.activePowerPlan = $matches[1]
        }

        $state | ConvertTo-Json
      `;
      const output = await runPowerShellScript(script);
      return { success: true, data: JSON.parse(output.trim() || '{}') };
    } catch (err) {
      console.error('Error reading windows settings:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('apply-windows-settings', async (event, settings) => {
    try {
      let script = `
        $OutputEncoding = [System.Text.Encoding]::UTF8
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
      `;
      if (settings.thisPc) {
        script += `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "LaunchTo" -Value 1 -Force\n`;
      } else {
        script += `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "LaunchTo" -Value 2 -Force\n`;
      }

      if (settings.classicMenu) {
        script += `
          New-Item -Path "HKCU:\\Software\\Classes\\CLSID\\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\\InprocServer32" -Force -ErrorAction SilentlyContinue | Out-Null
          Set-ItemProperty -Path "HKCU:\\Software\\Classes\\CLSID\\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\\InprocServer32" -Name "(Default)" -Value "" -Force
        `;
      } else {
        script += `Remove-Item -Path "HKCU:\\Software\\Classes\\CLSID\\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}" -Recurse -Force -ErrorAction SilentlyContinue\n`;
      }
      
      await runPowerShellScriptElevated(script);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('apply-taskbar-settings', async (event, settings) => {
    try {
      let script = `
        $OutputEncoding = [System.Text.Encoding]::UTF8
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
        
        Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarAl" -Value $(if($true -eq ${settings.taskbarLeft}) {0} else {1}) -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Search" -Name "SearchboxTaskbarMode" -Value $(if($true -eq ${settings.hideSearch}) {0} else {1}) -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "ShowTaskViewButton" -Value $(if($true -eq ${settings.hideTaskView}) {0} else {1}) -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarDa" -Value $(if($true -eq ${settings.hideWidgets}) {0} else {1}) -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarMn" -Value $(if($true -eq ${settings.hideChat}) {0} else {1}) -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "ShowCopilotButton" -Value $(if($true -eq ${settings.hideCopilot}) {0} else {1}) -Force -ErrorAction SilentlyContinue
        
        Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
      `;
      script += `\nStart-Sleep -Seconds 1\nStart-Process explorer\n`;
      
      await runPowerShellScriptElevated(script);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('apply-system-optimization', async (event, settings) => {
    try {
      let script = `
        $OutputEncoding = [System.Text.Encoding]::UTF8
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
      `;
      if (!settings.hibernate) script += `powercfg.exe /hibernate off\n`;
      else script += `powercfg.exe /hibernate on\n`;

      if (!settings.sysMain) script += `Stop-Service -Name "SysMain" -Force -ErrorAction SilentlyContinue; Set-Service -Name "SysMain" -StartupType Disabled\n`;
      else script += `Set-Service -Name "SysMain" -StartupType Automatic; Start-Service -Name "SysMain" -ErrorAction SilentlyContinue\n`;

      if (!settings.defender) {
        script += `Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows Defender" -Name "DisableAntiSpyware" -Value 1 -Force -ErrorAction SilentlyContinue\n`;
      } else {
        script += `Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows Defender" -Name "DisableAntiSpyware" -Force -ErrorAction SilentlyContinue\n`;
      }
      
      if (!settings.fastStartup) script += `Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power" -Name "HiberbootEnabled" -Value 0 -Force -ErrorAction SilentlyContinue\n`;
      else script += `Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power" -Name "HiberbootEnabled" -Value 1 -Force -ErrorAction SilentlyContinue\n`;

      await runPowerShellScriptElevated(script);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  // ========== BITLOCKER MANAGER ==========
  ipcMain.handle('get-bitlocker-status', async () => {
    try {
      const script = `
        $OutputEncoding = [System.Text.Encoding]::UTF8
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
        $WarningPreference = 'SilentlyContinue'
        
        $hasModule = $true
        try {
            Import-Module BitLocker -ErrorAction Stop
        } catch {
            $hasModule = $false
        }

        if (-not $hasModule) {
            # Check if manage-bde is available
            $bde = Get-Command manage-bde -ErrorAction SilentlyContinue
            if (-not $bde) {
                Write-Output "NO_MODULE"
                exit
            }
        }

        $volumes = Get-Volume | Where-Object { $_.DriveLetter -and $_.DriveType -eq 'Fixed' }
        $results = @()

        foreach ($vol in $volumes) {
            $letter = $vol.DriveLetter + ":"
            $label = $vol.FileSystemLabel
            
            $status = "Unknown"
            $protection = "Unknown"
            $percent = 0

            if ($hasModule) {
                $b = Get-BitLockerVolume -MountPoint $letter -ErrorAction SilentlyContinue
                if ($b) {
                    $status = $b.VolumeStatus.ToString()
                    $protection = $b.ProtectionStatus.ToString()
                    $percent = $b.EncryptionPercentage
                } else {
                    $status = "FullyDecrypted"
                    $protection = "Off"
                }
            } else {
                # Fallback to manage-bde
                $bdeOut = manage-bde -status $letter
                if ($bdeOut -match "Percentage Encrypted:\\s+([0-9.]+)%") {
                    $percent = [math]::Round([double]$matches[1])
                }
                if ($bdeOut -match "Protection Status:\\s+Protection Off") {
                    $protection = "Off"
                } elseif ($bdeOut -match "Protection Status:\\s+Protection On") {
                    $protection = "On"
                }
                
                if ($bdeOut -match "Conversion Status:\\s+Fully Decrypted") {
                    $status = "FullyDecrypted"
                } elseif ($bdeOut -match "Conversion Status:\\s+Fully Encrypted") {
                    $status = "FullyEncrypted"
                } elseif ($bdeOut -match "Conversion Status:\\s+Decryption in Progress") {
                    $status = "DecryptionInProgress"
                } elseif ($bdeOut -match "Conversion Status:\\s+Encryption in Progress") {
                    $status = "EncryptionInProgress"
                }
            }

            $results += @{
                MountPoint = $letter
                FileSystemLabel = $label
                VolumeStatus = $status
                ProtectionStatus = $protection
                EncryptionPercentage = $percent
            }
        }

        $results | ConvertTo-Json -Compress
      `;
      const output = await runPowerShellScript(script);
      return { success: true, data: output.trim() };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('disable-bitlocker', async (event, mountPoint) => {
    try {
      const script = `
        $OutputEncoding = [System.Text.Encoding]::UTF8
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
        
        $hasModule = $true
        try {
            Import-Module BitLocker -ErrorAction Stop
        } catch {
            $hasModule = $false
        }

        if ($hasModule) {
            Disable-BitLocker -MountPoint "${mountPoint}"
        } else {
            manage-bde -off "${mountPoint}"
        }
      `;
      await runPowerShellScriptElevated(script);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('get-battery-health', async () => {
    try {
      const script = `
        $battXml = "$env:TEMP\\batt_report.xml"
        powercfg /batteryreport /xml /output $battXml | Out-Null
        if (Test-Path $battXml) {
            [xml]$xml = Get-Content $battXml -Raw
            $batteries = $xml.BatteryReport.Batteries.Battery
            if ($batteries -is [array]) { $batt = $batteries[0] } else { $batt = $batteries }
            
            $res = @{
              EstimatedChargeRemaining = 0
              FullChargeCapacity = if ($batt.FullChargeCapacity) { $batt.FullChargeCapacity } else { 0 }
              DesignCapacity = if ($batt.DesignCapacity) { $batt.DesignCapacity } else { 0 }
            }
            Remove-Item $battXml -Force -ErrorAction SilentlyContinue
            $res | ConvertTo-Json -Compress
        } else {
            "{}"
        }
      `;
      const result = await runPowerShellScript(script);
      return JSON.parse(result || '{}');
    } catch {
      return {};
    }
  });

  ipcMain.handle('get-disk-health', async () => {
    try {
      const script = `
        $disks = Get-PhysicalDisk -ErrorAction SilentlyContinue | Select-Object DeviceId, FriendlyName, MediaType, OperationalStatus, HealthStatus, Size
        if (-not $disks) {
            $wmiDisks = Get-WmiObject Win32_DiskDrive -ErrorAction SilentlyContinue
            $disks = @()
            foreach ($d in $wmiDisks) {
                $disks += @{
                    DeviceId = $d.DeviceID
                    FriendlyName = $d.Model
                    MediaType = $d.MediaType
                    OperationalStatus = $d.Status
                    HealthStatus = if ($d.Status -eq "OK") { "Healthy" } else { "Unhealthy" }
                    Size = $d.Size
                }
            }
        }
        $disks | ConvertTo-Json -Compress
      `;
      const result = await runPowerShellScript(script);
      let parsed = JSON.parse(result || '[]');
      if (!Array.isArray(parsed)) parsed = [parsed];
      return parsed;
    } catch {
      return [];
    }
  });

  ipcMain.handle('run-dxdiag', async () => {
    try {
      await runPowerShellScript('Start-Process dxdiag');
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('run-windows-fixer', async () => {
    try {
      const script = `
        sfc /scannow
        DISM /Online /Cleanup-Image /RestoreHealth
      `;
      await runPowerShellScript(script);
      return true;
    } catch (err) {
      return false;
    }
  });

  ipcMain.handle('reset-windows-update', async () => {
    try {
      const script = `
        Stop-Service -Name BITS, wuauserv, appidsvc, cryptsvc -Force -ErrorAction SilentlyContinue
        Remove-Item "$env:windir\\SoftwareDistribution" -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item "$env:windir\\system32\\catroot2" -Recurse -Force -ErrorAction SilentlyContinue
        Start-Service -Name BITS, wuauserv, appidsvc, cryptsvc -ErrorAction SilentlyContinue
      `;
      await runPowerShellScript(script);
      return true;
    } catch (err) {
      return false;
    }
  });

  ipcMain.handle('rebuild-icon-cache', async () => {
    try {
      const script = `
        Stop-Process -Name explorer -Force
        Remove-Item "$env:localappdata\\IconCache.db" -Force -ErrorAction SilentlyContinue
        Remove-Item "$env:localappdata\\Microsoft\\Windows\\Explorer\\iconcache*" -Force -ErrorAction SilentlyContinue
        Remove-Item "$env:localappdata\\Microsoft\\Windows\\Explorer\\thumbcache*" -Force -ErrorAction SilentlyContinue
        Start-Process explorer
      `;
      await runPowerShellScript(script);
      return true;
    } catch (err) {
      return false;
    }
  });

  ipcMain.handle('deep-clean-kms', async () => {
    try {
      const script = `
        Write-Host "Bắt đầu dọn dẹp KMS lậu..."
        
        # 1. Uninstall Win key
        slmgr /upk
        slmgr /cpky
        slmgr /ckms
        
        # 2. Delete Office keys
        $osppPaths = @(
            "$env:ProgramFiles\\Microsoft Office\\Office16\\ospp.vbs",
            "$env:ProgramFiles\\Microsoft Office\\Office15\\ospp.vbs",
            "$env:ProgramFiles\\Microsoft Office\\Office14\\ospp.vbs",
            "\${env:ProgramFiles(x86)}\\Microsoft Office\\Office16\\ospp.vbs",
            "\${env:ProgramFiles(x86)}\\Microsoft Office\\Office15\\ospp.vbs",
            "\${env:ProgramFiles(x86)}\\Microsoft Office\\Office14\\ospp.vbs"
        )
        $ospp = $osppPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
        
        if ($ospp) {
           $status = cscript //nologo $ospp /dstatus
           $keys = $status | Select-String "Last 5 characters of installed product key: (.+)" | ForEach-Object { $_.Matches.Groups[1].Value }
           foreach ($k in $keys) { cscript //nologo $ospp /unpkey:$k }
        }

        # 3. Stop and delete KMS Tasks & Services
        Get-ScheduledTask | Where-Object { $_.TaskName -match "AutoKMS|KMSAuto|KMSPico|SvcKMS" } | Unregister-ScheduledTask -Confirm:$false -ErrorAction SilentlyContinue
        Stop-Service -Name "KMSEmulator", "SppExtComObjHook" -Force -ErrorAction SilentlyContinue
        sc.exe delete "KMSEmulator" | Out-Null
        sc.exe delete "SppExtComObjHook" | Out-Null

        # 4. Clear KMS Registry Cache (MAS logic)
        $regPath = "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\SoftwareProtectionPlatform"
        if (Test-Path $regPath) {
           Get-ChildItem -Path $regPath | Where-Object { $_.PSChildName -match "^[0-9a-fA-F]{8}-" } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        # Restart SPP Service
        Restart-Service sppsvc -Force -ErrorAction SilentlyContinue
        
        Write-Host "Dọn dẹp hoàn tất!"
      `;
      const result = await runPowerShellScript(script);
      return result;
    } catch (err) {
      throw err;
    }
  });

  // Custom Portable Auto Updater
  let downloadRequest = null;
  let updateDataGlobal = null;

  ipcMain.handle('check-for-updates', async () => {
    try {
      const currentVersion = app.getVersion();
      const updateUrl = 'https://raw.githubusercontent.com/thangdggr0004-cpu/ThienPhatTechToolKit/main/version.json';
      
      // Bypass Github Cache by appending a timestamp
      const response = await fetch(updateUrl + '?t=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) {
        return { hasUpdate: false };
      }
      
      const data = await response.json();
      const latestVersion = data.version;
      const downloadUrl = data.downloadUrl;
      const releaseNotes = data.releaseNotes;

      // Ensure we have a download URL and version is different
      const hasUpdate = latestVersion && latestVersion !== currentVersion && downloadUrl;
      
      if (hasUpdate) {
        updateDataGlobal = { currentVersion, latestVersion, downloadUrl, releaseNotes };
        // Tell renderer update is available
        setTimeout(() => {
          if (mainWindow) mainWindow.webContents.send('updater-event', { type: 'update-available', info: updateDataGlobal });
        }, 1000);
        return { success: true, hasUpdate: true };
      } else {
        return { success: true, hasUpdate: false };
      }
    } catch (err) {
      console.error('Update check failed:', err);
      return { success: false, error: err.toString() };
    }
  });

  ipcMain.handle('download-update', async () => {
    if (!updateDataGlobal || !updateDataGlobal.downloadUrl) return { success: false, error: 'No download url' };
    
    return new Promise((resolve, reject) => {
      try {
        const downloadUrl = updateDataGlobal.downloadUrl;
        const exeDir = path.dirname(process.execPath);
        // Only download next to exe if packaged, otherwise download to desktop for dev
        const targetDir = app.isPackaged ? exeDir : path.join(os.homedir(), 'Desktop');
        const fileName = `ThienPhatTechToolkit_v${updateDataGlobal.latestVersion}.exe`;
        const destPath = path.join(targetDir, fileName);
        
        updateDataGlobal.newExePath = destPath;

        const file = fs.createWriteStream(destPath);

        const request = https.get(downloadUrl, (response) => {
          if (response.statusCode === 301 || response.statusCode === 302) {
             // Handle redirect for Github releases
             https.get(response.headers.location, (res) => {
                handleResponse(res);
             }).on('error', (err) => {
                fs.unlink(destPath, () => {});
                if (mainWindow) mainWindow.webContents.send('updater-event', { type: 'error', error: err.message });
                resolve({ success: false, error: err.message });
             });
             return;
          }
          handleResponse(response);
        });

        function handleResponse(res) {
          const totalBytes = parseInt(res.headers['content-length'], 10);
          let downloadedBytes = 0;

          res.on('data', (chunk) => {
            downloadedBytes += chunk.length;
            const percent = totalBytes ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
            if (mainWindow) {
              mainWindow.webContents.send('updater-event', { 
                type: 'download-progress', 
                progress: { percent } 
              });
            }
          });

          res.pipe(file);

          file.on('finish', () => {
            file.close();
            if (mainWindow) mainWindow.webContents.send('updater-event', { type: 'update-downloaded' });
            resolve({ success: true });
          });
        }

        request.on('error', (err) => {
          fs.unlink(destPath, () => {});
          if (mainWindow) mainWindow.webContents.send('updater-event', { type: 'error', error: err.message });
          resolve({ success: false, error: err.message });
        });
        
        downloadRequest = request;

      } catch (err) {
        resolve({ success: false, error: err.toString() });
      }
    });
  });

  ipcMain.handle('install-update', () => {
    if (!updateDataGlobal || !updateDataGlobal.newExePath) return;

    try {
      const currentExe = process.execPath;
      const newExe = updateDataGlobal.newExePath;
      
      // If running in dev mode, don't delete electron.exe
      if (!app.isPackaged) {
         exec(`start "" "${newExe}"`);
         app.quit();
         return;
      }

      // Create a VBS script in TEMP to wait, delete old exe, and launch new exe
      const scriptPath = path.join(os.tmpdir(), 'update_helper.vbs');
      const vbsCode = `
WScript.Sleep 2000
Dim fso
Set fso = CreateObject("Scripting.FileSystemObject")
On Error Resume Next
fso.DeleteFile("${currentExe}")
On Error GoTo 0
Dim shell
Set shell = CreateObject("WScript.Shell")
shell.Run """${newExe}"""
fso.DeleteFile(WScript.ScriptFullName)
      `;
      
      fs.writeFileSync(scriptPath, vbsCode);
      exec(`wscript "${scriptPath}"`);
      app.quit();
    } catch (e) {
      console.error("Install update error:", e);
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
