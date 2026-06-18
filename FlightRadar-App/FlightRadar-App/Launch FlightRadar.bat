@echo off
setlocal enabledelayedexpansion
title FlightRadar-App Launcher
color 0A

echo ============================================
echo        FLIGHTRADAR-APP LAUNCHER
echo ============================================
echo.

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"
REM Remove trailing backslash
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

REM Navigate to the script's directory
cd /d "%SCRIPT_DIR%"
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Failed to change to directory: %SCRIPT_DIR%
    pause
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version 2^>^&1') do set NODE_VER=%%i
echo [OK] Node.js: %NODE_VER%

REM Check if npm is installed
where npm >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] npm is not installed
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version 2^>^&1') do set NPM_VER=%%i
echo [OK] npm: %NPM_VER%

REM Check if package.json exists
if not exist "package.json" (
    color 0C
    echo [ERROR] package.json not found in %CD%
    pause
    exit /b 1
)

echo.

REM Kill any existing FlightRadar/Electron instances to prevent cache conflicts
echo [CLEANUP] Closing any existing instances...
taskkill /F /IM electron.exe >nul 2>&1
timeout /t 1 /nobreak >nul

REM Clean GPU cache to prevent access denied errors
if exist "%APPDATA%\flightradar-app\GPUCache" (
    rd /s /q "%APPDATA%\flightradar-app\GPUCache" >nul 2>&1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules\" (
    echo.
    echo [SETUP] Installing dependencies for first time...
    echo This may take a few minutes...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencies installed!
    echo.
)

echo.
echo ============================================
echo      LAUNCHING FLIGHTRADAR-APP...
echo ============================================
echo.
echo Keep this window open while the app is running.
echo Close this window or press Ctrl+C to exit.
echo.

REM Start the application in dev mode
call npm run dev

REM Check if npm run dev failed
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Application exited with error code: %errorlevel%
    echo.
)

echo.
echo FlightRadar-App has closed.
pause
endlocal
