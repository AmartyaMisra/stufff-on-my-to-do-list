# BlackOps Radio Globe - Windows Build Script

Write-Host "=== BlackOps Radio Globe Builder ===" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies!" -ForegroundColor Red
    exit 1
}

# Build for Windows
Write-Host "Building Windows installer..." -ForegroundColor Green
npx electron-builder --win --x64

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Build completed successfully!" -ForegroundColor Green
    Write-Host "Installer location: dist/" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}