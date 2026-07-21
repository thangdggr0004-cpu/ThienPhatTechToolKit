$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$hasModule = $true
try {
    Import-Module BitLocker -ErrorAction Stop
} catch {
    $hasModule = $false
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
        $status = "FullyDecrypted"
        $protection = "Off"
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
