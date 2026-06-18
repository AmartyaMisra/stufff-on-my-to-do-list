import numpy as np
from typing import Dict, Any


def score_neutrino(alert: Dict[str, Any]) -> Dict[str, Any]:
    energy = float(alert.get("energy_teV", 1.0))
    radius = max(float(alert.get("error_radius_deg", 1.0)), 1e-3)
    sig = float(alert.get("significance", 1.0))
    score_raw = (np.log10(energy + 1) / 3.0) * (1.0 / (np.pi * radius**2)) * min(5.0, sig)
    score = 1.0 / (1.0 + np.exp(-(score_raw - 0.5)))
    return {"score": float(score)}

