# Cross-compile Shoppage 100% Pure Go platform for Linux (amd64) from Windows
Write-Host "Compiling Shoppage Unified Platform for Linux amd64 (CGO=0)..." -ForegroundColor Cyan

$env:GOOS = "linux"
$env:GOARCH = "amd64"
$env:CGO_ENABLED = "0"

if (Test-Path "C:\Program Files\Go\bin\go.exe") {
    & "C:\Program Files\Go\bin\go.exe" build -ldflags="-s -w" -o bin/shoppage-linux-amd64 ./services/consumer-web/cmd/server/main.go
} else {
    go build -ldflags="-s -w" -o bin/shoppage-linux-amd64 ./services/consumer-web/cmd/server/main.go
}

if ($LASTEXITCODE -eq 0) {
    $size = (Get-Item bin/shoppage-linux-amd64).Length / 1MB
    Write-Host ("Build Success! Generated bin/shoppage-linux-amd64 ({0:N1} MB)" -f $size) -ForegroundColor Green
    Write-Host "Ready to SCP / upload directly to any Ubuntu/Debian Linux VPS." -ForegroundColor Yellow
} else {
    Write-Host "Cross-compilation failed." -ForegroundColor Red
}
