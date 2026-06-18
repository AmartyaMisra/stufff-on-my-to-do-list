from sqlalchemy.orm import Session
from datetime import datetime

from database.models import Event, AnomalyDetection
from config import settings


class SpaceWeatherDetector:
    """Detect anomalies in space weather data"""
    
    @staticmethod
    def detect(event: Event, db: Session) -> AnomalyDetection:
        """
        Detect anomalies in space weather events
        
        Anomalies detected:
        - Geomagnetic storms (high Kp/Ap)
        - Solar flares (high X-ray flux)
        - High particle flux
        - Solar activity spikes
        """
        data = event.data
        kp_index = data.get("kp_index", 0)
        ap_index = data.get("ap_index", 0)
        xray_flux = data.get("xray_flux", 0)
        proton_flux = data.get("proton_flux", 0)
        electron_flux = data.get("electron_flux", 0)
        solar_flux = data.get("solar_flux", 0)
        
        anomaly_type = None
        severity = "low"
        confidence_score = 0.0
        details = {}
        
        # Check for geomagnetic storm (Kp >= 5)
        if kp_index >= 5:
            anomaly_type = "geomagnetic_storm"
            if kp_index >= 8:
                severity = "critical"
            elif kp_index >= 7:
                severity = "high"
            else:
                severity = "medium"
            confidence_score = min(kp_index / 9.0, 1.0)
            details["kp_index"] = kp_index
            details["ap_index"] = ap_index
            details["interpretation"] = f"Geomagnetic storm (Kp={kp_index})"
        
        # Check for solar flare (high X-ray flux)
        elif xray_flux > 1e-4:  # M-class or higher
            anomaly_type = "solar_flare"
            if xray_flux > 1e-3:
                severity = "critical"
            elif xray_flux > 1e-4:
                severity = "high"
            else:
                severity = "medium"
            confidence_score = min(xray_flux * 1000, 1.0)
            details["xray_flux"] = xray_flux
            details["interpretation"] = "Solar flare detected"
        
        # Check for high particle flux
        elif proton_flux > 10 or electron_flux > 1000:
            anomaly_type = "high_particle_flux"
            severity = "medium"
            confidence_score = min((proton_flux / 100.0 + electron_flux / 10000.0) / 2.0, 1.0)
            details["proton_flux"] = proton_flux
            details["electron_flux"] = electron_flux
            details["interpretation"] = "Elevated particle flux"
        
        # Check for high solar activity
        elif solar_flux > 200:
            anomaly_type = "high_solar_activity"
            severity = "medium"
            confidence_score = min((solar_flux - 200) / 100.0, 1.0)
            details["solar_flux"] = solar_flux
            details["interpretation"] = "Elevated solar activity"
        
        # Default: no significant anomaly
        if not anomaly_type:
            anomaly_type = "normal"
            severity = "low"
            confidence_score = 0.1
        
        # Only create detection if above threshold
        if confidence_score >= settings.spaceweather_anomaly_threshold:
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

