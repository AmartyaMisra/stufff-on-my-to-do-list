"""
Threat State Engine - Computes system threat level based on active events
States: QUIET → LOCAL → MULTI → HIGH_CONFIDENCE
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any
import random

from database.models import Event, AnomalyDetection, FusedEvent


class ThreatState:
    QUIET = "QUIET"
    LOCAL = "LOCAL"
    MULTI = "MULTI"
    HIGH_CONFIDENCE = "HIGH_CONFIDENCE"


def compute_threat_state(db: Session) -> Dict[str, Any]:
    """
    Compute the current threat state based on:
    - Number of active events (last 5 minutes)
    - Number of distinct channels with events
    - Fusion score (if any fused events exist)
    """
    now = datetime.utcnow()
    window = timedelta(minutes=5)
    cutoff = now - window
    
    # Count recent events
    recent_events = db.query(Event).filter(Event.timestamp >= cutoff).all()
    event_count = len(recent_events)
    
    # Count distinct channels
    channels = set(e.event_type for e in recent_events)
    channel_count = len(channels)
    
    # Get latest event time
    latest_event = db.query(Event).order_by(Event.timestamp.desc()).first()
    if latest_event:
        last_event_seconds = int((now - latest_event.timestamp).total_seconds())
    else:
        last_event_seconds = 9999
    
    # Check for fused events (high correlation)
    recent_fused = db.query(FusedEvent).filter(
        FusedEvent.fused_timestamp >= cutoff
    ).all()
    has_fusion = len(recent_fused) > 0
    max_fusion_confidence = max((f.confidence for f in recent_fused), default=0.0)
    
    # Count high-severity anomalies
    high_severity_count = db.query(AnomalyDetection).filter(
        AnomalyDetection.detected_at >= cutoff,
        AnomalyDetection.severity.in_(["high", "critical"])
    ).count()
    
    # Determine threat state
    if has_fusion and max_fusion_confidence > 0.8:
        state = ThreatState.HIGH_CONFIDENCE
        confidence = max_fusion_confidence
    elif channel_count >= 3 or high_severity_count >= 2:
        state = ThreatState.MULTI
        confidence = min(0.7 + (channel_count * 0.05), 0.95)
    elif event_count >= 1 or channel_count >= 1:
        state = ThreatState.LOCAL
        confidence = min(0.4 + (event_count * 0.1), 0.7)
    else:
        state = ThreatState.QUIET
        confidence = 0.0 if event_count == 0 else 0.2
    
    # Build fusion reasons (evidence chain)
    fusion_reasons = []
    if has_fusion:
        fusion_reasons.append(f"Multi-sensor correlation detected (confidence: {max_fusion_confidence:.0%})")
    if high_severity_count > 0:
        fusion_reasons.append(f"{high_severity_count} high-severity anomalies active")
    if channel_count >= 3:
        fusion_reasons.append(f"{channel_count} distinct channels reporting simultaneously")
    
    # Add specific channel context
    if "spaceweather" in channels:
        fusion_reasons.append("Solar/geomagnetic activity influencing propagation")
    if "frb" in channels:
        fusion_reasons.append("Fast Radio Burst detected - extragalactic origin")
    if "gw" in channels:
        fusion_reasons.append("Gravitational wave trigger - compact object merger")
    if "radio_monitor" in channels:
        fusion_reasons.append("Radio spectrum anomaly on monitored bands")
    
    return {
        "state": state,
        "confidence": round(confidence, 2),
        "last_event_seconds": last_event_seconds,
        "active_events": event_count,
        "active_channels": list(channels),
        "fused_events": len(recent_fused),
        "fusion_reasons": fusion_reasons,
        "timestamp": now.isoformat()
    }


# Scenario State
_scenario_start = 0
_last_phase = None

def generate_synthetic_heartbeat(db: Session) -> Dict[str, Any]:
    """
    Scenario Director: Forces escalation sequence (0-60s)
    QUIET -> LOCAL -> MULTI -> FUSION
    """
    global _scenario_start, _last_phase
    
    now_ts = datetime.utcnow().timestamp()
    
    # Initialize or Reset Scenario Loop (60s cycle)
    if _scenario_start == 0 or (now_ts - _scenario_start) > 60:
        _scenario_start = now_ts
        _last_phase = None
    
    elapsed = now_ts - _scenario_start
    phase = "QUIET"
    
    # Determine Phase
    if elapsed < 15:
        phase = "QUIET"
    elif elapsed < 30:
        phase = "LOCAL"
    elif elapsed < 45:
        phase = "MULTI"
    else:
        phase = "FUSION"
    
    # Execute Phase Logic only once per phase transition
    if phase == _last_phase:
        return {"generated": False, "phase": phase, "elapsed": elapsed}
        
    _last_phase = phase
    created_count = 0
    
    if phase == "QUIET":
        # Silence is golden
        pass
        
    elif phase == "LOCAL":
        # Single strong event
        e = Event(
            event_type="frb",
            source="synthetic_scenario",
            confidence=0.65,
            timestamp=datetime.utcnow(),
            ra=random.uniform(0, 360),
            dec=random.uniform(-90, 90),
            data={
                "source_name": "FRB-SCENARIO-1",
                "snr": 25.0,
                "dm": 350.0,
                "anomaly_triggers": ["Strong Burst Detected"]
            }
        )
        db.add(e)
        created_count = 1
        
    elif phase == "MULTI":
        # Uncorrelated chaos
        ts = datetime.utcnow()
        e1 = Event(
            event_type="frb",
            source="synthetic_scenario",
            confidence=0.7,
            timestamp=ts,
            ra=random.uniform(0, 180), # Region A
            dec=random.uniform(0, 45),
            data={"source_name": "FRB-SCENARIO-2", "snr": 35.0, "anomaly_triggers": ["Repeater Signal"]}
        )
        e2 = Event(
            event_type="spaceweather",
            source="synthetic_scenario",
            confidence=0.75,
            timestamp=ts,
            data={"solar_wind_speed": 650, "anomaly_triggers": ["Geomagnetic Storm G2"]}
        )
        db.add_all([e1, e2])
        created_count = 2
        
    elif phase == "FUSION":
        # 'The Big One' - Perfect Correlation
        ts = datetime.utcnow()
        # Choose a target location
        target_ra = random.uniform(100, 260)
        target_dec = random.uniform(-30, 60)
        
        e1 = Event(
            event_type="gw",
            source="synthetic_scenario",
            confidence=0.98,
            timestamp=ts,
            ra=target_ra,
            dec=target_dec,
            data={"subtype": "Neutron Star Merger", "snr": 24.5, "anomaly_triggers": ["Chirp Mass 1.4M☉"]}
        )
        e2 = Event(
            event_type="frb",
            source="synthetic_scenario",
            confidence=0.92,
            timestamp=ts,
            ra=target_ra + 0.5, # Within 1 degree
            dec=target_dec - 0.5,
            data={"source_name": "FRB-GW-ASSOC", "snr": 88.0, "anomaly_triggers": ["Gamma Counterpart Candidate"]}
        )
        e3 = Event(
            event_type="neutrino",
            source="synthetic_scenario",
            confidence=0.85,
            timestamp=ts,
            ra=target_ra - 0.2,
            dec=target_dec + 0.2,
            data={"energy_tev": 1200, "anomaly_triggers": ["PeV Cascade"]}
        )
        db.add_all([e1, e2, e3])
        created_count = 3

    if created_count > 0:
        db.commit()
    
    return {
        "generated": created_count > 0,
        "phase": phase,
        "count": created_count,
        "elapsed": elapsed
    }


def cleanup_expired_synthetic(db: Session) -> int:
    """Remove synthetic events older than 2 minutes"""
    cutoff = datetime.utcnow() - timedelta(minutes=2)
    deleted = db.query(Event).filter(
        Event.source == "synthetic",
        Event.timestamp < cutoff
    ).delete()
    db.commit()
    return deleted
