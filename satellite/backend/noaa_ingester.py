"""
NOAA Space Weather Ingester
Polls NOAA SWPC JSON feeds and creates anomaly events

Data Sources:
- Solar wind: https://services.swpc.noaa.gov/products/solar-wind/plasma-7-day.json
- Magnetic field: https://services.swpc.noaa.gov/products/solar-wind/mag-7-day.json
- Proton flux: https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json
"""
import httpx
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
import statistics

from database.models import Event, get_db


class NOAASpaceWeatherIngester:
    """Real-time NOAA Space Weather data ingester"""
    
    # NOAA API endpoints
    SOLAR_WIND_URL = "https://services.swpc.noaa.gov/products/solar-wind/plasma-7-day.json"
    MAG_FIELD_URL = "https://services.swpc.noaa.gov/products/solar-wind/mag-7-day.json"
    PROTON_FLUX_URL = "https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json"
    
    # Anomaly thresholds
    SOLAR_WIND_THRESHOLD = 500  # km/s (typical is 300-400)
    BZ_THRESHOLD = -10  # nT (strong southward = geomagnetic storm)
    PROTON_FLUX_THRESHOLD = 10  # pfu (Solar Proton Event threshold)
    
    def __init__(self):
        self.last_solar_wind = []
        self.last_bz = []
        self.last_proton = []
        
    async def fetch_solar_wind(self) -> Optional[Dict[str, Any]]:
        """Fetch solar wind plasma data"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(self.SOLAR_WIND_URL)
                response.raise_for_status()
                data = response.json()
                
                # Data format: [["time_tag","density","speed","temperature"], ...]
                if len(data) < 2:
                    return None
                    
                # Get the most recent reading (last row)
                headers = data[0]
                latest = data[-1]
                
                result = {
                    "time_tag": latest[0] if len(headers) > 0 else None,
                    "density": self._parse_float(latest[1]) if len(latest) > 1 else None,
                    "speed": self._parse_float(latest[2]) if len(latest) > 2 else None,
                    "temperature": self._parse_float(latest[3]) if len(latest) > 3 else None,
                }
                
                # Store for rolling average
                if result["speed"]:
                    self.last_solar_wind.append(result["speed"])
                    self.last_solar_wind = self.last_solar_wind[-60:]  # Keep last 60 readings
                
                return result
        except Exception as e:
            print(f"Error fetching solar wind: {e}")
            return None
    
    async def fetch_magnetic_field(self) -> Optional[Dict[str, Any]]:
        """Fetch interplanetary magnetic field data"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(self.MAG_FIELD_URL)
                response.raise_for_status()
                data = response.json()
                
                if len(data) < 2:
                    return None
                    
                # Data format: [["time_tag","bx_gsm","by_gsm","bz_gsm","lon_gsm","lat_gsm","bt"], ...]
                latest = data[-1]
                
                result = {
                    "time_tag": latest[0] if len(latest) > 0 else None,
                    "bx_gsm": self._parse_float(latest[1]) if len(latest) > 1 else None,
                    "by_gsm": self._parse_float(latest[2]) if len(latest) > 2 else None,
                    "bz_gsm": self._parse_float(latest[3]) if len(latest) > 3 else None,
                    "bt": self._parse_float(latest[6]) if len(latest) > 6 else None,
                }
                
                if result["bz_gsm"]:
                    self.last_bz.append(result["bz_gsm"])
                    self.last_bz = self.last_bz[-60:]
                
                return result
        except Exception as e:
            print(f"Error fetching magnetic field: {e}")
            return None
    
    async def fetch_proton_flux(self) -> Optional[Dict[str, Any]]:
        """Fetch proton flux data (Solar Proton Events)"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(self.PROTON_FLUX_URL)
                response.raise_for_status()
                data = response.json()
                
                if not data:
                    return None
                    
                # Get the most recent reading
                latest = data[-1]
                
                result = {
                    "time_tag": latest.get("time_tag"),
                    "flux_gt10mev": latest.get("flux"),  # >10 MeV protons
                    "energy": latest.get("energy"),
                }
                
                if result["flux_gt10mev"]:
                    self.last_proton.append(result["flux_gt10mev"])
                    self.last_proton = self.last_proton[-60:]
                
                return result
        except Exception as e:
            print(f"Error fetching proton flux: {e}")
            return None
    
    def _parse_float(self, value) -> Optional[float]:
        """Safely parse a float value"""
        try:
            if value is None or value == "" or value == "null":
                return None
            return float(value)
        except (ValueError, TypeError):
            return None
    
    def compute_anomaly_score(
        self, 
        solar_wind: Optional[Dict], 
        mag_field: Optional[Dict], 
        proton: Optional[Dict]
    ) -> Dict[str, Any]:
        """
        Compute anomaly score based on space weather conditions.
        Returns score 0.0-1.0 and list of triggered conditions.
        """
        score = 0.0
        triggers = []
        severity = "low"
        
        # Check solar wind speed
        if solar_wind and solar_wind.get("speed"):
            speed = solar_wind["speed"]
            if speed > self.SOLAR_WIND_THRESHOLD:
                delta = speed - self.SOLAR_WIND_THRESHOLD
                score += min(0.3, delta / 500 * 0.3)
                triggers.append(f"Solar wind surge: {speed:.0f} km/s")
                
            # Check for sudden jump (z-score)
            if len(self.last_solar_wind) >= 10:
                mean = statistics.mean(self.last_solar_wind[:-1])
                stdev = statistics.stdev(self.last_solar_wind[:-1]) or 1
                z_score = (speed - mean) / stdev
                if z_score > 2:
                    score += 0.15
                    triggers.append(f"Solar wind jump (z={z_score:.1f})")
        
        # Check Bz (southward = negative = bad for Earth)
        if mag_field and mag_field.get("bz_gsm") is not None:
            bz = mag_field["bz_gsm"]
            if bz < self.BZ_THRESHOLD:
                score += min(0.35, abs(bz - self.BZ_THRESHOLD) / 20 * 0.35)
                triggers.append(f"Strong southward Bz: {bz:.1f} nT")
                severity = "medium"
        
        # Check proton flux
        if proton and proton.get("flux_gt10mev"):
            flux = proton["flux_gt10mev"]
            if flux > self.PROTON_FLUX_THRESHOLD:
                score += min(0.3, (flux / self.PROTON_FLUX_THRESHOLD) * 0.1)
                triggers.append(f"Elevated proton flux: {flux:.2f} pfu")
                severity = "high" if flux > 100 else severity
        
        # Combined effect (synergy bonus)
        if len(triggers) >= 2:
            score += 0.1
            severity = "high"
        if len(triggers) >= 3:
            score += 0.1
            severity = "critical"
        
        return {
            "score": min(1.0, score),
            "triggers": triggers,
            "severity": severity,
            "triggered": len(triggers) > 0
        }
    
    async def ingest(self, db: Session) -> Optional[Event]:
        """
        Fetch all NOAA data and create an event if anomaly detected.
        """
        # Fetch all data concurrently
        solar_wind, mag_field, proton = await asyncio.gather(
            self.fetch_solar_wind(),
            self.fetch_magnetic_field(),
            self.fetch_proton_flux()
        )
        
        # Compute anomaly
        anomaly = self.compute_anomaly_score(solar_wind, mag_field, proton)
        
        # Always create a space weather event for UI gauges (even if low score)
        event_data = {
            "source": "NOAA_SWPC",
            "solar_wind_speed": solar_wind.get("speed") if solar_wind else None,
            "solar_wind_density": solar_wind.get("density") if solar_wind else None,
            "bz_gsm": mag_field.get("bz_gsm") if mag_field else None,
            "bt": mag_field.get("bt") if mag_field else None,
            "proton_flux": proton.get("flux_gt10mev") if proton else None,
            "anomaly_triggers": anomaly["triggers"],
            "severity": anomaly["severity"],
        }
        
        # Sun coordinates (approximate, center of heliosphere)
        # RA = Sun's current position (varies throughout year)
        # For simplicity, use fixed position
        sun_ra = 0  # Will be updated to actual position
        sun_dec = 0
        
        event = Event(
            event_type="spaceweather",
            timestamp=datetime.utcnow(),
            ra=sun_ra,
            dec=sun_dec,
            data=event_data,
            confidence=anomaly["score"],
            source="NOAA_SWPC"
        )
        
        db.add(event)
        db.commit()
        db.refresh(event)
        
        return event


# Singleton instance
noaa_ingester = NOAASpaceWeatherIngester()


async def poll_noaa_data(db: Session) -> Optional[Event]:
    """Poll NOAA and create event"""
    return await noaa_ingester.ingest(db)
