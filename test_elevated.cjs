const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

function runPowerShellScriptElevated(scriptContent) {
  return new Promise((resolve, reject) => {
    const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const tempFile = path.join(os.tmpdir(), `tp_script_el_${uniqueId}.ps1`);
    const outputFile = path.join(os.tmpdir(), `tp_out_el_${uniqueId}.json`);
    
    const wrappedScript = `
& {
${scriptContent}
} | Out-File -FilePath "${outputFile}" -Encoding utf8
`;

    const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
    const fileContent = Buffer.concat([bom, Buffer.from(wrappedScript, 'utf8')]);
    
    fs.writeFile(tempFile, fileContent, (err) => {
      if (err) return reject(err);
      
      const elevatePath = path.join(__dirname, 'elevate.exe');
      const cmd = `"${elevatePath}" -wait powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${tempFile}"`;
      
      console.log("Running command:", cmd);
      
      exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (execErr, stdout, stderr) => {
        console.log("execErr:", execErr ? execErr.message : null);
        console.log("stdout:", stdout);
        console.log("stderr:", stderr);
        
        fs.readFile(outputFile, 'utf8', (readErr, data) => {
          console.log("readErr:", readErr ? readErr.message : null);
          console.log("outputData:", data);
          
          fs.unlink(tempFile, () => {});
          fs.unlink(outputFile, () => {});
          
          if (readErr) {
            reject(readErr);
          } else {
            resolve(data);
          }
        });
      });
    });
  });
}

const cleanupScript = `
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$categories = @("system_temp","user_temp","prefetch","win_update")

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

foreach ($cat in $categories) {
  if ($paths.ContainsKey($cat)) {
    $path = $paths[$cat]
    $logs += "[*] Đang dọn dẹp thư mục: $path..."
    $cleared = Clean-Directory $path
    $totalClearedBytes += $cleared
    $logs += "[+] Đã dọn dẹp xong. Giải phóng $([math]::Round($cleared / 1MB, 2)) MB."
  }
}

$res = @{
  logs = $logs
  clearedMB = [math]::Round($totalClearedBytes / 1MB, 2)
}
$res | ConvertTo-Json
`;

console.log("Starting test...");
runPowerShellScriptElevated(cleanupScript)
  .then(res => {
    console.log("SUCCESS RESULT LENGTH:", res.length);
    try {
        console.log("PARSED:", JSON.parse(res));
    } catch(e) {
        console.log("JSON PARSE ERROR:", e.message);
    }
  })
  .catch(err => console.log("ERROR:", err.message));
