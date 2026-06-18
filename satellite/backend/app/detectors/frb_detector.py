import numpy as np
from typing import Dict, Any, List
from ..utils import save_array
import uuid

DM_CONST = 4.148808e3  # ms MHz^2 pc^-1 cm^3


def _dedisperse_and_search(
    spectrogram: np.ndarray,
    freqs_mhz: np.ndarray,
    dt_ms: float,
    dm_trials: np.ndarray,
    snr_thresh: float = 8.0,
) -> List[Dict[str, Any]]:
    n_freq, n_time = spectrogram.shape
    spec = spectrogram - np.median(spectrogram, axis=1, keepdims=True)
    sigma = np.std(spec, axis=1, keepdims=True)
    sigma[sigma == 0] = 1.0
    spec_norm = spec / sigma
    candidates: List[Dict[str, Any]] = []

    f_ref = freqs_mhz.max()
    for dm in dm_trials:
        delays_ms = DM_CONST * dm * (1.0 / (freqs_mhz**2) - 1.0 / (f_ref**2))
        delays_bins = np.round(delays_ms / dt_ms).astype(int)
        dedisp = np.zeros(n_time)
        for i in range(n_freq):
            shift = delays_bins[i]
            row = spec_norm[i]
            if shift > 0:
                dedisp[: n_time - shift] += row[shift:]
            elif shift < 0:
                dedisp[-shift:] += row[: n_time + shift]
            else:
                dedisp += row

        for width in [1, 2, 4, 8, 16]:
            kernel = np.ones(width)
            conv = np.convolve(dedisp, kernel, mode="same") / np.sqrt(width)
            mu = np.median(conv)
            sig = np.std(conv)
            if sig == 0:
                continue
            snr_series = (conv - mu) / sig
            peaks = np.where(snr_series > snr_thresh)[0]
            for p in peaks:
                candidates.append(
                    {
                        "dm": float(dm),
                        "snr": float(snr_series[p]),
                        "time_idx": int(p),
                        "width_bins": width,
                    }
                )
    return candidates


def run_frb_detection(ingest_meta: Dict[str, Any], spectrogram_path: str) -> List[Dict[str, Any]]:
    arr = np.load(spectrogram_path)
    freqs = np.array(ingest_meta.get("freqs_mhz", np.linspace(400, 800, arr.shape[0])))
    dt_ms = float(ingest_meta.get("dt_ms", 1.0))
    dm_trials = np.linspace(0, 3000, 200)
    cands = _dedisperse_and_search(arr, freqs, dt_ms, dm_trials, snr_thresh=8.0)

    for c in cands:
        t = c["time_idx"]
        w = c["width_bins"]
        t0 = max(0, t - 4 * w)
        t1 = min(arr.shape[1], t + 4 * w)
        snippet = arr[:, t0:t1]
        fname = f"radio/snippets/{uuid.uuid4().hex}.npy"
        save_array(snippet, fname)
        c["snippet_path"] = fname
    return cands

