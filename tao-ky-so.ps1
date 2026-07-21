$ErrorActionPreference = "Stop"

$subject = "CN=Thien Phat Tech"
$certName = "ThienPhatTech"
$password = ConvertTo-SecureString -String "ThienPhat2026" -Force -AsPlainText
$pfxPath = Join-Path (Get-Location) "$certName.pfx"
$cerPath = Join-Path (Get-Location) "$certName.cer"

Write-Host "Đang tạo chứng chỉ số Self-Signed Certificate..." -ForegroundColor Cyan

# Remove old if exists
if (Test-Path $pfxPath) { Remove-Item $pfxPath -Force }
if (Test-Path $cerPath) { Remove-Item $cerPath -Force }

# Generate Cert
$cert = New-SelfSignedCertificate -Subject $subject -Type CodeSigningCert -CertStoreLocation "Cert:\CurrentUser\My" -NotAfter (Get-Date).AddYears(10)

Write-Host "Đang xuất chứng chỉ ra file PFX (Mật khẩu: ThienPhat2026)..." -ForegroundColor Cyan
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $password | Out-Null

Write-Host "Đang xuất chứng chỉ ra file CER (Public Key)..." -ForegroundColor Cyan
Export-Certificate -Cert $cert -FilePath $cerPath | Out-Null

Write-Host "Đã xuất thành công 2 file:" -ForegroundColor Green
Write-Host "1. $pfxPath (File gốc để Build Tool)"
Write-Host "2. $cerPath (File công khai để cài vào máy khách hàng nếu cần)"

Write-Host "Xóa chứng chỉ trong Store để dọn dẹp..." -ForegroundColor Yellow
Remove-Item -Path "Cert:\CurrentUser\My\$($cert.Thumbprint)" -Force

Write-Host "HOÀN TẤT!" -ForegroundColor Green
