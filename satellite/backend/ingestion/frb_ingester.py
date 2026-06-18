from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any
import json

from database.models import Event


class FRBIngester:
    """Ingest Fast Radio Burst (FRB) data"""
    
    @staticmethod
    def ingest(data: Dict[str, Any], db: Session) -> Event:
        """
        Ingest FRB event data
        
        Expected data format:
        {
            "dm": float,  # Dispersion measure
            "snr": float,  # Signal-to-noise ratio
            "width_ms": float,  # Pulse width in milliseconds
            "frequency_mhz": float,  # Center frequency
            "ra": float,  # Right ascension in degrees
            "dec": float,  # Declination in degrees
            "telescope": str,
            "source": str
        }
        """
        timestamp = datetime.fromisoformat(data.get("timestamp", datetime.utcnow().isoformat()))
        
        event = Event(
            event_type="frb",
            timestamp=timestamp,
            ra=data.get("ra"),
            dec=data.get("dec"),
            data={
                "dm": data.get("dm"),
                "snr": data.get("snr"),
                "width_ms": data.get("width_ms"),
                "frequency_mhz": data.get("frequency_mhz"),
                "telescope": data.get("telescope"),
            },
            confidence=min(data.get("snr", 0) / 100.0, 1.0),  # Normalize SNR to confidence
            source=data.get("source", "unknown")
        )
        
        db.add(event)
        db.commit()
        db.refresh(event)
        
        return event
    
    @staticmethod
    def ingest_from_file(file_path: str, db: Session) -> Event:
        """Ingest FRB data from a JSON file"""
        with open(file_path, 'r') as f:
            data = json.load(f)
        return FRBIngester.ingest(data, db)

