import requests
import healpy as hp
import numpy as np
import gzip
import tempfile
from typing import Dict, Any


def fetch_skymap(skymap_url: str):
    r = requests.get(skymap_url, timeout=10)
    r.raise_for_status()
    content = r.content
    if skymap_url.endswith(".gz"):
        content = gzip.decompress(content)
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(content)
        tmp.flush()
        m = hp.read_map(tmp.name, verbose=False)
    return m


def evaluate_gw_alert(payload: Dict[str, Any]) -> Dict[str, Any]:
    far = float(payload.get("far", 1.0))
    snr = float(payload.get("snr", 0.0))
    score = max(0.0, min(1.0, -np.log10(max(far, 1e-12)) / 12.0)) * min(1.0, snr / 50.0)
    has_skymap = False
    if payload.get("skymap_url"):
        try:
            fetch_skymap(payload["skymap_url"])
            has_skymap = True
        except Exception:
            has_skymap = False
    return {"score": float(score), "has_skymap": has_skymap}

