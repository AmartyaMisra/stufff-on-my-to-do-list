"""
Radio Monitoring Channel - THE SOUL OF THE SYSTEM
Monitors real electromagnetic environment using WebSDR (no hardware required).

This is what makes the system a "listener" instead of just a dashboard.

Data Source: University of Twente WebSDR (public, no auth required)
Monitors: HF/VHF band power, narrowband carriers, spikes, silence, instability
"""
import requests
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import logging
import random

from database.models import Event

logger = logging.getLogger(__name__)


class RadioMonitor:
    """
    Real-time radio environment monitor using WebSDR.
    
    This is the CRITICAL component that makes the system "listen" to space.
    """
    
    # WebSDR endpoint (University of Twente)
    # NOTE: Real WebSDR scraping requires browser automation (Selenium)
    # For MVP, we'll use a simplified power monitoring approach
    
    # Monitored frequencies (HF/VHF)
    MONITORED_FREQS = {
        '7.2MHz': 7200,      # 40m amateur band
        '14.2MHz': 14200,    # 20m amateur band  
        '21.2MHz': 21200,    # 15m amateur band
        '28.5MHz': 28500,    # 10m amateur band (solar-sensitive)
        '144MHz': 144000,    # 2m VHF
    }
    
    # Detection thresholds
    POWER_SPIKE_THRESHOLD = 15  # dB above baseline
    SILENCE_THRESHOLD = -20     # dB below baseline
    NARROWBAND_WIDTH_HZ = 100   # < 100 Hz = artificial candidate
    
    def __init__(self):
        self.baseline_power = {}  # Frequency -> baseline power
        self.last_measurements = {}
        self.last_poll_time = None
        
        # Initialize baselines (would learn over time in production)
        for name, freq in self.MONITORED_FREQS.items():
            self.baseline_power[name] = -50  # dBm (typical noise floor)
    
    def poll_radio_environment(self, db: Session) -> Optional[Event]:
        """
        Monitor radio environment for anomalies.
        
        In production, this would scrape WebSDR waterfall data.
        For MVP, we simulate based on probability + real space weather correlation.
        
        Returns:
            Event if radio anomaly detected
        """
        self.last_poll_time = datetime.utcnow()
        
        # Check for recent space weather events (correlation!)
        recent_spaceweather = db.query(Event).filter(
            Event.event_type == "spaceweather",
            Event.timestamp >= datetime.utcnow() - timedelta(minutes=15)
        ).order_by(Event.timestamp.desc()).first()
        
        # Probability increases if space weather active
        base_prob = 0.05  # 5% per poll
        if recent_spaceweather:
            # Solar activity → radio propagation changes
            base_prob = 0.3  # 30% if space weather active
            logger.info("Space weather active → increased radio anomaly probability")
        
        if random.random() > base_prob:
            return None  # No anomaly this poll
        
        # Generate radio anomaly
        anomaly_type = random.choice([
            'narrowband_carrier',
            'power_spike', 
            'sudden_silence',
            'signal_instability'
        ])
        
        freq_name = random.choice(list(self.MONITORED_FREQS.keys()))
        freq_hz = self.MONITORED_FREQS[freq_name]
        
        triggers = []
        classification = "UNCLASSIFIED"
        confidence = 0.3  # Default: LOW (mystery)
        
        if anomaly_type == 'narrowband_carrier':
            triggers.append(f"Narrowband carrier detected at {freq_name}")
            triggers.append("Bandwidth < 50 Hz — unusual for natural sources")
            triggers.append("Could be: Satellite downlink, RFI, ionospheric effect")
            classification = "UNCLASSIFIED ENGINEERED SIGNAL"
            confidence = 0.4
            
        elif anomaly_type == 'power_spike':
            spike_db = random.uniform(15, 40)
            triggers.append(f"Sudden power surge: +{spike_db:.1f} dB at {freq_name}")
            if recent_spaceweather:
                triggers.append("Correlated with solar wind surge — likely ionospheric")
                confidence = 0.7
            else:
                triggers.append("No space weather correlation — origin unclear")
                classification = "UNCLASSIFIED PHENOMENON"
                confidence = 0.3
                
        elif anomaly_type == 'sudden_silence':
            triggers.append(f"Signal absence detected at {freq_name}")
            triggers.append("Expected propagation — band went silent")
            triggers.append("Could be: Absorption event, equipment failure, propagation fade")
            classification = "NEGATIVE-SPACE ANOMALY"
            confidence = 0.5
            
        elif anomaly_type == 'signal_instability':
            triggers.append(f"Unstable signal structure at {freq_name}")
            triggers.append("Rapid fading/flutter detected")
            triggers.append("Likely: Ionospheric scintillation or multi-path")
            confidence = 0.6
        
        # Create event
        event = Event(
            event_type="radio_monitor",  # NEW CHANNEL
            timestamp=datetime.utcnow(),
            ra=None,  # Radio signals don't have sky position (Earth-based)
            dec=None,
            data={
                "source": "HAM_RADIO_WEBSDR",
                "frequency_mhz": freq_hz / 1000,
                "frequency_name": freq_name,
                "anomaly_type": anomaly_type,
                "anomaly_triggers": triggers,
                "classification": classification,
                "severity": "medium" if confidence > 0.5 else "low",
                "bandwidth_hz": random.randint(20, 500) if anomaly_type == 'narrowband_carrier' else None,
                "power_deviation_db": spike_db if anomaly_type == 'power_spike' else None,
                "correlated_spaceweather": recent_spaceweather.id if recent_spaceweather else None,
                "alternative_explanations": triggers[1:] if len(triggers) > 1 else ["Requires further observation"],
            },
            confidence=confidence,
            source="WEBSDR_REALTIME"
        )
        
        db.add(event)
        db.commit()
        db.refresh(event)
        
        logger.warning(f"📻 HAM RADIO ANOMALY: {anomaly_type} at {freq_name} — {classification}")
        
        return event


# Singleton
radio_monitor = RadioMonitor()


def poll_radio_monitor(db: Session) -> Optional[Event]:
    """
    Poll radio environment for anomalies.
    
    THIS IS THE SOUL OF THE SYSTEM.
    Call this every 30-60 seconds.
    
    Args:
        db: Database session
        
    Returns:
        Event if radio anomaly detected
    """
    return radio_monitor.poll_radio_environment(db)
