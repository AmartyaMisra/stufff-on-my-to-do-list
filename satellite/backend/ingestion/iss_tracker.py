"""
ISS Live Tracker
Tracks real-time ISS position as a known transmitter baseline.

Data Source: http://api.open-notify.org/iss-now.json
Updates every 5 seconds.
"""
import requests
from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
import logging
import math

from database.models import Event

logger = logging.getLogger(__name__)


class ISSTracker:
    """
    Real-time ISS position tracker.
    Provides a moving baseline for "known transmitter" correlation.
    """
    
    ENDPOINT = "http://api.open-notify.org/iss-now.json"
    
    def __init__(self):
        self.last_position = None
        self.last_update = None
    
    def get_current_position(self) -> Optional[Dict[str, float]]:
        """
        Fetch current ISS latitude/longitude.
        
        Returns:
            Dict with 'latitude', 'longitude', or None if fetch fails
        """
        try:
            response = requests.get(self.ENDPOINT, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            if data.get('message') != 'success':
                logger.error(f"ISS API error: {data}")
                return None
            
            position = data.get('iss_position', {})
            lat = float(position.get('latitude', 0))
            lon = float(position.get('longitude', 0))
            
            self.last_position = {'latitude': lat, 'longitude': lon}
            self.last_update = datetime.utcnow()
            
            return self.last_position
            
        except Exception as e:
            logger.error(f"Failed to fetch ISS position: {e}")
            return None
    
    def lat_lon_to_ra_dec(self, lat: float, lon: float) -> tuple:
        """
        Convert Earth lat/lon to approximate RA/Dec for radar display.
        
        This is a SIMPLIFIED conversion for visualization.
        Proper conversion requires observer location and time (LST).
        
        For radar purposes:
        - RA ≈ longitude mapped to 0-360°
        - Dec ≈ latitude (-90 to +90°)
        
        Returns:
            (ra, dec) tuple
        """
        # Simple mapping for radar visualization
        ra = (lon + 180) % 360  # Shift longitude to 0-360
        dec = lat  # Latitude is already -90 to +90
        
        return ra, dec
    
    def create_iss_event(self, db: Session) -> Optional[Event]:
        """
        Create an event for ISS current position.
        Marked as "known_transmitter" for baseline correlation.
        
        Returns:
            Event object or None
        """
        position = self.get_current_position()
        if not position:
            return None
        
        lat = position['latitude']
        lon = position['longitude']
        ra, dec = self.lat_lon_to_ra_dec(lat, lon)
        
        # Calculate velocity (if we have previous position)
        velocity_kmh = None
        if self.last_position and self.last_update:
            time_delta = (datetime.utcnow() - self.last_update).total_seconds()
            if time_delta > 0:
                # Haversine distance (simplified)
                dlat = math.radians(lat - self.last_position['latitude'])
                dlon = math.radians(lon - self.last_position['longitude'])
                a = math.sin(dlat/2)**2 + math.cos(math.radians(lat)) * math.cos(math.radians(self.last_position['latitude'])) * math.sin(dlon/2)**2
                c = 2 * math.asin(math.sqrt(a))
                distance_km = 6371 * c
                velocity_kmh = (distance_km / time_delta) * 3600
        
        event = Event(
            event_type="tle",  # Using TLE type for orbital objects
            timestamp=datetime.utcnow(),
            ra=ra,
            dec=dec,
            data={
                "source": "ISS_LIVE_TRACKER",
                "object_name": "ISS (ZARYA)",
                "norad_id": "25544",
                "latitude": lat,
                "longitude": lon,
                "velocity_kmh": velocity_kmh,
                "altitude_km": 408,  # Approximate ISS altitude
                "is_known_transmitter": True,
                "frequencies_mhz": [145.8, 437.8, 2441.0],  # ISS amateur/downlink frequencies
                "classification": "known_transmitter",
                "description": "International Space Station - Known human spacecraft"
            },
            confidence=1.0,  # 100% - we know this is ISS
            source="ISS_REALTIME_API"
        )
        
        db.add(event)
        db.commit()
        db.refresh(event)
        
        logger.info(f"ISS tracked: lat={lat:.2f}, lon={lon:.2f}, RA={ra:.1f}°, Dec={dec:.1f}°")
        
        return event


# Singleton
iss_tracker = ISSTracker()


def track_iss(db: Session) -> Optional[Event]:
    """
    Track ISS current position and create event.
    Call this every 5-10 seconds.
    
    Args:
        db: Database session
        
    Returns:
        Event with ISS position
    """
    return iss_tracker.create_iss_event(db)
