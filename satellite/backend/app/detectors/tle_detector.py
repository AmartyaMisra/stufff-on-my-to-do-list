from sgp4.api import Satrec
from typing import List, Dict, Any


def analyze_tle(tle_lines: str, history: List[Dict[str, Any]]) -> Dict[str, Any]:
    lines = [ln.strip() for ln in tle_lines.strip().splitlines() if ln.strip()]
    if len(lines) == 3:
        name, l1, l2 = lines
    elif len(lines) == 2:
        name = "unknown"
        l1, l2 = lines
    else:
        raise ValueError("Invalid TLE provided")

    sat = Satrec.twoline2rv(l1, l2)
    mean_motion = float(sat.no_kozai)  # rad/min
    anomaly = None
    if history:
        last = history[-1]
        if "mean_motion" in last:
            delta = abs(mean_motion - last["mean_motion"])
            if delta > 1e-6:
                anomaly = {"type": "mean_motion_change", "delta": delta}
    return {"name": name, "mean_motion": mean_motion, "anomaly": anomaly}

