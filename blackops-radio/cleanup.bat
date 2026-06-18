@echo off
echo ========================================
echo  BlackOps Radio - Project Cleanup
echo ========================================
echo.
echo This will DELETE unnecessary files:
echo  - seeds.json
echo  - dist/ folder
echo  - node_modules/ folder
echo  - Any .txt, .bak, .old files
echo.
echo The app will reinstall fresh dependencies.
echo.
pause

echo.
echo Starting cleanup...
echo.

REM Delete seeds.json
if exist "seeds.json" (
    del /F /Q "seeds.json"
    echo [DELETED] seeds.json
) else (
    echo [SKIP] seeds.json not found
)

REM Delete dist folder
if exist "dist" (
    rmdir /S /Q "dist"
    echo [DELETED] dist folder
) else (
    echo [SKIP] dist folder not found
)

REM Delete node_modules folder
if exist "node_modules" (
    echo [DELETING] node_modules folder (this may take a moment...)
    rmdir /S /Q "node_modules"
    echo [DELETED] node_modules folder
) else (
    echo [SKIP] node_modules folder not found
)

REM Delete backup files
if exist "*.txt" (
    del /F /Q "*.txt"
    echo [DELETED] .txt files
)

if exist "*.bak" (
    del /F /Q "*.bak"
    echo [DELETED] .bak files
)

if exist "*.old" (
    del /F /Q "*.old"
    echo [DELETED] .old files
)

echo.
echo ========================================
echo  Cleanup Complete!
echo ========================================
echo.
echo Your project now has only essential files.
echo.
echo Next steps:
echo  1. Replace globe_v3_renderer.js with the new version
echo  2. Create README.md file
echo  3. Run: run.ps1
echo.
echo Press any key to exit...
pause >nul