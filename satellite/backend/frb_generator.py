"""
FRB (Fast Radio Burst) Ingester
Generates synthetic FRB events with realistic properties.
In production, this would connect to CHIME/FRB VOEvent feed.

FRB Detection Criteria:
- SNR (Signal-to-Noise Ratio) > threshold
- DM (Dispersion Measure) indicates extragalactic origin
- Width < 10ms (millisecond duration)
"""
import random
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
import math

from database.models import Event


class FRBGenerator:
    """
    Generates realistic synthetic FRB events.
    Mimics CHIME/FRB detection characteristics.
    """
    
    # Known FRB repeaters (simplified catalog)
    KNOWN_SOURCES = [
        {"name": "FRB 20121102A", "ra": 82.99, "dec": 33.15, "dm": 557, "repeater": True},
        {"name": "FRB 20180916B", "ra": 29.50, "dec": 65.72, "dm": 349, "repeater": True},
        {"name": "FRB 20190520B", "ra": 241.1, "dec": 13.0, "dm": 1205, "repeater": True},
        {"name": "FRB 20200120E", "ra": 149.5, "dec": 68.5, "dm": 87, "repeater": True},
    ]
    
    # Detection thresholds
    SNR_THRESHOLD = 10  # Minimum SNR for detection
    MIN_DM = 100  # Minimum DM for extragalactic (pc/cm³)
    
    def __init__(self):
        self.event_counter = 0
        self.last_burst_time = datetime.utcnow() - timedelta(hours=1)
        
    def generate_random_frb(self) -> Dict[str, Any]:
        """Generate a random FRB event with realistic properties"""
        self.event_counter += 1
        
        # Decide if from known source or new detection
        is_known = random.random() < 0.3
        
        if is_known and self.KNOWN_SOURCES:
            source = random.choice(self.KNOWN_SOURCES)
            ra = source["ra"] + random.gauss(0, 0.01)  # Small position uncertainty
            dec = source["dec"] + random.gauss(0, 0.01)
            dm = source["dm"] + random.gauss(0, 5)
            source_name = source["name"]
            is_repeater = source["repeater"]
        else:
            # New random FRB
            ra = random.uniform(0, 360)
            dec = random.uniform(-90, 90)
            # DM correlates roughly with distance (higher = further)
            dm = random.uniform(200, 2000)
            source_name = f"FRB {datetime.utcnow().strftime('%Y%m%d')}A{self.event_counter:02d}"
            is_repeater = False
        
        # Generate burst properties
        snr = random.uniform(8, 150)  # Signal-to-noise ratio
        width_ms = random.uniform(0.1, 10)  # Burst width in milliseconds
        frequency_mhz = random.uniform(400, 800)  # CHIME frequency range
        fluence = random.uniform(0.1, 50)  # Jy·ms
        
        # Spectral properties
        bandwidth_mhz = random.uniform(100, 400)
        scattering_ms = self._compute_scattering(dm)
        
        return {
            "source_name": source_name,
            "ra": round(ra, 4),
            "dec": round(dec, 4),
            "dm": round(dm, 2),
            "snr": round(snr, 2),
            "width_ms": round(width_ms, 3),
            "frequency_mhz": round(frequency_mhz, 1),
            "bandwidth_mhz": round(bandwidth_mhz, 1),
            "fluence_jy_ms": round(fluence, 2),
            "scattering_ms": round(scattering_ms, 3),
            "is_repeater": is_repeater,
            "telescope": "CHIME",
            "detection_pipeline": "L1",
        }
    
    def _compute_scattering(self, dm: float) -> float:
        """Compute scattering time based on DM (empirical relation)"""
        # Scattering ~ DM^2 / frequency^4 (simplified)
        return 0.001 * (dm / 100) ** 1.5
    
    def compute_anomaly_score(self, frb_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compute anomaly score for FRB detection.
        High SNR + high DM + narrow width = high confidence.
        """
        score = 0.0
        triggers = []
        severity = "low"
        
        snr = frb_data.get("snr", 0)
        dm = frb_data.get("dm", 0)
        width = frb_data.get("width_ms", 10)
        is_repeater = frb_data.get("is_repeater", False)
        
        # SNR scoring
        if snr > 50:
            score += 0.3
            triggers.append(f"Very high SNR: {snr:.1f}")
            severity = "high"
        elif snr > 20:
            score += 0.2
            triggers.append(f"Strong detection: SNR {snr:.1f}")
            severity = "medium"
        elif snr > self.SNR_THRESHOLD:
            score += 0.1
        
        # DM scoring (higher = more distant = more interesting)
        if dm > 1000:
            score += 0.25
            triggers.append(f"High DM ({dm:.0f} pc/cm³) - distant source")
            severity = "high"
        elif dm > 500:
            score += 0.15
            triggers.append(f"Elevated DM: {dm:.0f} pc/cm³")
        elif dm > self.MIN_DM:
            score += 0.1
        
        # Width scoring (narrower = more coherent = more interesting)
        if width < 1:
            score += 0.15
            triggers.append(f"Very narrow burst: {width:.2f} ms")
        elif width < 5:
            score += 0.1
        
        # Repeater bonus
        if is_repeater:
            score += 0.1
            triggers.append("Known repeater source")
        
        # Cap score
        score = min(1.0, score)
        
        return {
            "score": round(score, 2),
            "triggers": triggers,
            "severity": severity,
            "detected": snr > self.SNR_THRESHOLD and dm > self.MIN_DM
        }
    
    def should_generate_burst(self) -> bool:
        """
        Probabilistic burst generation.
        Real FRBs are rare but we generate more frequently for demo.
        """
        elapsed = (datetime.utcnow() - self.last_burst_time).total_seconds()
        
        # Base probability increases with time since last burst
        # Average: one burst every 2-5 minutes in demo mode
        probability = min(0.8, elapsed / 180)  # Max 80% chance after 3 min
        
        return random.random() < probability


# Singleton instance
frb_generator = FRBGenerator()


def generate_frb_event(db: Session, force: bool = False) -> Optional[Event]:
    """
    Generate an FRB event if conditions are met.
    
    Args:
        db: Database session
        force: Force generation regardless of probability
    
    Returns:
        Event if generated, None otherwise
    """
    if not force and not frb_generator.should_generate_burst():
        return None
    
    # Generate FRB data
    frb_data = frb_generator.generate_random_frb()
    anomaly = frb_generator.compute_anomaly_score(frb_data)
    
    if not anomaly["detected"]:
        return None
    
    # Create event
    event = Event(
        event_type="frb",
        timestamp=datetime.utcnow(),
        ra=frb_data["ra"],
        dec=frb_data["dec"],
        data={
            **frb_data,
            "anomaly_triggers": anomaly["triggers"],
            "severity": anomaly["severity"],
        },
        confidence=anomaly["score"],
        source="CHIME_FRB_SYNTHETIC"
    )
    
    db.add(event)
    db.commit()
    db.refresh(event)
    
    # Update last burst time
    frb_generator.last_burst_time = datetime.utcnow()
    
    return event


def get_frb_statistics(db: Session) -> Dict[str, Any]:
    """Get FRB detection statistics"""
    cutoff_24h = datetime.utcnow() - timedelta(hours=24)
    cutoff_1h = datetime.utcnow() - timedelta(hours=1)
    
    total_24h = db.query(Event).filter(
        Event.event_type == "frb",
        Event.timestamp >= cutoff_24h
    ).count()
    
    total_1h = db.query(Event).filter(
        Event.event_type == "frb",
        Event.timestamp >= cutoff_1h
    ).count()
    
    # Get high confidence detections
    high_confidence = db.query(Event).filter(
        Event.event_type == "frb",
        Event.timestamp >= cutoff_24h,
        Event.confidence >= 0.5
    ).count()
    
    return {
        "total_24h": total_24h,
        "total_1h": total_1h,
        "high_confidence_24h": high_confidence,
        "average_rate_per_hour": round(total_24h / 24, 2) if total_24h > 0 else 0
    }


# ============ ADVANCED FRB PROFILING ============

def classify_frb_type(db: Session, event_id: int) -> Dict[str, Any]:
    """
    Classify FRB as one-off, repeating, or periodic.
    
    Args:
        db: Database session
        event_id: FRB event to classify
        
    Returns:
        Classification dict with type, repeat_count, period_days, etc.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event or event.event_type != "frb":
        return {"error": "Event not found or not FRB"}
    
    ra = event.ra
    dec = event.dec
    
    # Find all FRBs from same sky position (±1° cone)
    position_tolerance = 1.0  # degrees
    
    related_frbs = db.query(Event).filter(
        Event.event_type == "frb",
        Event.ra.between(ra - position_tolerance, ra + position_tolerance),
        Event.dec.between(dec - position_tolerance, dec + position_tolerance)
    ).order_by(Event.timestamp.asc()).all()
    
    if len(related_frbs) == 1:
        # One-off FRB
        return {
            "frb_type": "one_off",
            "repeat_count": 1,
            "source_name": event.data.get("source_name"),
            "explanation": "Single detection — no repetition observed"
        }
    
    # Repeating FRB - check for periodicity
    timestamps = [frb.timestamp for frb in related_frbs]
    time_diffs = [(timestamps[i+1] - timestamps[i]).total_seconds() for i in range(len(timestamps)-1)]
    
    if len(time_diffs) < 3:
        # Not enough data for period analysis
        return {
            "frb_type": "repeating",
            "repeat_count": len(related_frbs),
            "source_name": event.data.get("source_name"),
            "explanation": f"Repeater with {len(related_frbs)} bursts — insufficient data for periodicity"
        }
    
    # Check for periodicity (simple variance test)
    mean_interval = sum(time_diffs) / len(time_diffs)
    variance = sum((dt - mean_interval) ** 2 for dt in time_diffs) / len(time_diffs)
    std_dev = variance ** 0.5
    
    # If std_dev < 20% of mean, likely periodic
    if std_dev / mean_interval < 0.2:
        period_days = mean_interval / 86400  # Convert to days
        
        # Predict next burst
        last_timestamp = timestamps[-1]
        next_burst_prediction = last_timestamp + timedelta(seconds=mean_interval)
        
        return {
            "frb_type": "periodic",
            "repeat_count": len(related_frbs),
            "period_days": round(period_days, 3),
            "period_seconds": round(mean_interval, 1),
            "period_uncertainty_days": round((std_dev / 86400), 3),
            "next_burst_prediction": next_burst_prediction.isoformat(),
            "source_name": event.data.get("source_name"),
            "explanation": f"Periodic repeater with ~{period_days:.2f} day cycle"
        }
    else:
        return {
            "frb_type": "repeating",
            "repeat_count": len(related_frbs),
            "source_name": event.data.get("source_name"),
            "explanation": f"Aperiodic repeater with {len(related_frbs)} bursts — irregular intervals"
        }

