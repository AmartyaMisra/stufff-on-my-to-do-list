"""
TLE (Two-Line Element) Tracker for Known Transmitters
Fetches and manages orbital data for satellites, space stations, and spacecraft.

Data Source: CelesTrak (https://celestrak.org/)
"""
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import logging

from database.models import KnownTransmitter

logger = logging.getLogger(__name__)


class TLETracker:
    """
    Manages TLE data for tracking known space transmitters.
    """
    
    # CelesTrak API endpoints
    CELESTRAK_BASE = "https://celestrak.org/NORAD/elements/gp.php"
    
    # Groups to track
    TLE_GROUPS = [
        "stations",  # ISS, Tiangong
        "active",    # Active satellites
        "cubesat",   # CubeSats
    ]
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'SpaceAnomalyRadar/1.0'
        })
    
    def update_all_transmitters(self, db: Session) -> Dict[str, int]:
        """
        Fetch latest TLE data for all tracked groups and update database.
        
        Returns:
            Dict with counts: {'updated': N, 'added': M, 'errors': K}
        """
        stats = {'updated': 0, 'added': 0, 'errors': 0}
        
        for group in self.TLE_GROUPS:
            try:
                transmitters = self._fetch_tle_group(group)
                logger.info(f"Fetched {len(transmitters)} TLEs from group: {group}")
                
                for tx_data in transmitters:
                    try:
                        was_new = self._upsert_transmitter(db, tx_data, group)
                        if was_new:
                            stats['added'] += 1
                        else:
                            stats['updated'] += 1
                    except Exception as e:
                        logger.error(f"Error upserting transmitter {tx_data.get('name')}: {e}")
                        stats['errors'] += 1
                
                db.commit()
                
            except Exception as e:
                logger.error(f"Error fetching TLE group {group}: {e}")
                stats['errors'] += 1
        
        return stats
    
    def _fetch_tle_group(self, group: str) -> List[Dict[str, Any]]:
        """
        Fetch TLE data for a specific group from CelesTrak.
        
        Args:
            group: Group name (e.g., 'stations', 'active', 'cubesat')
            
        Returns:
            List of transmitter dictionaries with TLE data
        """
        url = f"{self.CELESTRAK_BASE}?GROUP={group}&FORMAT=tle"
        
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            # Parse TLE format (3 lines per entry: name, line1, line2)
            lines = response.text.strip().split('\n')
            transmitters = []
            
            for i in range(0, len(lines), 3):
                if i + 2 >= len(lines):
                    break
                
                name = lines[i].strip()
                line1 = lines[i + 1].strip()
                line2 = lines[i + 2].strip()
                
                # Extract catalog number from line 1
                catalog_id = line1[2:7].strip()
                
                # Extract epoch from line 1 (format: YYDDD.DDDDDDDD)
                epoch_str = line1[18:32].strip()
                epoch = self._parse_tle_epoch(epoch_str)
                
                transmitters.append({
                    'name': name,
                    'catalog_id': catalog_id,
                    'tle_line1': line1,
                    'tle_line2': line2,
                    'tle_epoch': epoch
                })
            
            return transmitters
            
        except requests.RequestException as e:
            logger.error(f"Failed to fetch TLE group {group}: {e}")
            return []
    
    def _parse_tle_epoch(self, epoch_str: str) -> datetime:
        """
        Parse TLE epoch format (YYDDD.DDDDDDDD) to datetime.
        
        Args:
            epoch_str: Epoch string from TLE line 1
            
        Returns:
            datetime object
        """
        try:
            year_prefix = epoch_str[:2]
            day_of_year = float(epoch_str[2:])
            
            # Convert 2-digit year to 4-digit
            year = int(year_prefix)
            if year < 57:  # Epoch starts in 1957
                year += 2000
            else:
                year += 1900
            
            # Convert day of year to datetime
            base_date = datetime(year, 1, 1)
            delta_days = day_of_year - 1
            epoch = base_date + timedelta(days=delta_days)
            
            return epoch
            
        except Exception as e:
            logger.error(f"Failed to parse TLE epoch {epoch_str}: {e}")
            return datetime.utcnow()
    
    def _upsert_transmitter(self, db: Session, tx_data: Dict[str, Any], group: str) -> bool:
        """
        Insert or update a transmitter in the database.
        
        Returns:
            True if new transmitter was added, False if existing was updated
        """
        catalog_id = tx_data['catalog_id']
        
        # Check if already exists
        existing = db.query(KnownTransmitter).filter(
            KnownTransmitter.catalog_id == catalog_id
        ).first()
        
        if existing:
            # Update TLE data
            existing.tle_line1 = tx_data['tle_line1']
            existing.tle_line2 = tx_data['tle_line2']
            existing.tle_epoch = tx_data['tle_epoch']
            existing.updated_at = datetime.utcnow()
            existing.is_active = True
            return False
        else:
            # Create new entry
            transmitter_type = self._infer_transmitter_type(group, tx_data['name'])
            frequencies = self._infer_frequencies(tx_data['name'], transmitter_type)
            
            new_tx = KnownTransmitter(
                name=tx_data['name'],
                catalog_id=catalog_id,
                transmitter_type=transmitter_type,
                tle_line1=tx_data['tle_line1'],
                tle_line2=tx_data['tle_line2'],
                tle_epoch=tx_data['tle_epoch'],
                frequencies_mhz=frequencies,
                is_active=True,
                data_source=f"CelesTrak:{group}",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            db.add(new_tx)
            return True
    
    def _infer_transmitter_type(self, group: str, name: str) -> str:
        """Infer transmitter type from group and name."""
        if group == "stations" or "ISS" in name or "TIANGONG" in name:
            return "space_station"
        elif "CUBESAT" in name.upper() or group == "cubesat":
            return "cubesat"
        elif "NOAA" in name or "GOES" in name or "WEATHER" in name:
            return "weather_satellite"
        elif "GPS" in name or "GLONASS" in name or "GALILEO" in name:
            return "navigation_satellite"
        else:
            return "satellite"
    
    def _infer_frequencies(self, name: str, tx_type: str) -> List[float]:
        """
        Infer likely transmission frequencies from name and type.
        
        Returns:
            List of frequencies in MHz
        """
        frequencies = []
        
        # ISS known frequencies
        if "ISS" in name:
            frequencies.extend([145.8, 437.8, 2441.0])  # Amateur, downlink, S-band
        
        # Weather satellites
        elif "NOAA" in name:
            frequencies.extend([137.1, 137.9125])  # APT downlink
        
        # Generic amateur satellites
        elif tx_type == "cubesat" or "AMATEUR" in name:
            frequencies.extend([145.0, 437.0])  # Common amateur bands
        
        # If no specific frequencies, use common bands
        if not frequencies:
            frequencies.append(436.5)  # Generic UHF downlink
        
        return frequencies
    
    def get_active_transmitters(self, db: Session, max_age_hours: int = 72) -> List[KnownTransmitter]:
        """
        Get list of active transmitters with recent TLE data.
        
        Args:
            db: Database session
            max_age_hours: Maximum TLE age in hours (default 72)
            
        Returns:
            List of KnownTransmitter objects
        """
        cutoff = datetime.utcnow() - timedelta(hours=max_age_hours)
        
        transmitters = db.query(KnownTransmitter).filter(
            KnownTransmitter.is_active == True,
            KnownTransmitter.tle_epoch >= cutoff
        ).all()
        
        return transmitters


# Singleton instance
tle_tracker = TLETracker()


def update_transmitter_catalog(db: Session) -> Dict[str, int]:
    """
    Update the known transmitter catalog from CelesTrak.
    
    Should be called periodically (every 12-24 hours).
    
    Args:
        db: Database session
        
    Returns:
        Statistics dictionary
    """
    return tle_tracker.update_all_transmitters(db)


def get_known_transmitters(db: Session) -> List[KnownTransmitter]:
    """
    Get all active known transmitters.
    
    Args:
        db: Database session
        
    Returns:
        List of KnownTransmitter objects
    """
    return tle_tracker.get_active_transmitters(db)
