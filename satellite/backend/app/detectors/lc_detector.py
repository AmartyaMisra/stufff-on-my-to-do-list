import numpy as np
import pandas as pd
from astropy.timeseries import BoxLeastSquares
from typing import Dict, Any


def run_lightcurve_detection(meta: Dict[str, Any], times: np.ndarray, flux: np.ndarray) -> Dict[str, Any]:
    mask = np.isfinite(times) & np.isfinite(flux)
    times = times[mask]
    flux = flux[mask]
    if len(times) < 50:
        return {"status": "too_short"}

    df = pd.DataFrame({"t": times, "f": flux})
    df["f_med"] = (
        df["f"]
        .rolling(window=101, center=True, min_periods=5)
        .median()
        .fillna(method="bfill")
        .fillna(method="ffill")
    )
    norm = df["f"].values - df["f_med"].values

    z = (norm - np.nanmedian(norm)) / (np.nanstd(norm) + 1e-12)
    outliers = np.where(np.abs(z) > 5)[0]

    bls = BoxLeastSquares(times, norm)
    periods = np.linspace(0.3, 30.0, 5000)
    res = bls.power(periods, 0.1)
    idx = np.argmax(res.power)
    best_period = periods[idx]
    best_power = float(res.power[idx])
    depth = float(res.depth[idx]) if hasattr(res, "depth") else None

    return {
        "target_id": meta.get("target_id"),
        "n_points": int(len(times)),
        "n_outliers": int(len(outliers)),
        "period_days": float(best_period),
        "bls_power": best_power,
        "depth": depth,
    }

