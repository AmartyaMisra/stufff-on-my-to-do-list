# PowerShell script to run Space Anomaly Radar locally

Write-Host "Setting up Space Anomaly Radar..." -ForegroundColor Cyan

# Check Python
Write-Host "`nChecking Python..." -ForegroundColor Yellow
python --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Python not found! Please install Python 3.11+" -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "`nChecking Node.js..." -ForegroundColor Yellow
node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Node.js not found! Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Setup Backend
Write-Host "`nSetting up backend..." -ForegroundColor Yellow
Set-Location backend

if (-Not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Green
    python -m venv venv
}

Write-Host "Activating virtual environment..." -ForegroundColor Green
& .\venv\Scripts\Activate.ps1

Write-Host "Installing Python dependencies..." -ForegroundColor Green
pip install -r ..\requirements.txt

Write-Host "Initializing database..." -ForegroundColor Green
python -c "from database.models import init_db; init_db()"

Write-Host "`nStarting backend server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\venv\Scripts\Activate.ps1; uvicorn main:app --reload --host 0.0.0.0 --port 8000"

Set-Location ..

# Setup Frontend
Write-Host "`nSetting up frontend..." -ForegroundColor Yellow
Set-Location frontend

Write-Host "Installing/Verifying Node.js dependencies..." -ForegroundColor Green
    npm install

Write-Host "`nStarting frontend server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm start"

Set-Location ..

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Space Anomaly Radar is starting!" -ForegroundColor Green
Write-Host "Backend: http://localhost:8000" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

