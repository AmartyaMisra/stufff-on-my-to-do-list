"""
Quiet Zone Monitor
Detects unauthorized emissions in protected radio astronomy frequency bands.

Protected bands per ITU Radio Regulations (Article 5):
- 1400-1427 MHz: Hydrogen Line (21 cm)
- 4990-5000 MHz: Radio Astronomy Service  
- 10.68-10.7 GHz: Continuum observations
- And others...
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
import logging

from database.models import Event, FrequencyBand

logger = logging.getLogger(__name__)


class QuietZoneMonitor:
    """
    Monitors for emissions in protected radio astronomy bands.
    """
    
    def __init__(self):
        # Will be populated from database
        self.protected_bands: List[FrequencyBand] = []
    
    def initialize_bands(self, db: Session) -> int:
        """
        Initialize protected frequency bands in database if not already present.
        
        Returns:
            Number of bands initialized
        """
        # Check if already initialized
        existing_count = db.query(FrequencyBand).count()
        if existing_count > 0:
            logger.info(f"Frequency bands already initialized ({existing_count} bands)")
            return 0
        
        # Define ITU-protected bands for radio astronomy
        bands = [
            {
                'band_name': 'Hydrogen Line',
                'frequency_min_mhz': 1400.0,
                'frequency_max_mhz': 1427.0,
                'is_protected': True,
                'protection_regulation': 'ITU-R RA.769-2',
                'purpose': 'H-I (neutral hydrogen) 21cm line observation — fundamental for galactic structure studies',
                'severity_if_violated': 'critical',
                'notes': 'Most protected band in radio astronomy. Passive observation only.'
            },
            {
                'band_name': 'Hydroxyl (OH) Lines',
                'frequency_min_mhz': 1610.6,
                'frequency_max_mhz': 1613.8,
                'is_protected': True,
                'protection_regulation': 'ITU-R RA.769-2',
                'purpose': 'OH radical spectral lines — molecular cloud observation',
                'severity_if_violated': 'high'
            },
            {
                'band_name': 'RAS Band (5 GHz)',
                'frequency_min_mhz': 4990.0,
                'frequency_max_mhz': 5000.0,
                'is_protected': True,
                'protection_regulation': 'ITU-R RA.769-2',
                'purpose': 'Continuum observations and spectral line work',
                'severity_if_violated': 'high'
            },
            {
                'band_name': 'RAS Band (10.7 GHz)',
                'frequency_min_mhz': 10680.0,
                'frequency_max_mhz': 10700.0,
                'is_protected': True,
                'protection_regulation': 'ITU-R RA.769-2',
                'purpose': 'High-frequency continuum and spectral observations',
                'severity_if_violated': 'medium'
            },
            {
                'band_name': 'RAS Band (31.5 GHz)',
                'frequency_min_mhz': 31300.0,
                'frequency_max_mhz': 31800.0,
                'is_protected': True,
                'protection_regulation': 'ITU-R RA.769-2',
                'purpose': 'Millimeter-wave continuum observations',
                'severity_if_violated': 'medium'
            },
            {
                'band_name': 'Redshifted Hydrogen',
                'frequency_min_mhz': 73.0,
                'frequency_max_mhz': 74.6,
                'is_protected': True,
                'protection_regulation': 'ITU-R RA.769-2',
                'purpose': 'Detection of redshifted H-I from early universe',
                'severity_if_violated': 'high',
                'notes': 'Critical for cosmological studies'
            },
        ]
        
        for band_data in bands:
            band = FrequencyBand(
                band_name=band_data['band_name'],
                frequency_min_mhz=band_data['frequency_min_mhz'],
                frequency_max_mhz=band_data['frequency_max_mhz'],
                is_protected=band_data['is_protected'],
                protection_regulation=band_data.get('protection_regulation'),
                purpose=band_data['purpose'],
                severity_if_violated=band_data['severity_if_violated'],
                notes=band_data.get('notes'),
                created_at=datetime.utcnow()
            )
            db.add(band)
        
        db.commit()
        logger.info(f"Initialized {len(bands)} protected frequency bands")
        return len(bands)
    
    def load_protected_bands(self, db: Session):
        """Load protected bands from database into memory."""
        self.protected_bands = db.query(FrequencyBand).filter(
            FrequencyBand.is_protected == True
        ).all()
        logger.info(f"Loaded {len(self.protected_bands)} protected frequency bands")
    
    def check_signal(self, event: Event) -> Optional[Dict[str, Any]]:
        """
        Check if signal violates a protected frequency band.
        
        Args:
            event: Event to check
            
        Returns:
            Alert dictionary if violation detected, None otherwise
        """
        # Extract frequency from event
        frequency_mhz = event.data.get('frequency_mhz')
        
        if not frequency_mhz:
            return None
        
        # Check against all protected bands
        for band in self.protected_bands:
            if band.frequency_min_mhz <= frequency_mhz <= band.frequency_max_mhz:
                # Violation detected!
                return self._create_violation_alert(event, band, frequency_mhz)
        
        return None
    
    def _create_violation_alert(
        self,
        event: Event,
        band: FrequencyBand,
        frequency_mhz: float
    ) -> Dict[str, Any]:
        """
        Create violation alert with explanation.
        
        Args:
            event: Event that violated the band
            band: FrequencyBand that was violated
            frequency_mhz: Detected frequency
            
        Returns:
            Alert dictionary
        """
        alert = {
            'alert_type': 'quiet_zone_violation',
            'severity': band.severity_if_violated,
            'band_name': band.band_name,
            'band_range_mhz': [band.frequency_min_mhz, band.frequency_max_mhz],
            'detected_frequency_mhz': frequency_mhz,
            'regulation': band.protection_regulation,
            'purpose': band.purpose,
            'explanation': self._generate_explanation(band, frequency_mhz),
            'recommended_action': self._recommend_action(band),
            'event_id': event.id,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        logger.warning(
            f"QUIET ZONE VIOLATION: {frequency_mhz:.3f} MHz detected in {band.band_name} "
            f"({band.frequency_min_mhz}-{band.frequency_max_mhz} MHz)"
        )
        
        return alert
    
    def _generate_explanation(self, band: FrequencyBand, frequency_mhz: float) -> str:
        """Generate human-readable explanation of violation."""
        explanation = (
            f"Emission detected at {frequency_mhz:.3f} MHz within the protected "
            f"{band.band_name} band ({band.frequency_min_mhz}-{band.frequency_max_mhz} MHz). "
            f"This band is reserved for passive radio astronomy: {band.purpose}. "
        )
        
        if band.band_name == "Hydrogen Line":
            explanation += (
                "The Hydrogen Line is the most protected frequency in radio astronomy. "
                "Any emission here severely interferes with galactic hydrogen mapping."
            )
        
        explanation += " Investigating source to determine if RFI or astronomical signal."
        
        return explanation
    
    def _recommend_action(self, band: FrequencyBand) -> str:
        """Recommend action based on severity."""
        if band.severity_if_violated == "critical":
            return "IMMEDIATE INVESTIGATION REQUIRED - Notify spectrum management authorities"
        elif band.severity_if_violated == "high":
            return "HIGH PRIORITY - Identify and localize source"
        else:
            return "MONITOR - Log for pattern analysis"


# Singleton instance
quiet_zone_monitor = QuietZoneMonitor()


def initialize_quiet_zones(db: Session) -> int:
    """
    Initialize protected frequency bands.
    Should be called once at system startup.
    
    Args:
        db: Database session
        
    Returns:
        Number of bands initialized
    """
    count = quiet_zone_monitor.initialize_bands(db)
    quiet_zone_monitor.load_protected_bands(db)
    return count


def check_quiet_zone_violation(event: Event, db: Session) -> Optional[Dict[str, Any]]:
    """
    Check if an event violates a protected frequency band.
    
    Args:
        event: Event to check
        db: Database session
        
    Returns:
        Alert dictionary if violation, None otherwise
    """
    # Ensure bands are loaded
    if not quiet_zone_monitor.protected_bands:
        quiet_zone_monitor.load_protected_bands(db)
    
    return quiet_zone_monitor.check_signal(event)
