from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any, List
import json

from database.models import Event


class TLEIngester:
    """Ingest Two-Line Element (TLE) satellite orbital data"""
    
    @staticmethod
    def parse_tle(tle_lines: List[str]) -> Dict[str, Any]:
        """
        Parse TLE format data
        
        TLE format:
        Line 1: Satellite name
        Line 2: NORAD catalog number, classification, launch year, etc.
        Line 3: Orbital elements
        """
        if len(tle_lines) < 2:
            raise ValueError("TLE must have at least 2 lines")
        
        line1 = tle_lines[0].strip()
        line2 = tle_lines[1].strip()
        
        # Parse line 2 (first data line)
        norad_id = line2[2:7].strip()
        classification = line2[7]
        epoch_year = int(line2[18:20])
        epoch_day = float(line2[20:32])
        try:
            mean_motion_derivative = float(line2[33:43].replace('+', 'e+').replace('-', 'e-'))
        except ValueError:
            mean_motion_derivative = 0.0
        try:
            mean_motion_2nd_derivative = float(line2[44:52].replace('+', 'e+').replace('-', 'e-')) if len(line2) > 52 else 0
        except ValueError:
            mean_motion_2nd_derivative = 0.0
        try:
            bstar = float(line2[53:61].replace('+', 'e+').replace('-', 'e-')) if len(line2) > 61 else 0
        except ValueError:
            bstar = 0.0
        element_number = int(line2[64:68]) if len(line2) > 68 else 0
        
        # Parse line 3 (second data line) if available
        if len(tle_lines) >= 3:
            line3 = tle_lines[2].strip()
            inclination = float(line3[8:16])
            raan = float(line3[17:25])  # Right ascension of ascending node
            eccentricity = float("0." + line3[26:33])
            argument_of_perigee = float(line3[34:42])
            mean_anomaly = float(line3[43:51])
            mean_motion = float(line3[52:63])
            revolution_number = int(line3[63:68]) if len(line3) > 68 else 0
        else:
            inclination = raan = eccentricity = argument_of_perigee = mean_anomaly = mean_motion = revolution_number = 0
        
        return {
            "satellite_name": line1,
            "norad_id": norad_id,
            "classification": classification,
            "epoch_year": epoch_year,
            "epoch_day": epoch_day,
            "inclination": inclination,
            "raan": raan,
            "eccentricity": eccentricity,
            "argument_of_perigee": argument_of_perigee,
            "mean_anomaly": mean_anomaly,
            "mean_motion": mean_motion,
            "mean_motion_derivative": mean_motion_derivative,
            "bstar": bstar,
            "revolution_number": revolution_number
        }
    
    @staticmethod
    def ingest(data: Dict[str, Any], db: Session) -> Event:
        """
        Ingest TLE event data
        
        Expected data format:
        {
            "tle_lines": List[str],  # Raw TLE lines
            "norad_id": str,  # Optional, will be parsed if not provided
            "timestamp": str  # ISO format
        }
        """
        timestamp = datetime.fromisoformat(data.get("timestamp", datetime.utcnow().isoformat()))
        
        # Parse TLE if raw lines provided
        if "tle_lines" in data:
            parsed = TLEIngester.parse_tle(data["tle_lines"])
            data.update(parsed)
        
        # Calculate approximate RA/Dec from orbital elements (simplified)
        # In practice, this would use proper orbital mechanics calculations
        ra = data.get("raan", None)
        dec = data.get("inclination", None)
        
        event = Event(
            event_type="tle",
            timestamp=timestamp,
            ra=ra,
            dec=dec,
            data={
                "satellite_name": data.get("satellite_name"),
                "norad_id": data.get("norad_id"),
                "inclination": data.get("inclination"),
                "eccentricity": data.get("eccentricity"),
                "mean_motion": data.get("mean_motion"),
                "epoch_year": data.get("epoch_year"),
                "epoch_day": data.get("epoch_day")
            },
            confidence=0.8,  # TLE data is generally reliable
            source=data.get("source", "unknown")
        )
        
        db.add(event)
        db.commit()
        db.refresh(event)
        
        return event
    
    @staticmethod
    def ingest_from_file(file_path: str, db: Session) -> Event:
        """Ingest TLE data from a text file"""
        with open(file_path, 'r') as f:
            lines = f.readlines()
        
        data = {"tle_lines": lines}
        return TLEIngester.ingest(data, db)

