from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any
import json

from database.models import Event


class NeutrinoIngester:
    """Ingest neutrino detection event data"""
    
    @staticmethod
    def ingest(data: Dict[str, Any], db: Session) -> Event:
        """
        Ingest neutrino event data
        
        Expected data format:
        {
            "event_id": str,
            "ra": float,
            "dec": float,
            "energy_gev": float,  # Energy in GeV
            "detector": str,  # IceCube, ANTARES, etc.
            "event_type": str,  # track, cascade, etc.
            "angular_error": float,  # Angular uncertainty in degrees
            "signalness": float  # Signal probability (0-1)
        }
        """
        timestamp = datetime.fromisoformat(data.get("timestamp", datetime.utcnow().isoformat()))
        
        # Use signalness as confidence, or calculate from energy
        confidence = data.get("signalness", min(data.get("energy_gev", 0) / 1000.0, 1.0))
        
        event = Event(
            event_type="neutrino",
            timestamp=timestamp,
            ra=data.get("ra"),
            dec=data.get("dec"),
            data={
                "event_id": data.get("event_id"),
                "energy_gev": data.get("energy_gev"),
                "detector": data.get("detector"),
                "event_type": data.get("event_type"),
                "angular_error": data.get("angular_error"),
                "signalness": data.get("signalness")
            },
            confidence=confidence,
            source=data.get("source", "unknown")
        )
        
        db.add(event)
        db.commit()
        db.refresh(event)
        
        return event
    
    @staticmethod
    def ingest_from_file(file_path: str, db: Session) -> Event:
        """Ingest neutrino data from a JSON file"""
        with open(file_path, 'r') as f:
            data = json.load(f)
        return NeutrinoIngester.ingest(data, db)

