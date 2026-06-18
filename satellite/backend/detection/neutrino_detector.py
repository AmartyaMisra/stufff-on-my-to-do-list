from sqlalchemy.orm import Session
from datetime import datetime

from database.models import Event, AnomalyDetection
from config import settings


class NeutrinoDetector:
    """Detect anomalies in neutrino detection data"""
    
    @staticmethod
    def detect(event: Event, db: Session) -> AnomalyDetection:
        """
        Detect anomalies in neutrino events
        
        Anomalies detected:
        - High energy neutrinos
        - High signalness
        - Unusual angular error
        - Track vs cascade anomalies
        """
        data = event.data
        energy_gev = data.get("energy_gev", 0)
        signalness = data.get("signalness", 0)
        angular_error = data.get("angular_error", 0)
        event_type = data.get("event_type", "")
        
        anomaly_type = None
        severity = "low"
        confidence_score = 0.0
        details = {}
        
        # Check for high energy neutrino (PeV scale)
        if energy_gev > 1000000:  # > 1 PeV
            anomaly_type = "high_energy"
            severity = "critical"
            confidence_score = min(energy_gev / 10000000.0, 1.0)
            details["energy_gev"] = energy_gev
            details["interpretation"] = "Ultra-high energy neutrino detected"
        
        # Check for high signalness
        elif signalness > 0.8:
            anomaly_type = "high_signalness"
            severity = "high"
            confidence_score = signalness
            details["signalness"] = signalness
            details["energy_gev"] = energy_gev
            details["interpretation"] = "High-confidence neutrino signal"
        
        # Check for very low angular error (good pointing)
        elif angular_error < 0.1 and energy_gev > 10000:
            anomaly_type = "well_localized_high_energy"
            severity = "high"
            confidence_score = 0.85
            details["angular_error"] = angular_error
            details["energy_gev"] = energy_gev
            details["interpretation"] = "Well-localized high-energy neutrino"
        
        # Check for unusual event type
        elif event_type not in ["track", "cascade"]:
            anomaly_type = "unusual_type"
            severity = "medium"
            confidence_score = 0.6
            details["event_type"] = event_type
            details["interpretation"] = "Unusual neutrino event type"
        
        # Default: no significant anomaly
        if not anomaly_type:
            anomaly_type = "normal"
            severity = "low"
            confidence_score = 0.1
        
        # Only create detection if above threshold
        if confidence_score >= settings.neutrino_anomaly_threshold:
            anomaly = AnomalyDetection(
                event_id=event.id,
                anomaly_type=anomaly_type,
                severity=severity,
                detected_at=datetime.utcnow(),
                details=details,
                confidence_score=confidence_score
            )
            db.add(anomaly)
            db.commit()
            db.refresh(anomaly)
            return anomaly
        
        anomaly = AnomalyDetection(
            event_id=event.id,
            anomaly_type=anomaly_type,
            severity="low",
            detected_at=datetime.utcnow(),
            details=details,
            confidence_score=confidence_score
        )
        db.add(anomaly)
        db.commit()
        db.refresh(anomaly)
        return anomaly

