@echo off
title AETHER MONITOR v2.3
echo.
echo  ========================================
echo    AETHER MONITOR v2.3 - Starting...
echo  ========================================
echo.

:: Kill any existing processes
taskkill /F /IM node.exe >nul 2>&1

:: Start server
echo [1/2] Starting backend server...
start /B cmd /c "node server.js"
timeout /t 2 /nobreak >nul

:: Start frontend
echo [2/2] Starting frontend...
start /B cmd /c "npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo  ========================================
echo    AETHER MONITOR is now running!
echo    Open http://localhost:5173 in browser
echo  ========================================
echo.
echo Press any key to stop servers...
pause >nul

:: Cleanup
taskkill /F /IM node.exe >nul 2>&1
echo Servers stopped.
