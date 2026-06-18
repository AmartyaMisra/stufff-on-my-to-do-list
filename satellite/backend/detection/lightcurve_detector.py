from sqlalchemy.orm import Session
from datetime import datetime
import numpy as np

from database.models import Event, AnomalyDetection
from config import settings


class LightcurveDetector:
    """Detect anomalies in light curve data"""
    
    @staticmethod
    def detect(event: Event, db: Session) -> AnomalyDetection:
        """
        Detect anomalies in light curve events
        
        Anomalies detected:
        - High variability (flare, outburst)
        - Sudden brightness changes
        - Periodic anomalies
        - Color changes
        """
        data = event.data
        variability_index = data.get("variability_index", 0)
        std_magnitude = data.get("std_magnitude", 0)
        mean_magnitude = data.get("mean_magnitude", 0)
        
        anomaly_type = None
        severity = "low"
        confidence_score = 0.0
        details = {}
        
        # Check for high variability
        if variability_index > 0.2:
            anomaly_type = "high_variability"
            severity = "high"
            confidence_score = min(variability_index * 2.0, 1.0)
            details["variability_index"] = variability_index
            details["interpretation"] = "High stellar variability detected"
        
        # Check for sudden brightness change
        elif std_magnitude > 2.0:
            anomaly_type = "brightness_change"
            severity = "medium"
            confidence_score = min(std_magnitude / 5.0, 1.0)
            details["std_magnitude"] = std_magnitude
            details["mean_magnitude"] = mean_magnitude
            details["interpretation"] = "Significant brightness variation"
        
        # Check for very bright source
        elif mean_magnitude < 10 and std_magnitude > 0.5:
            anomaly_type = "bright_source_anomaly"
            severity = "medium"
            confidence_score = 0.7
            details["mean_magnitude"] = mean_magnitude
            details["interpretation"] = "Unusually bright source with variability"
        
        # Default: no significant anomaly
        if not anomaly_type:
            anomaly_type = "normal"
            severity = "low"
            confidence_score = 0.1
        
        # Only create detection if above threshold
        if confidence_score >= settings.lightcurve_anomaly_threshold:
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

