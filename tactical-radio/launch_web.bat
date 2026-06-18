@echo off
TITLE Tactical Radio Web Launcher
COLOR 0A
CLS
ECHO Initializing Tactical Radio System...

cd /d "%~dp0"

:: AUTO-FIX: Kill anything running on port 5173
ECHO Clearing radio frequencies (Port 5173)...
FOR /F "tokens=5" %%a IN ('netstat -aon ^| find ":5173" ^| find "LISTENING"') DO (
    ECHO Killing blocking process PID %%a...
    taskkill /f /pid %%a >nul 2>&1
)

IF NOT EXIST "node_modules" (
    ECHO Installing dependencies...
    call npm install
)

ECHO Starting Frequency Scanner...
call npm run dev -- --open --port 5173 --strictPort
PAUSE
