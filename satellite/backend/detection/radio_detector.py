from sqlalchemy.orm import Session
from datetime import datetime
import numpy as np

from database.models import Event, AnomalyDetection
from config import settings


class RadioDetector:
    """Detect anomalies in Fast Radio Burst data"""
    
    @staticmethod
    def detect(event: Event, db: Session) -> AnomalyDetection:
        """
        Detect anomalies in FRB events
        
        Anomalies detected:
        - Extremely high DM (possible extragalactic origin)
        - Very high SNR (unusually bright)
        - Unusual pulse width
        - Frequency-dependent anomalies
        """
        data = event.data
        dm = data.get("dm", 0)
        snr = data.get("snr", 0)
        width_ms = data.get("width_ms", 0)
        
        anomaly_type = None
        severity = "low"
        confidence_score = 0.0
        details = {}
        
        # Check for high DM (extragalactic)
        if dm > 1000:
            anomaly_type = "high_dm"
            severity = "high"
            confidence_score = min(dm / 2000.0, 1.0)
            details["dm"] = dm
            details["interpretation"] = "Possible extragalactic origin"
        
        # Check for extremely high SNR
        elif snr > 50:
            anomaly_type = "high_snr"
            severity = "medium"
            confidence_score = min((snr - 50) / 100.0, 1.0)
            details["snr"] = snr
            details["interpretation"] = "Unusually bright FRB"
        
        # Check for unusual pulse width
        elif width_ms > 100 or width_ms < 0.1:
            anomaly_type = "unusual_width"
            severity = "medium"
            confidence_score = 0.7
            details["width_ms"] = width_ms
            details["interpretation"] = "Unusual pulse duration"
        
        # Check for frequency anomalies
        elif data.get("frequency_mhz", 0) < 100 or data.get("frequency_mhz", 0) > 10000:
            anomaly_type = "frequency_anomaly"
            severity = "low"
            confidence_score = 0.6
            details["frequency_mhz"] = data.get("frequency_mhz")
            details["interpretation"] = "Unusual frequency range"
        
        # Default: no significant anomaly
        if not anomaly_type:
            anomaly_type = "normal"
            severity = "low"
            confidence_score = 0.1
        
        # Only create detection if above threshold
        if confidence_score >= settings.frb_anomaly_threshold:
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
        
        # Return a low-confidence detection even if below threshold
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

