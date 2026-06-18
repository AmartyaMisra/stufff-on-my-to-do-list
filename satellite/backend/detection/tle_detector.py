from sqlalchemy.orm import Session
from datetime import datetime

from database.models import Event, AnomalyDetection
from config import settings


class TLEDetector:
    """Detect anomalies in Two-Line Element satellite data"""
    
    @staticmethod
    def detect(event: Event, db: Session) -> AnomalyDetection:
        """
        Detect anomalies in TLE events
        
        Anomalies detected:
        - Orbital decay (high mean motion derivative)
        - Unusual orbital parameters
        - Eccentricity anomalies
        - Inclination changes
        """
        data = event.data
        mean_motion = data.get("mean_motion", 0)
        mean_motion_derivative = data.get("mean_motion_derivative", 0)
        eccentricity = data.get("eccentricity", 0)
        inclination = data.get("inclination", 0)
        
        anomaly_type = None
        severity = "low"
        confidence_score = 0.0
        details = {}
        
        # Check for orbital decay (negative mean motion derivative)
        if mean_motion_derivative < -1e-6:
            anomaly_type = "orbital_decay"
            severity = "medium"
            confidence_score = min(abs(mean_motion_derivative) * 1e6, 1.0)
            details["mean_motion_derivative"] = mean_motion_derivative
            details["interpretation"] = "Rapid orbital decay detected"
        
        # Check for high eccentricity
        elif eccentricity > 0.7:
            anomaly_type = "high_eccentricity"
            severity = "medium"
            confidence_score = min((eccentricity - 0.7) / 0.3, 1.0)
            details["eccentricity"] = eccentricity
            details["interpretation"] = "Highly eccentric orbit"
        
        # Check for unusual inclination
        elif inclination < 10 or inclination > 170:
            anomaly_type = "unusual_inclination"
            severity = "low"
            confidence_score = 0.6
            details["inclination"] = inclination
            details["interpretation"] = "Unusual orbital inclination"
        
        # Check for very low orbit (high mean motion)
        elif mean_motion > 16:  # Very low altitude
            anomaly_type = "low_orbit"
            severity = "medium"
            confidence_score = min((mean_motion - 16) / 2.0, 1.0)
            details["mean_motion"] = mean_motion
            details["interpretation"] = "Very low altitude orbit"
        
        # Default: no significant anomaly
        if not anomaly_type:
            anomaly_type = "normal"
            severity = "low"
            confidence_score = 0.1
        
        # Only create detection if above threshold
        if confidence_score >= settings.tle_anomaly_threshold:
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

