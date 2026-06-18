from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any
import json

from database.models import Event


class SpaceWeatherIngester:
    """Ingest space weather data (solar and geomagnetic)"""
    
    @staticmethod
    def ingest(data: Dict[str, Any], db: Session) -> Event:
        """
        Ingest space weather event data
        
        Expected data format:
        {
            "solar_flux": float,  # 10.7 cm solar flux
            "kp_index": float,  # Geomagnetic Kp index
            "ap_index": float,  # Geomagnetic Ap index
            "sunspot_number": int,
            "xray_flux": float,  # X-ray flux
            "proton_flux": float,  # Proton flux
            "electron_flux": float  # Electron flux
        }
        """
        timestamp = datetime.fromisoformat(data.get("timestamp", datetime.utcnow().isoformat()))
        
        # Calculate overall space weather activity level
        kp = data.get("kp_index", 0)
        ap = data.get("ap_index", 0)
        solar_flux = data.get("solar_flux", 0)
        
        # Normalize to confidence score (0-1)
        activity_score = min((kp / 9.0 + ap / 400.0 + solar_flux / 300.0) / 3.0, 1.0)
        
        event = Event(
            event_type="spaceweather",
            timestamp=timestamp,
            ra=None,  # Space weather is global, not localized
            dec=None,
            data={
                "solar_flux": data.get("solar_flux"),
                "kp_index": data.get("kp_index"),
                "ap_index": data.get("ap_index"),
                "sunspot_number": data.get("sunspot_number"),
                "xray_flux": data.get("xray_flux"),
                "proton_flux": data.get("proton_flux"),
                "electron_flux": data.get("electron_flux")
            },
            confidence=activity_score,
            source=data.get("source", "unknown")
        )
        
        db.add(event)
        db.commit()
        db.refresh(event)
        
        return event
    
    @staticmethod
    def ingest_from_file(file_path: str, db: Session) -> Event:
        """Ingest space weather data from a JSON file"""
        with open(file_path, 'r') as f:
            data = json.load(f)
        return SpaceWeatherIngester.ingest(data, db)

