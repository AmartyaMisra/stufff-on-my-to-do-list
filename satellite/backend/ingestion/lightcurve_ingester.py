from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any, List
import json
import numpy as np

from database.models import Event


class LightcurveIngester:
    """Ingest light curve (stellar variability) data"""
    
    @staticmethod
    def ingest(data: Dict[str, Any], db: Session) -> Event:
        """
        Ingest light curve event data
        
        Expected data format:
        {
            "ra": float,
            "dec": float,
            "magnitude": List[float],
            "time": List[float],  # Julian days or timestamps
            "filter": str,  # Photometric filter
            "source_id": str,
            "variability_index": float
        }
        """
        timestamp = datetime.fromisoformat(data.get("timestamp", datetime.utcnow().isoformat()))
        
        # Calculate statistics from light curve
        magnitudes = data.get("magnitude", [])
        if magnitudes:
            mean_mag = np.mean(magnitudes)
            std_mag = np.std(magnitudes)
            variability = std_mag / mean_mag if mean_mag > 0 else 0
        else:
            mean_mag = std_mag = variability = 0
        
        event = Event(
            event_type="lightcurve",
            timestamp=timestamp,
            ra=data.get("ra"),
            dec=data.get("dec"),
            data={
                "mean_magnitude": float(mean_mag),
                "std_magnitude": float(std_mag),
                "variability_index": data.get("variability_index", variability),
                "filter": data.get("filter"),
                "source_id": data.get("source_id"),
                "n_points": len(magnitudes)
            },
            confidence=data.get("variability_index", variability),
            source=data.get("source", "unknown")
        )
        
        db.add(event)
        db.commit()
        db.refresh(event)
        
        return event
    
    @staticmethod
    def ingest_from_file(file_path: str, db: Session) -> Event:
        """Ingest light curve data from a JSON file"""
        with open(file_path, 'r') as f:
            data = json.load(f)
        return LightcurveIngester.ingest(data, db)

