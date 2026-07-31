import { DocumentStandardPreset } from '../types.js';

// Helper to trigger file download in browser
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 1. Windows Activation Script
export function generateWinActivationScript(action: 'check' | 'delete'): string {
  if (action === 'check') {
    return `@echo off
chcp 65001 >nul
echo ====================================================================
echo   KIỂM TRA BẢN QUYỀN WINDOWS CHUYÊN SÂU - SYSTEM OPTIMIZER
echo ====================================================================
echo.
echo [*] Đang quét trạng thái kích hoạt Windows...
cscript //nologo %windir%\\system32\\slmgr.vbs /xpr
echo.
echo [*] Chi tiết kênh bản quyền và Key License đang dùng...
cscript //nologo %windir%\\system32\\slmgr.vbs /dli
echo.
echo [*] Toàn bộ thông tin chi tiết cấu hình giấy phép...
cscript //nologo %windir%\\system32\\slmgr.vbs /dlv
echo.
echo ====================================================================
echo Quét hoàn tất. Nhấn phím bất kỳ để thoát.
pause >nul`;
  } else {
    return `@echo off
:: Yêu cầu quyền Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Vui lòng chạy công cụ này với quyền Administrator (Run as Administrator)!
    pause
    exit /b
)

chcp 65001 >nul
echo ====================================================================
echo   ĐẶT LẠI KÊNH BẢN QUYỀN WINDOWS VỀ GỐC
echo ====================================================================
echo.
echo [!] CẢNH BÁO: Thao tác này sẽ gỡ bỏ hoàn toàn Product Key và các
echo     cấu hình kích hoạt hiện tại của Windows.
echo     Chỉ thực hiện khi bạn đã có sẵn Key mới hoặc bản quyền số.
echo.
set /p confirm="Bạn có chắc chắn muốn tiếp tục? (Y/N): "
if /i "%confirm%" neq "Y" (
    echo [*] Đã hủy thao tác.
    pause
    exit /b
)

echo.
echo [*] Bước 1: Gỡ bỏ Product Key hiện tại khỏi hệ thống...
cscript //nologo %windir%\\system32\\slmgr.vbs /upk
echo [+] Product Key đã được gỡ bỏ.

echo.
echo [*] Bước 2: Xóa Key khỏi Registry để tránh xung đột...
cscript //nologo %windir%\\system32\\slmgr.vbs /cpky
echo [+] Đã dọn sạch Product Key còn sót lại trong Registry.

echo.
echo [*] Bước 3: Đặt lại trạng thái cấp phép (Rearm Licensing Status)...
cscript //nologo %windir%\\system32\\slmgr.vbs /rearm
echo [+] Trạng thái bản quyền đã được reset.

echo.
echo [*] Bước 4: Xóa cache máy chủ KMS (nếu có)...
cscript //nologo %windir%\\system32\\slmgr.vbs /ckms
echo [+] Cache máy chủ KMS đã được dọn sạch.

echo.
echo [*] Bước 5: Khởi động lại dịch vụ bảo vệ bản quyền (Software Protection)...
net stop sppsvc /y >nul 2>&1
net start sppsvc >nul 2>&1
echo [+] Dịch vụ sppsvc đã được khởi động lại.

echo.
echo ====================================================================
echo [+] ĐÃ HOÀN TẤT ĐẶT LẠI BẢN QUYỀN WINDOWS VỀ GỐC!
echo [!] Khuyến nghị: Hãy khởi động lại máy tính, sau đó kết nối
echo     Internet để Windows tự nhận lại bản quyền số (nếu có)
echo     hoặc nhập Product Key mới của bạn.
echo ====================================================================
pause`;
  }
}

// 2. Office Activation Script
export function generateOfficeActivationScript(action: 'check' | 'delete'): string {
  if (action === 'check') {
    return `@echo off
chcp 65001 >nul
echo ====================================================================
echo   KIỂM TRA BẢN QUYỀN MS OFFICE CHUYÊN SÂU - SYSTEM OPTIMIZER
echo ====================================================================
echo.

set "found=0"
for %%p in (
    "%ProgramFiles%\\Microsoft Office\\root\\Office16"
    "%ProgramFiles(x86)%\\Microsoft Office\\root\\Office16"
    "%ProgramFiles%\\Microsoft Office\\Office16"
    "%ProgramFiles(x86)%\\Microsoft Office\\Office16"
    "%ProgramFiles%\\Microsoft Office\\Office15"
    "%ProgramFiles(x86)%\\Microsoft Office\\Office15"
    "%ProgramFiles%\\Microsoft Office\\Office14"
    "%ProgramFiles(x86)%\\Microsoft Office\\Office14"
) do (
    if exist "%%~p\\ospp.vbs" (
        set "found=1"
        echo [+] Tìm thấy thư mục cài đặt Office tại: %%~p
        echo [*] Đang kiểm tra trạng thái bản quyền...
        echo ------------------------------------------------------------
        cscript //nologo "%%~p\\ospp.vbs" /dstatus
        echo ------------------------------------------------------------
    )
)

if %found% equ 0 (
    echo [!] Không tìm thấy thư mục cài đặt Office bản truyền thống (Click-To-Run) trên máy.
    echo [!] Nếu bạn đang dùng Office Store (UWP) hoặc bản quyền Microsoft 365 chính hãng, 
    echo     vui lòng kiểm tra trực tiếp trong ứng dụng Word/Excel (File - Account).
)

echo.
echo ====================================================================
pause`;
  } else {
    return `@echo off
:: Yêu cầu quyền Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Vui lòng chạy công cụ này với quyền Administrator (Run as Administrator)!
    pause
    exit /b
)

chcp 65001 >nul
echo ====================================================================
echo   ĐẶT LẠI TOÀN BỘ BẢN QUYỀN MICROSOFT OFFICE VỀ GỐC
echo ====================================================================
echo.
echo [!] CẢNH BÁO: Thao tác này sẽ gỡ bỏ TOÀN BỘ Product Key của Office
echo     đang được cài đặt trên máy. Hãy chắc chắn bạn có thể kích
echo     hoạt lại bản quyền sau khi chạy công cụ này.
echo.
set /p confirm="Bạn có chắc chắn muốn xóa tất cả Key Office? (Y/N): "
if /i "%confirm%" neq "Y" (
    echo [*] Đã hủy thao tác.
    pause
    exit /b
)

set "officePath="
for %%p in (
    "%ProgramFiles%\\Microsoft Office\\root\\Office16"
    "%ProgramFiles(x86)%\\Microsoft Office\\root\\Office16"
    "%ProgramFiles%\\Microsoft Office\\Office16"
    "%ProgramFiles(x86)%\\Microsoft Office\\Office16"
    "%ProgramFiles%\\Microsoft Office\\Office15"
    "%ProgramFiles(x86)%\\Microsoft Office\\Office15"
) do (
    if exist "%%~p\\ospp.vbs" (
        set "officePath=%%~p"
    )
)

if "%officePath%"=="" (
    echo [!] Không tìm thấy công cụ ospp.vbs của Microsoft Office.
    echo [*] Thao tác không thể tiếp tục.
    pause
    exit /b
)

echo.
echo [+] Đã tìm thấy công cụ Office tại: %officePath%
echo.
echo [*] Đang liệt kê các khóa giấy phép đang được cài đặt...
echo ------------------------------------------------------------
cscript //nologo "%officePath%\\ospp.vbs" /dstatus > "%temp%\\office_status.txt"
type "%temp%\\office_status.txt"
echo ------------------------------------------------------------
echo.
echo [*] Bắt đầu quá trình gỡ bỏ tất cả Product Key đã phát hiện...

for /f "tokens=5" %%a in ('findstr /i "Last 5 characters of installed product key:" "%temp%\\office_status.txt"') do (
    echo [+] Đang gỡ bỏ Product Key có 5 ký tự cuối là: %%a
    cscript //nologo "%officePath%\\ospp.vbs" /unpkey:%%a
)

echo.
echo [*] Đang xóa cache máy chủ KMS Host của Office (nếu có)...
cscript //nologo "%officePath%\\ospp.vbs" /remhst
echo [+] Đã xóa cache KMS Host.

echo.
echo [*] Đang reset lại trạng thái kích hoạt Office...
cscript //nologo "%officePath%\\ospp.vbs" /rearm
echo [+] Đã reset trạng thái.

del "%temp%\\office_status.txt" >nul 2>&1

echo.
echo ====================================================================
echo [+] ĐÃ DỌN SẠCH TOÀN BỘ KEY OFFICE!
echo [!] Bây giờ bạn có thể mở ứng dụng Office, đăng nhập tài khoản 
echo     Microsoft 365 hoặc nhập Product Key mới của bạn.
echo ====================================================================
pause`;
  }
}

// 3. Hardware Diagnostics Script (PowerShell)
export function generateHardwareInfoScript(): string {
  return `# PowerShell script to diagnostic detailed hardware configuration
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "         CHẨN ĐOÁN CẤU HÌNH PHẦN CỨNG CHI TIẾT - WINDOWS             " -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. CPU Info
Write-Host "[*] Đang đọc thông tin CPU..." -ForegroundColor Yellow
$cpu = Get-CimInstance Win32_Processor
$cpuName = $cpu.Name.Trim()
$cpuCores = $cpu.NumberOfCores
$cpuThreads = $cpu.NumberOfLogicalProcessors
$cpuMaxClock = $cpu.MaxClockSpeed
$cpuL3 = [math]::Round($cpu.L3CacheSize / 1024, 2)

Write-Host "  - Bộ vi xử lý (CPU): $cpuName"
Write-Host "  - Số nhân vật lý: $cpuCores Cores | Số luồng xử lý: $cpuThreads Threads"
Write-Host "  - Xung nhịp tối đa: ([math]::Round($cpuMaxClock / 1000, 2)) GHz"
Write-Host "  - L3 Cache: $cpuL3 MB"
Write-Host ""

# 2. RAM Info
Write-Host "[*] Đang đọc thông tin RAM và Khe cắm..." -ForegroundColor Yellow
$physicalMem = Get-CimInstance Win32_PhysicalMemory
$totalRamBytes = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory
$totalRamGB = [math]::Round($totalRamBytes / 1GB, 2)
$ramSlots = Get-CimInstance Win32_PhysicalMemoryArray

Write-Host "  - Tổng dung lượng RAM cài đặt: $totalRamGB GB"
Write-Host "  - Số khe cắm khả dụng trên Mainboard: $($ramSlots.MemoryDevices)"
Write-Host "  - Số khe cắm đã sử dụng: $($physicalMem.Count)"

$index = 1
foreach ($mem in $physicalMem) {
    $memGB = [math]::Round($mem.Capacity / 1GB, 2)
    $memSpeed = $mem.Speed
    $memType = "DDR"
    if ($mem.SMBIOSMemoryType -eq 26) { $memType = "DDR4" }
    elseif ($mem.SMBIOSMemoryType -eq 30) { $memType = "DDR5" }
    elseif ($mem.SMBIOSMemoryType -eq 24) { $memType = "DDR3" }
    Write-Host "    + Khe cắm #$index: $memGB GB $memType @ $memSpeed MHz (Nhà SX: $($mem.Manufacturer.Trim()))"
    $index++
}
Write-Host ""

# 3. Disk Info
Write-Host "[*] Đang kiểm tra Ổ cứng và Dung lượng..." -ForegroundColor Yellow
$disks = Get-CimInstance Win32_DiskDrive
foreach ($disk in $disks) {
    $diskSizeGB = [math]::Round($disk.Size / 1GB, 2)
    $diskMediaType = $disk.MediaType
    if ($disk.Model -like "*SSD*" -or $disk.Model -like "*NVMe*") {
        $diskTypeStr = "SSD (NVMe/SATA)"
    } else {
        $diskTypeStr = "HDD"
    }
    Write-Host "  - Ổ đĩa: $($disk.Model) ($diskTypeStr)"
    Write-Host "    + Dung lượng thiết kế: $diskSizeGB GB"
    Write-Host "    + Cổng kết nối (Interface): $($disk.InterfaceType)"
    
    # Partitions on this disk
    $partitions = Get-CimInstance -Query "ASSOCIATORS OF {Win32_DiskDrive.DeviceID='$($disk.DeviceID)'} WHERE AssocClass = Win32_DiskDriveToDiskPartition"
    foreach ($part in $partitions) {
        $logicalDisks = Get-CimInstance -Query "ASSOCIATORS OF {Win32_DiskPartition.DeviceID='$($part.DeviceID)'} WHERE AssocClass = Win32_LogicalDiskToPartition"
        foreach ($ld in $logicalDisks) {
            $freeGB = [math]::Round($ld.FreeSpace / 1GB, 2)
            $sizeGB = [math]::Round($ld.Size / 1GB, 2)
            $percentFree = [math]::Round(($freeGB / $sizeGB) * 100, 1)
            Write-Host "      > Phân vùng ổ [$($ld.DeviceID)] ($($ld.VolumeName)): Đã dùng $([math]::Round($sizeGB - $freeGB, 2))/$sizeGB GB ($percentFree% trống)"
        }
    }
}
Write-Host ""

# 4. GPU Info
Write-Host "[*] Đang đọc thông tin Card màn hình (GPU)..." -ForegroundColor Yellow
$gpus = Get-CimInstance Win32_VideoController
foreach ($gpu in $gpus) {
    $gpuVRAM = [math]::Round($gpu.AdapterRAM / 1MB, 2)
    if ($gpuVRAM -lt 0) { $gpuVRAM = "N/A" } else { $gpuVRAM = "$([math]::Round($gpu.AdapterRAM / 1GB, 2)) GB" }
    Write-Host "  - Card: $($gpu.Name)"
    Write-Host "    + Dung lượng VRAM: $gpuVRAM"
    Write-Host "    + Độ phân giải hiện tại: $($gpu.CurrentHorizontalResolution) x $($gpu.CurrentVerticalResolution) @ $($gpu.CurrentRefreshRate)Hz"
}
Write-Host ""

# 5. Motherboard & Bios
Write-Host "[*] Đang đọc thông tin Mainboard..." -ForegroundColor Yellow
$board = Get-CimInstance Win32_BaseBoard
$bios = Get-CimInstance Win32_BIOS
Write-Host "  - Bo mạch chủ: $($board.Manufacturer) $($board.Product)"
Write-Host "  - Phiên bản BIOS: $($bios.SMBIOSBIOSVersion) (Ngày SX: $($bios.ReleaseDate.ToString('dd/MM/yyyy')))"
Write-Host ""

Write-Host "====================================================================" -ForegroundColor Green
Write-Host "[+] BÁO CÁO CẤU HÌNH ĐÃ HOÀN TẤT!" -ForegroundColor Green
Write-Host "====================================================================" -ForegroundColor Green
Write-Host "Nhấn phím bất kỳ để đóng công cụ này..."
$null = [Console]::ReadKey()`;
}

// 4. Deep Junk Cleaner Script (Batch)
export function generateJunkCleanerScript(): string {
  return `@echo off
:: Yêu cầu quyền Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Vui lòng chạy công cụ này với quyền Administrator (Run as Administrator)!
    pause
    exit /b
)

chcp 65001 >nul
echo ====================================================================
echo   HỆ THỐNG DỌN RÁC CHUYÊN SÂU TỐI ƯU WINDOWS
echo ====================================================================
echo.
echo [*] Chuẩn bị bắt đầu dọn dẹp các tệp tin rác tích tụ trong hệ thống...
set /p confirm="Bạn có muốn dọn dẹp ngay? (Y/N): "
if /i "%confirm%" neq "Y" (
    echo [*] Đã hủy thao tác.
    pause
    exit /b
)

echo.
echo --------------------------------------------------------------------
echo [*] 1. Đang dừng dịch vụ cập nhật để xóa bộ nhớ tạm (Windows Update Cache)...
net stop wuauserv /y >nul 2>&1
net stop bits /y >nul 2>&1
net stop dosvc /y >nul 2>&1

echo [*] 2. Đang dọn dẹp thư mục Temp của Windows...
del /f /s /q "%systemroot%\\Temp\\*.*" >nul 2>&1
for /d %%p in ("%systemroot%\\Temp\\*") do rmdir /s /q "%%p" >nul 2>&1

echo [*] 3. Đang dọn dẹp thư mục Temp của Người dùng...
del /f /s /q "%temp%\\*.*" >nul 2>&1
for /d %%p in ("%temp%\\*") do rmdir /s /q "%%p" >nul 2>&1

echo [*] 4. Đang dọn dẹp thư mục Prefetch (Lưu đệm khởi động)...
del /f /s /q "%systemroot%\\Prefetch\\*.*" >nul 2>&1
for /d %%p in ("%systemroot%\\Prefetch\\*") do rmdir /s /q "%%p" >nul 2>&1

echo [*] 5. Đang xóa tệp tin rác Log file (*.log) trong hệ thống...
del /f /s /q "%systemdrive%\\*.log" >nul 2>&1

echo [*] 6. Đang xóa bộ nhớ đệm Windows Update (SoftwareDistribution)...
del /f /s /q "%systemroot%\\SoftwareDistribution\\Download\\*.*" >nul 2>&1
for /d %%p in ("%systemroot%\\SoftwareDistribution\\Download\\*") do rmdir /s /q "%%p" >nul 2>&1

echo [*] 7. Đang dọn dẹp bộ nhớ đệm phân phối tải về (DeliveryOptimization)...
del /f /s /q "%ProgramData%\\Microsoft\\Network\\Downloader\\*.*" >nul 2>&1

echo [*] 8. Đang dọn dẹp Thùng rác (Recycle Bin) cho tất cả ổ đĩa...
rd /s /q %systemdrive%\\$Recycle.Bin >nul 2>&1

echo [*] 9. Đang làm sạch bộ nhớ đệm DNS (Flush DNS Cache)...
ipconfig /flushdns >nul 2>&1

echo [*] 10. Đang kích hoạt lại dịch vụ cập nhật...
net start wuauserv >nul 2>&1
net start bits >nul 2>&1
echo --------------------------------------------------------------------
echo.
echo [+] ĐÃ HOÀN THÀNH QUÁ TRÌNH DỌN RÁC CHUYÊN SÂU!
echo [+] Hệ thống của bạn đã được tối ưu hóa dung lượng ổ đĩa một cách triệt để.
echo ====================================================================
pause`;
}

// 5. Change DNS Script (PowerShell)
export function generateDnsChangerScript(primary: string, secondary: string, dnsName: string): string {
  return `# PowerShell script to change DNS server for active adapters
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Check for Admin permissions
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "Lỗi: Bạn cần khởi chạy PowerShell bằng quyền Administrator để đổi DNS!"
    exit
}

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "         CẬP NHẬT DNS MÁY TÍNH SANG Presets: $dnsName                " -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[-] DNS Mới cấu hình:" -ForegroundColor Yellow
Write-Host "    - DNS Chính (Primary): $primary"
Write-Host "    - DNS Phụ (Secondary): $secondary"
Write-Host ""

$dnsServers = @("$primary", "$secondary")

# Find all active network adapters that have IPv4 enabled
$activeAdapters = Get-CimInstance Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true }

if ($activeAdapters.Count -eq 0) {
    Write-Host "[!] Cảnh báo: Không tìm thấy card mạng hoạt động!" -ForegroundColor Red
} else {
    foreach ($adapter in $activeAdapters) {
        Write-Host "[*] Đang cấu hình card mạng: $($adapter.Description)..." -ForegroundColor Yellow
        $result = $adapter.SetDNSServerSearchOrder($dnsServers)
        if ($result.ReturnValue -eq 0) {
            Write-Host "    [+] Đã cập nhật DNS thành công." -ForegroundColor Green
        } else {
            Write-Host "    [!] Thất bại với mã lỗi: $($result.ReturnValue)" -ForegroundColor Red
        }
    }
}

# Flush DNS Cache to apply instantly
Write-Host ""
Write-Host "[*] Đang xóa bộ nhớ đệm DNS (Flush DNS Cache)..." -ForegroundColor Yellow
ipconfig /flushdns | Out-Null
Write-Host "    [+] Hoàn tất làm mới DNS đệm." -ForegroundColor Green

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Green
Write-Host "[+] HOÀN TẤT THIẾT LẬP DNS CHO MÁY TÍNH CỦA BẠN!" -ForegroundColor Green
Write-Host "====================================================================" -ForegroundColor Green
`;
}

// 6. Word Document Standardizer VBA Macro / Registry / PS Script
export function generateOfficeStandardizerScript(preset: DocumentStandardPreset): string {
  return `# PowerShell script to standardize Word Default Template (Normal.dotm)
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "         CHUẨN HÓA CẤU HÌNH TRANG VĂN BẢN WORD THEO NĐ 30/2020       " -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[*] Cấu hình chuẩn văn bản hành chính Việt Nam:" -ForegroundColor Yellow
Write-Host "    - Font chữ chính: $($preset.fontName)"
Write-Host "    - Cỡ chữ nội dung: $($preset.fontSizeBody) pt"
Write-Host "    - Khổ giấy: $($preset.pageSize) (A4)"
Write-Host "    - Lề Trên (Top Margin): $($preset.marginTop) mm"
Write-Host "    - Lề Dưới (Bottom Margin): $($preset.marginBottom) mm"
Write-Host "    - Lề Trái (Left Margin): $($preset.marginLeft) mm"
Write-Host "    - Lề Phải (Right Margin): $($preset.marginRight) mm"
Write-Host "    - Giãn dòng: $($preset.lineSpacing) lines"
Write-Host ""

$normalPath = "$env:APPDATA\\Microsoft\\Templates\\Normal.dotm"

# 1. Clear ReadOnly attribute on Normal.dotm if exists
if (Test-Path $normalPath) {
    Set-ItemProperty -Path $normalPath -Name IsReadOnly -Value $false -ErrorAction SilentlyContinue
    (Get-Item $normalPath).IsReadOnly = $false
}

# 2. Stop any background Word processes
Write-Host "[*] Đang đóng tiến trình Word ngầm để giải phóng Mẫu chuẩn (Normal.dotm)..." -ForegroundColor Yellow
Stop-Process -Name "WINWORD" -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500

try {
    # Create Word COM Object
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0 # wdAlertsNone
    
    $doc = $word.Documents.Add()
    
    # 1. Page Setup (Convert mm to points via Word COM native MillimetersToPoints)
    $doc.PageSetup.PaperSize = 7 # 7 = wdPaperA4
    $doc.PageSetup.TopMargin = $word.MillimetersToPoints($($preset.marginTop))
    $doc.PageSetup.BottomMargin = $word.MillimetersToPoints($($preset.marginBottom))
    $doc.PageSetup.LeftMargin = $word.MillimetersToPoints($($preset.marginLeft))
    $doc.PageSetup.RightMargin = $word.MillimetersToPoints($($preset.marginRight))
    
    # Save PageSetup as Template Default via Reflection
    $type = $doc.PageSetup.GetType()
    $type.InvokeMember("SetAsTemplateDefault", [System.Reflection.BindingFlags]::InvokeMethod, $null, $doc.PageSetup, $null)
    
    # 2. Font Setup (Normal Style)
    $styleNormal = $doc.Styles.Item("Normal")
    $styleNormal.Font.Name = "$($preset.fontName)"
    $styleNormal.Font.Size = $($preset.fontSizeBody)
    $styleNormal.ParagraphFormat.LineSpacing = [float]($($preset.lineSpacing) * 12) # Line spacing
    $styleNormal.ParagraphFormat.SpaceAfter = 6 # Spacing after paragraph
    
    # Save Normal.dotm template
    $word.NormalTemplate.Save()
    
    $doc.Close(0) # 0 = wdDoNotSaveChanges
    $word.Quit()
    
    Write-Host ""
    Write-Host "====================================================================" -ForegroundColor Green
    Write-Host "[+] ĐÃ THIẾT LẬP CHUẨN VĂN BẢN HÀNH CHÍNH VIỆT NAM THÀNH MẶC ĐỊNH!" -ForegroundColor Green
    Write-Host "    Từ giờ, mỗi khi bạn mở Microsoft Word mới, trang soạn thảo sẽ tự động"
    Write-Host "    được căn lề chuẩn (Trên 2cm, Dưới 2cm, Trái 3cm, Phải 1.5cm)"
    Write-Host "    và cỡ chữ Times New Roman 14pt đúng Nghị định 30/2020!"
    Write-Host "====================================================================" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "[!] LỖI: Không thể tự động cập nhật Mẫu chuẩn Normal.dotm." -ForegroundColor Red
    Write-Host "    Chi tiết lỗi: $_" -ForegroundColor Red
}
`;
}

// 7. Standardize Regional Settings (ShortDate to dd/MM/yyyy)
export function generateRegionalFixScript(): string {
  return `# PowerShell script to fix Excel Date Format (Regional Settings)
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Đang chuẩn hóa định dạng ngày tháng hệ thống thành dd/MM/yyyy..."
Set-ItemProperty -Path "HKCU:\\Control Panel\\International" -Name "sShortDate" -Value "dd/MM/yyyy"
Set-ItemProperty -Path "HKCU:\\Control Panel\\International" -Name "sDate" -Value "/"
Set-ItemProperty -Path "HKCU:\\Control Panel\\International" -Name "iDate" -Value "1"

# Notify Windows of setting change
$signature = '[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)] public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, UIntPtr wParam, string lParam, uint flags, uint timeout, out UIntPtr result);'
$type = Add-Type -MemberDefinition $signature -Name "Win32SendMessage" -Namespace "Win32" -PassThru
$result = [UIntPtr]::Zero
$type::SendMessageTimeout([IntPtr]0xffff, 0x001A, [UIntPtr]::Zero, "Control Panel", 2, 5000, [ref]$result)

Write-Host "Hoàn tất chuẩn hóa dd/MM/yyyy! Hệ thống đã cập nhật tức thì."
`;
}

// 8. Clear Office Cache and Kill Zombie Processes
export function generateOfficeCacheCleanerScript(): string {
  return `# PowerShell script to clean Office cache and fix hangs
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Đang buộc dừng các tiến trình Office bị treo..."
Stop-Process -Name "WINWORD", "EXCEL", "POWERPNT" -Force -ErrorAction SilentlyContinue

Write-Host "Đang dọn dẹp bộ nhớ đệm (Cache) của Office..."
$cachePath = "$env:LOCALAPPDATA\\Microsoft\\Office\\16.0\\OfficeFileCache"
if (Test-Path $cachePath) {
    Remove-Item -Path "$cachePath\\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Đã dọn sạch Office Cache thành công!"
} else {
    Write-Host "Không tìm thấy bộ nhớ đệm Office cần dọn."
}
`;
}

// 9. Clear Office Recent History
export function generateOfficeHistoryCleanerScript(): string {
  return `# PowerShell script to clear Word/Excel recent files history
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Đang xóa lịch sử file đã mở gần đây của Word..."
$wordKey = "HKCU:\\Software\\Microsoft\\Office\\16.0\\Word\\User MRU"
if (Test-Path $wordKey) { Remove-Item -Path $wordKey -Recurse -Force -ErrorAction SilentlyContinue }

Write-Host "Đang xóa lịch sử file đã mở gần đây của Excel..."
$excelKey = "HKCU:\\Software\\Microsoft\\Office\\16.0\\Excel\\User MRU"
if (Test-Path $excelKey) { Remove-Item -Path $excelKey -Recurse -Force -ErrorAction SilentlyContinue }

Write-Host "Đã xóa sạch lịch sử truy cập Office gần đây!"
`;
}

// 10. Factory Reset Office Settings
export function generateOfficeResetScript(): string {
  return `# PowerShell script to factory reset Office settings
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Đang buộc dừng các tiến trình Office..."
Stop-Process -Name "WINWORD", "EXCEL", "POWERPNT" -Force -ErrorAction SilentlyContinue

Write-Host "Đang khôi phục cài đặt gốc của Microsoft Office (Xóa Registry Key)..."
$officeKey = "HKCU:\\Software\\Microsoft\\Office\\16.0"
if (Test-Path $officeKey) {
    Remove-Item -Path $officeKey -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Đã khôi phục cài đặt gốc Office thành công. Hãy mở lại Office để cấu hình tự thiết lập lại."
} else {
    Write-Host "Không tìm thấy cấu hình Office cần khôi phục."
}
`;
}

export function generateFixWordCrashScript(): string {
  return `# PowerShell script to fix Word/Excel crashes
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "[*] Đang đóng toàn bộ tiến trình Word/Excel..."
Stop-Process -Name "WINWORD", "EXCEL", "POWERPNT" -Force -ErrorAction SilentlyContinue

Write-Host "[*] Xóa cache Normal.dotm (Khôi phục khởi động Word)..."
$appData = [Environment]::GetFolderPath("ApplicationData")
$wordTemplates = "$appData\\Microsoft\\Templates"
if (Test-Path "$wordTemplates\\Normal.dotm") {
    Remove-Item "$wordTemplates\\Normal.dotm" -Force
}

Write-Host "[*] Dọn dẹp Add-ins rác gây treo máy..."
$registryPaths = @(
    "HKCU:\\Software\\Microsoft\\Office\\Word\\Addins",
    "HKCU:\\Software\\Microsoft\\Office\\Excel\\Addins"
)
foreach ($path in $registryPaths) {
    if (Test-Path $path) {
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "[+] Đã xử lý xong lỗi treo văng ứng dụng!"
`;
}

export function generateClearOfficeCredentialsScript(): string {
  return `# PowerShell script to clear Office Credentials
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "[*] Đang xóa bộ nhớ đệm xác thực Windows Credentials..."
cmdkey /list | Select-String "MicrosoftOffice" | ForEach-Object { 
    $target = ($_ -split "Target: ")[1]
    if ($target) { cmdkey /delete:$target > $null }
}

Write-Host "[*] Xóa khóa Identity của Office trong Registry..."
$identityKey = "HKCU:\\Software\\Microsoft\\Office\\16.0\\Common\\Identity"
if (Test-Path $identityKey) {
    Remove-Item -Path $identityKey -Recurse -Force -ErrorAction SilentlyContinue
}

$licensingFolder = "$env:LOCALAPPDATA\\Microsoft\\Office\\16.0\\Licensing"
if (Test-Path $licensingFolder) {
    Remove-Item -Path "$licensingFolder\\*" -Force -Recurse -ErrorAction SilentlyContinue
}

Write-Host "[+] Đã xóa sạch phiên đăng nhập bị kẹt. Vui lòng mở lại Office để đăng nhập mới!"
`;
}

export function generateRetailToVolumeScript(): string {
  return `@echo off
chcp 65001 >nul
echo [*] Đang tìm và nạp chứng chỉ Volume (VL) cho Office...

set "officePath="
for %%p in (
    "%ProgramFiles%\\Microsoft Office\\root\\Licenses16"
    "%ProgramFiles(x86)%\\Microsoft Office\\root\\Licenses16"
) do (
    if exist "%%~p\\proplusvl_kms*.xrm-ms" (
        set "officePath=%%~p"
    )
)

if "%officePath%"=="" (
    echo [ERROR] Không tìm thấy thư mục chứng chỉ của Office 16.
    exit /b
)

set "ospp="
for %%p in (
    "%ProgramFiles%\\Microsoft Office\\Office16\\ospp.vbs"
    "%ProgramFiles(x86)%\\Microsoft Office\\Office16\\ospp.vbs"
) do (
    if exist "%%~p" set "ospp=%%~p"
)

if "%ospp%"=="" (
    echo [ERROR] Không tìm thấy file ospp.vbs.
    exit /b
)

echo [*] Nạp chứng chỉ từ: %officePath%
cscript //nologo "%ospp%" /inslic:"%officePath%\\proplusvl_kms_client-ppd.xrm-ms" >nul
cscript //nologo "%ospp%" /inslic:"%officePath%\\proplusvl_kms_client-ul-oob.xrm-ms" >nul
cscript //nologo "%ospp%" /inslic:"%officePath%\\proplusvl_kms_client-ul.xrm-ms" >nul
cscript //nologo "%ospp%" /inslic:"%officePath%\\proplusvl_mak-pl.xrm-ms" >nul
cscript //nologo "%ospp%" /inslic:"%officePath%\\proplusvl_mak-ppd.xrm-ms" >nul
cscript //nologo "%ospp%" /inslic:"%officePath%\\proplusvl_mak-ul-oob.xrm-ms" >nul
cscript //nologo "%ospp%" /inslic:"%officePath%\\proplusvl_mak-ul.xrm-ms" >nul

echo [+] Đã ép chuyển thành công kênh Retail sang Volume Licensing!
`;
}

export function generateBlockOfficeUpdateScript(): string {
  return `# PowerShell script to block Office Updates
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "[*] Đang đóng băng tính năng cập nhật của Office..."
$updateKey = "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Office\\16.0\\Common\\OfficeUpdate"

if (-not (Test-Path $updateKey)) {
    New-Item -Path $updateKey -Force | Out-Null
}

Set-ItemProperty -Path $updateKey -Name "EnableAutomaticUpdates" -Value 0 -Type DWord -Force
Set-ItemProperty -Path $updateKey -Name "HideEnableDisableUpdates" -Value 1 -Type DWord -Force

Write-Host "[+] Đã đóng băng hoàn toàn cập nhật. Phiên bản hiện tại sẽ giữ nguyên!"
`;
}


// 7. Power Scheme Script (Batch)
export function generatePowerSchemeScript(mode: 'battery' | 'balanced' | 'gaming' | 'performance' | 'ultimate'): string {
  let schemeGuid = '';
  let schemeName = '';
  let customConfigCmds = '';

  switch (mode) {
    case 'battery':
      schemeGuid = 'a1841308-3541-4fab-bc81-f71556f20b4a';
      schemeName = 'Power Saver (Tiết kiệm Pin)';
      customConfigCmds = `:: Tối ưu hóa sâu hơn cho tiết kiệm pin
powercfg /setdcvalueindex %guid% sub_processor PROCTHROTTLEMAX 60
powercfg /setacvalueindex %guid% sub_processor PROCTHROTTLEMAX 80`;
      break;
    case 'balanced':
      schemeGuid = '381b4222-f694-41f0-9685-ff5bb260df2e';
      schemeName = 'Balanced (Cân bằng mặc định)';
      break;
    case 'gaming':
    case 'performance':
      schemeGuid = '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c';
      schemeName = 'High Performance (Hiệu năng cao)';
      customConfigCmds = `:: Thiết lập xung nhịp CPU luôn đạt tối thiểu 90%
powercfg /setacvalueindex %guid% sub_processor PROCTHROTTLEMIN 90
powercfg /setacvalueindex %guid% sub_processor PROCTHROTTLEMAX 100
:: Vô hiệu hóa chế độ ngủ đông ổ cứng để phản hồi cực nhanh
powercfg /change disk-timeout-ac 0`;
      break;
    case 'ultimate':
      schemeGuid = 'e9a42b02-d5df-448d-aa00-03e14749eb61'; // Will duplicate ultimate scheme if not active
      schemeName = 'Ultimate Performance (Hiệu năng đỉnh cao)';
      break;
  }

  return `@echo off
:: Yêu cầu quyền Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Vui lòng chạy công cụ này với quyền Administrator (Run as Administrator)!
    pause
    exit /b
)

chcp 65001 >nul
echo ====================================================================
echo   KÍCH HOẠT CHẾ ĐỘ NGUỒN ĐIỆN: ${schemeName.toUpperCase()}
echo ====================================================================
echo.

set "guid=${schemeGuid}"

if "${mode}"=="ultimate" (
    echo [*] Đang kiểm tra xem gói hiệu năng Ultimate Performance đã có sẵn chưa...
    powercfg /list | findstr /i "Ultimate" >nul
    if %errorLevel% neq 0 (
        echo [*] Đang mở khóa gói hiệu năng ẩn 'Ultimate Performance' từ Microsoft...
        powercfg /duplicatescheme 2a037219-d05e-49f3-aa0e-2d3905550139 > "%temp%\\ult_guid.txt"
        
        :: Đọc GUID vừa được tạo ra
        for /f "tokens=4" %%g in ('type "%temp%\\ult_guid.txt"') do (
            set "guid=%%g"
        )
        del "%temp%\\ult_guid.txt" >nul 2>&1
        echo [+] Đã kích hoạt gói 'Ultimate Performance' ẩn thành công.
    ) else (
        :: Tìm GUID của gói Ultimate đã có sẵn
        for /f "tokens=4" %%g in ('powercfg /list ^| findstr /i "Ultimate"') do (
            set "guid=%%g"
        )
        echo [+] Tìm thấy gói 'Ultimate Performance' có sẵn.
    )
)

echo [*] Đang áp dụng sơ đồ nguồn điện hoạt động...
powercfg /setactive %guid%
if %errorLevel% equ 0 (
    echo [+] Đã thay đổi sơ đồ nguồn điện thành công sang: ${schemeName}
) else (
    echo [!] Lỗi khi áp dụng sơ đồ nguồn điện. Thử cách thay thế...
    if "${mode}"=="ultimate" (
        :: Ultimate fallback to high performance if something failed
        powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c
        echo [+] Fallback: Đã kích hoạt High Performance thay thế.
    )
)

${customConfigCmds}

echo.
echo ====================================================================
echo [+] ĐÃ THIẾT LẬP NGUỒN ĐIỆN TỐI ƯU CHO MÁY TÍNH!
echo ====================================================================
pause`;
}

// Office Quick Repair Script (PowerShell / CMD)
export function generateOfficeQuickRepairScript(): string {
  return `# PowerShell script to run Microsoft Office Click-to-Run Quick Repair
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$c2rPath = "$env:CommonProgramFiles\\microsoft shared\\ClickToRun\\OfficeClickToRun.exe"
$c2rPathx86 = "${process.env['CommonProgramFiles(x86)'] || 'C:\\Program Files (x86)\\Common Files'}\\microsoft shared\\ClickToRun\\OfficeClickToRun.exe"

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "      KÍCH HOẠT QUỐC GIA MICROSOFT OFFICE QUICK REPAIR              " -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

if (Test-Path $c2rPath) {
    Write-Host "[*] Đang khởi chạy tiến trình Quick Repair của Microsoft Office (x64)..." -ForegroundColor Yellow
    Start-Process -FilePath $c2rPath -ArgumentList "scenario=Repair platform=x64 culture=en-us RepairType=QuickRepair DisplayLevel=True"
    Write-Host "[+] Đã kích hoạt cửa sổ Quick Repair chính hãng Microsoft thành công!" -ForegroundColor Green
} elseif (Test-Path $c2rPathx86) {
    Write-Host "[*] Đang khởi chạy tiến trình Quick Repair của Microsoft Office (x86)..." -ForegroundColor Yellow
    Start-Process -FilePath $c2rPathx86 -ArgumentList "scenario=Repair platform=x86 culture=en-us RepairType=QuickRepair DisplayLevel=True"
    Write-Host "[+] Đã kích hoạt cửa sổ Quick Repair chính hãng Microsoft thành công!" -ForegroundColor Green
} else {
    Write-Host "[!] Không tìm thấy trình OfficeClickToRun.exe trực tiếp. Đang mở Control Panel AppWiz..." -ForegroundColor Yellow
    & control appwiz.cpl
}
`;
}

