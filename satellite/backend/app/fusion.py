import math
from typing import Dict, List, Any

WINDOWS = {
    ("frb", "neutrino"): 300,
    ("frb", "gw"): 600,
    ("neutrino", "gw"): 3600,
    ("any", "tle"): 86400,
}


def time_factor(dt_seconds: float, tau: float) -> float:
    return math.exp(-abs(dt_seconds) / tau)


def pair_evidence(score_i: float, score_j: float, s_factor: float, t_seconds: float, tau: float) -> float:
    return score_i * score_j * s_factor * time_factor(t_seconds, tau)


def fuse_event(base_event: Dict[str, Any], candidate_events: List[Dict[str, Any]]) -> Dict[str, Any]:
    pairs = []
    for c in candidate_events:
        if c["channel"] == base_event["channel"] and c["id"] == base_event["id"]:
            continue
        dt = (c["event_time"] - base_event["event_time"]).total_seconds()
        window = WINDOWS.get((base_event["channel"], c["channel"])) or WINDOWS.get(
            (c["channel"], base_event["channel"]), 600
        )
        if abs(dt) > window:
            continue
        s = 0.05
        b = base_event.get("payload", {})
        a = c.get("payload", {})
        if b.get("ra") is not None and a.get("ra") is not None:
            ra1, dec1 = math.radians(b.get("ra")), math.radians(b.get("dec", 0))
            ra2, dec2 = math.radians(a.get("ra")), math.radians(a.get("dec", 0))
            cosd = math.sin(dec1) * math.sin(dec2) + math.cos(dec1) * math.cos(dec2) * math.cos(ra1 - ra2)
            cosd = max(-1, min(1, cosd))
            ang = math.degrees(math.acos(cosd))
            r1 = b.get("error_radius_deg", 5.0)
            r2 = a.get("error_radius_deg", 5.0)
            if ang < (r1 + r2):
                s = max(0.05, 1.0 - ang / (r1 + r2))
        evidence = pair_evidence(base_event["score"], c["score"], s, dt, tau=300.0)
        pairs.append({"other_id": c["id"], "channel": c["channel"], "evidence": evidence})
    prod = 1.0
    for p in pairs:
        e = max(0.0, min(1.0, p["evidence"]))
        prod *= (1.0 - e)
    fused_score = 1.0 - prod
    return {"base_id": base_event["id"], "components": pairs, "fused_score": fused_score}

