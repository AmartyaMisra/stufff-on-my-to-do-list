"""
NOAA Space Weather Live Data Ingester
Polls real solar wind data from NOAA SWPC every 60 seconds.

Data Source: https://services.swpc.noaa.gov/json/solar-wind.json
No API key required - public data.
"""
import requests
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import logging

from database.models import Event

logger = logging.getLogger(__name__)

class NOAALiveIngester:
    """
    Real-time NOAA Space Weather ingester.
    Replaces synthetic data with actual measurements.
    """
    
    ENDPOINT = "https://services.swpc.noaa.gov/json/solar-wind.json"
    
    # Detection thresholds (based on NOAA alerts)
    WIND_SPEED_SURGE_THRESHOLD = 150  # km/s jump
    BZ_THRESHOLD = -10  # nT (southward = geomagnetic storm risk)
    DENSITY_HIGH_THRESHOLD = 15  # protons/cm³
    
    def __init__(self):
        self.last_wind_speed = None
        self.last_poll_time = None
    
    def poll_live_data(self, db: Session) -> Optional[Event]:
        """
        Fetch latest solar wind data from NOAA.
        Generate event if anomaly detected.
        
        Returns:
            Event if anomaly detected, None otherwise
        """
        try:
            response = requests.get(self.ENDPOINT, timeout=10)
            response.raise_for_status()
            
            data_array = response.json()
            if not data_array:
                logger.warning("No data from NOAA endpoint")
                return None
            
            # Get latest measurement
            latest = data_array[-1]
            
            # Extract values
            wind_speed = float(latest.get('speed', 0)) if latest.get('speed') else None
            density = float(latest.get('density', 0)) if latest.get('density') else None
            bz_gsm = float(latest.get('bz_gsm', 0)) if latest.get('bz_gsm') else None
            bt = float(latest.get('bt', 0)) if latest.get('bt') else None
            
            if wind_speed is None:
                logger.warning("No wind speed in NOAA data")
                return None
            
            # Detect anomalies
            triggers = []
            urgency = 0.0
            
            # Wind speed surge detection
            if self.last_wind_speed is not None:
                speed_jump = wind_speed - self.last_wind_speed
                if speed_jump > self.WIND_SPEED_SURGE_THRESHOLD:
                    triggers.append(f"Solar wind surge: {wind_speed:.0f} km/s (+{speed_jump:.0f})")
                    urgency = max(urgency, 0.7)
            
            # Bz southward (geomagnetic storm indicator)
            if bz_gsm is not None and bz_gsm < self.BZ_THRESHOLD:
                triggers.append(f"Bz southward: {bz_gsm:.1f} nT (storm risk)")
                urgency = max(urgency, 0.8)
            
            # High density
            if density is not None and density > self.DENSITY_HIGH_THRESHOLD:
                triggers.append(f"High density: {density:.1f} p/cm³")
                urgency = max(urgency, 0.6)
            
            # Update baseline
            self.last_wind_speed = wind_speed
            self.last_poll_time = datetime.utcnow()
            
            # Only create event if triggers detected
            if not triggers:
                logger.info(f"NOAA poll: wind={wind_speed:.0f} km/s, Bz={bz_gsm:.1f} nT - nominal")
                return None
            
            # Create anomaly event
            event = Event(
                event_type="spaceweather",
                timestamp=datetime.utcnow(),
                ra=None,  # Solar wind source is the Sun (not sky position)
                dec=None,
                data={
                    "source": "NOAA_SWPC_LIVE",
                    "solar_wind_speed": wind_speed,
                    "solar_wind_density": density,
                    "bz_gsm": bz_gsm,
                    "bt": bt,
                    "anomaly_triggers": triggers,
                    "severity": "high" if urgency > 0.7 else "medium",
                    "data_timestamp": latest.get('time_tag')
                },
                confidence=urgency,
                source="NOAA_SWPC_REALTIME"
            )
            
            db.add(event)
            db.commit()
            db.refresh(event)
            
            logger.warning(f"⚠️ LIVE SPACE WEATHER EVENT: {', '.join(triggers)}")
            
            return event
            
        except requests.RequestException as e:
            logger.error(f"Failed to fetch NOAA data: {e}")
            return None
        except Exception as e:
            logger.error(f"Error processing NOAA data: {e}")
            return None


# Singleton
noaa_live_ingester = NOAALiveIngester()


def poll_noaa_live(db: Session) -> Optional[Event]:
    """
    Poll NOAA for real solar wind data.
    Call this every 60 seconds from main server loop.
    
    Args:
        db: Database session
        
    Returns:
        Event if anomaly detected
    """
    return noaa_live_ingester.poll_live_data(db)
