@echo off
echo Starting PalantirPredict...

:: Set environment variables
set NODE_ENV=development
set PORT=3000

:: Check if port 3000 is in use
netstat -ano | findstr :3000
if %ERRORLEVEL% EQU 0 (
    echo Port 3000 is already in use. Please close the application using it or check for stuck processes.
    pause
    exit /b
)

:: Install all dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

:: Start the application
echo Starting server on port %PORT%...
echo Browser will open in 10 seconds...
start "Browser Opener" /min cmd /c "timeout /t 10 >nul && start http://127.0.0.1:%PORT%"
call npx tsx server/index.ts

pause
