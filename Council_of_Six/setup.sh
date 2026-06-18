#!/bin/bash

echo "============================================================"
echo "Council of Six - Setup Script"
echo "============================================================"
echo ""

# Check Python
echo "[STEP 1] Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 not found!"
    exit 1
fi
echo "[SUCCESS] Python found"
echo ""

# Create virtual environment
echo "[STEP 2] Creating virtual environment..."
python3 -m venv council_env
source council_env/bin/activate
echo "[SUCCESS] Virtual environment activated"
echo ""

# Install dependencies
echo "[STEP 3] Installing dependencies..."
pip3 install --upgrade pip
pip3 install llama-cpp-python huggingface_hub requests

if [ $? -ne 0 ]; then
    echo "[ERROR] Installation failed!"
    exit 1
fi
echo "[SUCCESS] Dependencies installed"
echo ""

# Download model
echo "[STEP 4] Downloading model..."
python3 download_model.py

echo ""
echo "============================================================"
echo "SETUP COMPLETE!"
echo "============================================================"
echo ""
echo "To run:"
echo "  source council_env/bin/activate"
echo "  python3 main.py"
echo ""