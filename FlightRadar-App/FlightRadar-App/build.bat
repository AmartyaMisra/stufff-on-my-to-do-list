@echo off
echo Building FlightRadar Desktop App...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    echo Please install npm or reinstall Node.js
    pause
    exit /b 1
)

echo Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo Building the application...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build the application
    pause
    exit /b 1
)

echo Creating desktop executable...
npm run dist:win
if %errorlevel% neq 0 (
    echo ERROR: Failed to create desktop executable
    pause
    exit /b 1
)

echo.
echo SUCCESS! Desktop app created in the 'release' folder
echo You can find the installer in: release\win-unpacked\FlightRadar-App.exe
echo.
pause
