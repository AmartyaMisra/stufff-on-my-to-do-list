"""
Automated GGUF Model Downloader for Council of Six
Downloads Mistral-7B-Instruct quantized model from Hugging Face
"""

import os
import sys
from pathlib import Path

try:
    from huggingface_hub import hf_hub_download, login
    HF_AVAILABLE = True
except ImportError:
    HF_AVAILABLE = False
    print("[ERROR] huggingface_hub not installed.")
    print("Install with: pip install huggingface_hub")
    sys.exit(1)


def download_model():
    """Download Mistral-7B GGUF model"""
    
    # Configuration
    REPO_ID = "TheBloke/Mistral-7B-Instruct-v0.2-GGUF"
    FILENAME = "mistral-7b-instruct-v0.2.Q4_K_M.gguf"
    MODEL_DIR = Path("models")
    
    print("=" * 60)
    print("Council of Six - Model Downloader")
    print("=" * 60)
    print(f"\nRepository: {REPO_ID}")
    print(f"File: {FILENAME}")
    print(f"Size: ~4.3 GB")
    print(f"Destination: {MODEL_DIR}/")
    print()
    
    # Create models directory
    MODEL_DIR.mkdir(exist_ok=True)
    
    # Check if already downloaded
    model_path = MODEL_DIR / FILENAME
    if model_path.exists():
        print(f"[INFO] Model already exists at {model_path}")
        response = input("Re-download? (y/n): ").strip().lower()
        if response != 'y':
            print("[INFO] Using existing model.")
            return
        model_path.unlink()
    
    # Request Hugging Face token
    print("\n[STEP 1] Hugging Face Authentication")
    print("Get your token at: https://huggingface.co/settings/tokens")
    print("Required scope: read")
    print()
    
    token = input("Enter your Hugging Face token (or press Enter to skip): ").strip()
    
    if token:
        try:
            login(token=token)
            print("[SUCCESS] Authenticated with Hugging Face")
        except Exception as e:
            print(f"[WARNING] Authentication failed: {e}")
            print("Proceeding without authentication (may work for public repos)")
    else:
        print("[INFO] Skipping authentication")
    
    # Download model
    print(f"\n[STEP 2] Downloading {FILENAME}...")
    print("This may take 10-30 minutes depending on your connection.")
    print()
    
    try:
        downloaded_path = hf_hub_download(
            repo_id=REPO_ID,
            filename=FILENAME,
            local_dir=MODEL_DIR,
            local_dir_use_symlinks=False
        )
        
        print(f"\n[SUCCESS] Model downloaded to {downloaded_path}")
        print(f"File size: {os.path.getsize(downloaded_path) / (1024**3):.2f} GB")
        print("\nYou can now run: python main.py")
        
    except Exception as e:
        print(f"\n[ERROR] Download failed: {e}")
        print("\nTroubleshooting:")
        print("1. Check your internet connection")
        print("2. Verify your Hugging Face token has 'read' access")
        print("3. Try manual download from:")
        print(f"   https://huggingface.co/{REPO_ID}/tree/main")
        print(f"   Place {FILENAME} in the models/ folder")
        sys.exit(1)


def verify_model():
    """Verify downloaded model integrity"""
    model_path = Path("models/mistral-7b-instruct-v0.2.Q4_K_M.gguf")
    
    if not model_path.exists():
        print("[ERROR] Model file not found!")
        return False
    
    file_size = model_path.stat().st_size
    expected_min = 4.0 * 1024**3  # 4 GB minimum
    expected_max = 5.0 * 1024**3  # 5 GB maximum
    
    if expected_min <= file_size <= expected_max:
        print(f"[SUCCESS] Model verification passed ({file_size / 1024**3:.2f} GB)")
        return True
    else:
        print(f"[WARNING] Unexpected file size: {file_size / 1024**3:.2f} GB")
        print("Expected: 4.0 - 5.0 GB")
        return False


if __name__ == "__main__":
    try:
        download_model()
        print("\n" + "=" * 60)
        print("Verifying download...")
        verify_model()
        print("=" * 60)
        print("\nSetup complete! Run: python main.py")
        
    except KeyboardInterrupt:
        print("\n\n[INFO] Download cancelled by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n[FATAL ERROR] {e}")
        sys.exit(1)