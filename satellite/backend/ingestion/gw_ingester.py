from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any
import json
import xml.etree.ElementTree as ET

from database.models import Event


class GWIngester:
    """Ingest gravitational wave event data"""
    
    @staticmethod
    def ingest(data: Dict[str, Any], db: Session) -> Event:
        """
        Ingest gravitational wave event data
        
        Expected data format:
        {
            "event_id": str,
            "ra": float,
            "dec": float,
            "distance_mpc": float,  # Distance in megaparsecs
            "chirp_mass": float,  # Chirp mass in solar masses
            "snr": float,  # Signal-to-noise ratio
            "detector": str,  # LIGO, Virgo, KAGRA
            "mass1": float,  # Primary mass
            "mass2": float,  # Secondary mass
            "merger_time": str  # ISO format timestamp
        }
        """
        timestamp = datetime.fromisoformat(data.get("timestamp", data.get("merger_time", datetime.utcnow().isoformat())))
        
        # Calculate confidence based on SNR
        snr = data.get("snr", 0)
        confidence = min(snr / 50.0, 1.0)  # Normalize SNR to confidence
        
        event = Event(
            event_type="gw",
            timestamp=timestamp,
            ra=data.get("ra"),
            dec=data.get("dec"),
            data={
                "event_id": data.get("event_id"),
                "distance_mpc": data.get("distance_mpc"),
                "chirp_mass": data.get("chirp_mass"),
                "snr": snr,
                "detector": data.get("detector"),
                "mass1": data.get("mass1"),
                "mass2": data.get("mass2")
            },
            confidence=confidence,
            source=data.get("source", "unknown")
        )
        
        db.add(event)
        db.commit()
        db.refresh(event)
        
        return event
    
    @staticmethod
    def ingest_from_xml(file_path: str, db: Session) -> Event:
        """Ingest GW data from an XML file (LIGO/Virgo format)"""
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        data = {}
        for elem in root.iter():
            if elem.text and elem.tag:
                tag = elem.tag.lower().replace('-', '_')
                try:
                    # Try to convert to float/int
                    if '.' in elem.text:
                        data[tag] = float(elem.text)
                    else:
                        data[tag] = int(elem.text)
                except ValueError:
                    data[tag] = elem.text
        
        return GWIngester.ingest(data, db)
    
    @staticmethod
    def ingest_from_file(file_path: str, db: Session) -> Event:
        """Ingest GW data from a JSON file"""
        if file_path.endswith('.xml'):
            return GWIngester.ingest_from_xml(file_path, db)
        else:
            with open(file_path, 'r') as f:
                data = json.load(f)
            return GWIngester.ingest(data, db)

