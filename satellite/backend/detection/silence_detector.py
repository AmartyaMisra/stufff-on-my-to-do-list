"""
Silence/Negative-Space Detector - Detects ABSENCE of expected signals

In signal intelligence, silence is data.
This module detects:
1. Missing expected signals (ISS dropout)
2. HF blackout (correlated with NOAA data)
3. Sudden quiet in normally active bands
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from typing import Optional, List, Dict
import logging

from database.models import Event

logger = logging.getLogger(__name__)


class SilenceDetector:
    """
    Detects negative-space anomalies - when expected signals are MISSING.
    """
    
    # Expected signal sources and their expected cadence
    EXPECTED_SOURCES = {
        'iss': {'cadence_minutes': 5, 'name': 'ISS Position'},
        'spaceweather': {'cadence_minutes': 2, 'name': 'NOAA Space Weather'},
    }
    
    # HF silence indicators
    HF_BANDS = ['7.2MHz', '14.2MHz', '21.2MHz', '28.5MHz']
    
    def __init__(self):
        self.last_check = None
        self.baseline_activity = {}  # Track normal activity levels
    
    def check_for_silence(self, db: Session) -> List[Event]:
        """
        Check for negative-space anomalies.
        
        Returns list of silence events detected.
        """
        now = datetime.utcnow()
        silence_events = []
        
        # 1. Check for missing expected sources
        for source_type, config in self.EXPECTED_SOURCES.items():
            last_event = db.query(Event).filter(
                Event.event_type == source_type
            ).order_by(Event.timestamp.desc()).first()
            
            if last_event:
                age_minutes = (now - last_event.timestamp).total_seconds() / 60
                expected_cadence = config['cadence_minutes']
                
                # If signal is 3x overdue, create silence event
                if age_minutes > expected_cadence * 3:
                    event = self._create_silence_event(
                        db=db,
                        silence_type='signal_dropout',
                        description=f"{config['name']} signal missing",
                        details={
                            'missing_source': source_type,
                            'last_seen_minutes_ago': round(age_minutes, 1),
                            'expected_cadence_minutes': expected_cadence,
                            'severity': 'high' if age_minutes > expected_cadence * 10 else 'medium'
                        }
                    )
                    silence_events.append(event)
                    logger.warning(f"🔇 SILENCE: {config['name']} missing for {age_minutes:.1f} minutes")
        
        # 2. Check for HF blackout (correlated with space weather)
        recent_spaceweather = db.query(Event).filter(
            Event.event_type == 'spaceweather',
            Event.timestamp >= now - timedelta(minutes=15)
        ).order_by(Event.timestamp.desc()).first()
        
        if recent_spaceweather:
            # Check if there's a severe solar event that would cause HF blackout
            bz = recent_spaceweather.data.get('bz_gsm', 0)
            proton_flux = recent_spaceweather.data.get('proton_flux', 0)
            
            if bz < -15 or proton_flux > 100:
                # High probability of HF blackout
                # Check if radio_monitor events have stopped
                recent_radio = db.query(Event).filter(
                    Event.event_type == 'radio_monitor',
                    Event.timestamp >= now - timedelta(minutes=10)
                ).count()
                
                if recent_radio == 0:
                    event = self._create_silence_event(
                        db=db,
                        silence_type='hf_blackout',
                        description="HF propagation blackout detected",
                        details={
                            'cause': 'Solar proton event',
                            'bz_gsm': bz,
                            'proton_flux': proton_flux,
                            'affected_bands': self.HF_BANDS,
                            'severity': 'high'
                        }
                    )
                    silence_events.append(event)
                    logger.warning(f"🔇 HF BLACKOUT: Solar activity causing propagation loss")
        
        self.last_check = now
        return silence_events
    
    def _create_silence_event(
        self, 
        db: Session, 
        silence_type: str, 
        description: str, 
        details: Dict
    ) -> Event:
        """Create a negative-space anomaly event."""
        event = Event(
            event_type='silence',  # NEW EVENT TYPE
            timestamp=datetime.utcnow(),
            ra=None,
            dec=None,
            data={
                'source': 'SILENCE_DETECTOR',
                'silence_type': silence_type,
                'description': description,
                'is_negative_space': True,  # Flag for special rendering
                **details
            },
            confidence=0.7,
            source='SILENCE_DETECTOR'
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event


# Singleton
silence_detector = SilenceDetector()


def check_for_silence(db: Session) -> List[Event]:
    """
    Check for negative-space anomalies (missing signals).
    
    Call this every 60 seconds.
    """
    return silence_detector.check_for_silence(db)
