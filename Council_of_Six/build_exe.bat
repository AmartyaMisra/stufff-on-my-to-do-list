@echo off
REM ============================================================
REM Council of Six v2.2 - Simple Setup (No EXE Compilation)
REM Direct Python execution - more reliable!
REM ============================================================

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║     COUNCIL OF SIX v2.2 - SETUP WIZARD                  ║
echo ║         Military-Grade AI Debate Platform               ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM Check Python
echo [STEP 1/3] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found!
    echo.
    echo Download Python 3.10+ from: https://www.python.org/downloads/
    echo Check "Add Python to PATH" during installation!
    echo.
    pause
    exit /b 1
)

FOR /F "tokens=2" %%i IN ('python --version 2^>^&1') DO SET PYVER=%%i
echo [SUCCESS] Python %PYVER% found
echo.

REM Install dependencies
echo [STEP 2/3] Installing dependencies...
echo This takes 2-3 minutes...
echo.

pip install llama-cpp-python huggingface_hub requests --quiet

if errorlevel 1 (
    echo [ERROR] Installation failed!
    echo.
    echo Try manually:
    echo   pip install llama-cpp-python huggingface_hub requests
    echo.
    pause
    exit /b 1
)

echo [SUCCESS] All dependencies installed
echo.

REM Download model
echo [STEP 3/3] Checking for AI model...
echo.

REM Check if model already exists
if exist "models\dolphin-2_6-phi-2.Q4_K_M.gguf" (
    echo [SUCCESS] Dolphin model already installed!
    echo Skipping download...
    echo.
    goto :skip_download
)

if exist "models\mistral-7b-instruct-v0.2.Q4_K_M.gguf" (
    echo [SUCCESS] Mistral model already installed!
    echo Skipping download...
    echo.
    goto :skip_download
)

echo No AI model found. Downloading now...
echo This downloads 1.6 GB - takes 5-10 minutes
echo You need a free HuggingFace token from:
echo   https://huggingface.co/settings/tokens
echo.

python download_model.py

if errorlevel 1 (
    echo.
    echo [WARNING] Model download skipped
    echo App will run in SIMULATOR MODE (limited responses)
    echo.
    echo To download later: python download_model.py
    echo.
)

:skip_download

REM Create launcher batch file
echo.
echo Creating launcher...

echo @echo off > START_COUNCIL.bat
echo cd /d "%%~dp0" >> START_COUNCIL.bat
echo python main.py >> START_COUNCIL.bat
echo pause >> START_COUNCIL.bat

echo [SUCCESS] Launcher created
echo.

REM Done!
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                  SETUP COMPLETE!                         ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo TO START THE APP:
echo.
echo   METHOD 1: Double-click START_COUNCIL.bat
echo   METHOD 2: Run: python main.py
echo.
echo ============================================================
echo QUICK START
echo ============================================================
echo.
echo 1. Launch using one of the methods above
echo 2. Type your question in the input box
echo 3. Press Enter or click TRANSMIT
echo 4. Wait 30-40 seconds for the debate
echo.
echo Example questions:
echo   • Should I quit my job?
echo   • Is democracy failing?
echo   • Should we colonize Mars?
echo.
echo ============================================================
echo SYSTEM STATUS
echo ============================================================
echo.
echo ✓ Python %PYVER% ready
echo ✓ Dependencies installed

if exist "models\dolphin-2_6-phi-2.Q4_K_M.gguf" (
    echo ✓ AI model ready ^(Full LLM mode^)
) else if exist "models\mistral-7b-instruct-v0.2.Q4_K_M.gguf" (
    echo ✓ AI model ready ^(Full LLM mode^)
) else (
    echo ⚠ No AI model ^(Simulator mode^)
)

echo ✓ Launcher created ^(START_COUNCIL.bat^)
echo.
echo For help, see README.md
echo.
echo Press any key to launch the app now...
pause >nul

START_COUNCIL.bat