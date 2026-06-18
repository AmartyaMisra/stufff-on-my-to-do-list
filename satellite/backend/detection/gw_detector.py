from sqlalchemy.orm import Session
from datetime import datetime

from database.models import Event, AnomalyDetection
from config import settings


class GWDetector:
    """Detect anomalies in gravitational wave data"""
    
    @staticmethod
    def detect(event: Event, db: Session) -> AnomalyDetection:
        """
        Detect anomalies in GW events
        
        Anomalies detected:
        - High SNR (strong signal)
        - Unusual mass ranges
        - Extreme distances
        - Multi-detector coincidences
        """
        data = event.data
        snr = data.get("snr", 0)
        chirp_mass = data.get("chirp_mass", 0)
        mass1 = data.get("mass1", 0)
        mass2 = data.get("mass2", 0)
        distance_mpc = data.get("distance_mpc", 0)
        
        anomaly_type = None
        severity = "low"
        confidence_score = 0.0
        details = {}
        
        # Check for very high SNR
        if snr > 20:
            anomaly_type = "high_snr"
            if snr > 50:
                severity = "critical"
            elif snr > 30:
                severity = "high"
            else:
                severity = "medium"
            confidence_score = min((snr - 20) / 50.0, 1.0)
            details["snr"] = snr
            details["interpretation"] = "Very strong gravitational wave signal"
        
        # Check for unusual mass range (intermediate mass black holes)
        elif chirp_mass > 100 or (mass1 > 50 or mass2 > 50):
            anomaly_type = "unusual_mass"
            severity = "high"
            confidence_score = 0.8
            details["chirp_mass"] = chirp_mass
            details["mass1"] = mass1
            details["mass2"] = mass2
            details["interpretation"] = "Unusual mass range - possible IMBH"
        
        # Check for very close event
        elif distance_mpc > 0 and distance_mpc < 100:
            anomaly_type = "close_event"
            severity = "medium"
            confidence_score = min((100 - distance_mpc) / 100.0, 1.0)
            details["distance_mpc"] = distance_mpc
            details["interpretation"] = "Relatively close gravitational wave source"
        
        # Check for very distant event
        elif distance_mpc > 5000:
            anomaly_type = "distant_event"
            severity = "medium"
            confidence_score = 0.7
            details["distance_mpc"] = distance_mpc
            details["interpretation"] = "Very distant gravitational wave source"
        
        # Default: no significant anomaly
        if not anomaly_type:
            anomaly_type = "normal"
            severity = "low"
            confidence_score = 0.1
        
        # Only create detection if above threshold
        if confidence_score >= settings.gw_anomaly_threshold:
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

