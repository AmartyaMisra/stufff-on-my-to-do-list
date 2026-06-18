@echo off
REM ============================================================
REM Council of Six v2.2 - Cleanup Script
REM Removes unnecessary build artifacts and old files
REM ============================================================

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║     COUNCIL OF SIX - CLEANUP UTILITY                    ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo This will remove:
echo   • build/ folder (PyInstaller artifacts)
echo   • dist/ folder (failed EXE files)
echo   • Council_of_Six.spec (PyInstaller spec)
echo   • __pycache__/ folders (Python cache)
echo.
echo Your models, database, and source files will be kept safe!
echo.
pause

REM Remove build artifacts
echo.
echo Cleaning up...
echo.

if exist "build\" (
    echo Removing build folder...
    rmdir /S /Q "build"
)

if exist "dist\" (
    echo Removing dist folder...
    rmdir /S /Q "dist"
)

if exist "Council_of_Six.spec" (
    echo Removing spec file...
    del /F /Q "Council_of_Six.spec"
)

if exist "__pycache__\" (
    echo Removing Python cache...
    rmdir /S /Q "__pycache__"
)

REM Optional: Remove old database (ask first)
echo.
echo Do you want to delete the old database? (Y/N)
echo This will clear all conversation history.
set /p DELETE_DB="Delete council_memory.db? (Y/N): "

if /i "%DELETE_DB%"=="Y" (
    if exist "council_memory.db" (
        del /F /Q "council_memory.db"
        echo Database deleted.
    )
)

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                  CLEANUP COMPLETE!                       ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo Your folder is now clean and organized.
echo.
pause