# ==============================================================================
# THIEN PHAT TECH TOOLKIT PRO — Standalone Diagnostic Proof Utility
# Location: scripts/diagnostics/proof_diagnostic.ps1
# Description: Queries raw Windows licensing evidence (WMI, Registry, Event Log)
# ==============================================================================

$result = @{ Windows = @{}; System = @{} }

# WMI Licensing product
$wmiObj = Get-CimInstance -ClassName SoftwareLicensingProduct -Filter "PartialProductKey IS NOT NULL" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($wmiObj) {
    $result.Windows.LicenseStatus = $wmiObj.LicenseStatus
    $result.Windows.PartialProductKey = $wmiObj.PartialProductKey
    $result.Windows.KeyManagementServiceMachine = $wmiObj.KeyManagementServiceMachine
    $result.Windows.KeyManagementServicePort = $wmiObj.KeyManagementServicePort
    $result.Windows.GracePeriodRemaining = $wmiObj.GracePeriodRemaining
    $result.Windows.Description = $wmiObj.Description
    $result.Windows.Name = $wmiObj.Name
}

# OA3 BIOS key
$oa3 = (Get-CimInstance -ClassName SoftwareLicensingService -ErrorAction SilentlyContinue).OA3xOriginalProductKey
$result.Windows.OA3Key = $oa3
$result.Windows.HasOA3Key = [bool]($oa3 -and $oa3.Trim().Length -gt 0)

# Slmgr /xpr
$xpr = (cscript //nologo $env:windir\system32\slmgr.vbs /xpr 2>&1) -join " "
$result.Windows.Xpr = $xpr

# Hosts redirects
$result.System.HostsRedirects = @()
$hostsPath = "$env:windir\System32\drivers\etc\hosts"
if (Test-Path $hostsPath) {
    $hostsLines = Get-Content $hostsPath
    foreach ($line in $hostsLines) {
        $trimmed = $line.Trim()
        if ($trimmed -and -not $trimmed.StartsWith("#") -and ($trimmed -match "microsoft\.com|office\.com|kms")) {
            $result.System.HostsRedirects += $trimmed
        }
    }
}

# KMS Events
$result.System.KMSEvents = @()
$events = Get-WinEvent -FilterHashtable @{LogName='Application'; ProviderName='Microsoft-Windows-Security-SPP'; Id=12288,12289} -MaxEvents 5 -ErrorAction SilentlyContinue
foreach ($e in $events) {
    $result.System.KMSEvents += @{
        Id = $e.Id
        Time = $e.TimeCreated.ToString("yyyy-MM-dd HH:mm:ss")
        Provider = $e.ProviderName
        Message = $e.Message
    }
}

# NoGenTicket
$result.System.NoGenTicket = $false
$manualPath = "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\SoftwareProtectionPlatform\Activation\Manual"
if (Test-Path $manualPath) {
    $p = Get-ItemProperty -Path $manualPath -Name "NoGenTicket" -ErrorAction SilentlyContinue
    if ($p -and $p.NoGenTicket -eq 1) { $result.System.NoGenTicket = $true }
}

# MasHistory proof
$result.System.MasHistory = $false
$masRegPaths = @(
    "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\SoftwareProtectionPlatform\Activation\Manual",
    "HKLM:\SOFTWARE\Classes\CLSID\{ADB880A6-D8FF-11CF-9377-00AA003B7A11}",
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Policies\System"
)
foreach ($rp in $masRegPaths) {
    if (Test-Path $rp) {
        $props = Get-ItemProperty -Path $rp -ErrorAction SilentlyContinue
        if ($props) {
            $propNames = $props.PSObject.Properties.Name
            $matchedNames = $propNames | Where-Object { $_ -match "^(MAS|HWID|MAS_HWID)$" }
            if ($matchedNames) {
                $result.System.MasHistory = $true
                $result.System.MatchedMasPath = $rp
                $result.System.AllPropNamesInPath = $propNames -join ", "
                $result.System.MatchedPropNames = $matchedNames -join ", "
                break
            }
        }
    }
}

# IsKMS38 proof
$result.System.IsKMS38 = $false
$result.System.IsKMS38_Reason = ""
if ($xpr -and $xpr -match "2038") {
    $result.System.IsKMS38 = $true
    $result.System.IsKMS38_Reason = "Xpr contains 2038"
}
$kms38StorePaths = @(
    "$env:SystemRoot\System32\spp\store_test"
)
foreach ($sp in $kms38StorePaths) {
    $expanded = [System.Environment]::ExpandEnvironmentVariables($sp)
    if (Test-Path $expanded) {
        $result.System.IsKMS38 = $true
        $result.System.MatchedKms38Path = $expanded
        $result.System.IsKMS38_Reason += " | Path exists: $expanded"
        break
    }
}

# IsFakeKMS proof
$result.System.IsFakeKMS = $false
$kmsHost = $result.Windows.KeyManagementServiceMachine
if ($kmsHost -and $kmsHost.Trim().Length -gt 0) {
    $kmsHostLower = $kmsHost.Trim().ToLower()
    $fakePatterns = @("0.0.0.0","127.0.0.","localhost","loli","digiboy","msguides","zdf","kms.","kms8.","kms9.","skms.","vlmcs.","kmsauto","aact","kms4dotnet","kms-activation","novaxm","xinso")
    foreach ($pat in $fakePatterns) {
        if ($kmsHostLower -match [regex]::Escape($pat)) { $result.System.IsFakeKMS = $true; break }
    }
}

$result | ConvertTo-Json -Depth 5
