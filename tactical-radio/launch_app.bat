@echo off
TITLE Tactical Radio App Launcher
COLOR 0A
CLS
ECHO Initializing Tactical Radio System...

:: Ensure we are in the script directory
cd /d "%~dp0"

:: AUTO-FIX: Kill anything running on port 5173 to prevent "Port in use" errors
ECHO Clearing radio frequencies (Port 5173)...
FOR /F "tokens=5" %%a IN ('netstat -aon ^| find ":5173" ^| find "LISTENING"') DO (
    ECHO Killing blocking process PID %%a...
    taskkill /f /pid %%a >nul 2>&1
)

:: Check for node_modules
IF NOT EXIST "node_modules" (
    ECHO Installing dependencies...
    call npm install
)

:: Start Server in Background
ECHO Starting Frequency Scanner...
start /B npm run dev -- --port 5173 --strictPort

:: Wait for server to spin up
timeout /t 5 /nobreak >nul

:: Launch Browser in App Mode
ECHO Launching Interface...
IF EXIST "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:5173
) ELSE IF EXIST "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:5173
) ELSE (
    ECHO Chrome/Edge not found at default paths. Opening default browser...
    start http://localhost:5173
)

ECHO System Active. Close this window to stop the server.
PAUSE
