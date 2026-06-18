import os
import numpy as np
from datetime import datetime, timezone

DATA_DIR = os.environ.get("DATA_DIR", "/data")


def ensure_dir(path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)


def save_array(arr: np.ndarray, path: str) -> str:
    full = os.path.join(DATA_DIR, path.lstrip("/"))
    ensure_dir(full)
    np.save(full, arr)
    return full


def now_ts_iso():
    return datetime.now(timezone.utc).isoformat()

