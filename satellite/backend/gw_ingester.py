"""
Gravitational Wave (GW) Ingester
Simulates and manages LIGO/Virgo/KAGRA alert streams.
Real source: https://gracedb.ligo.org/api/

Event Types:
- CBC: Compact Binary Coalescence (Black hole/Neutron star mergers)
- Burst: Unmodeled transient bursts
"""
import random
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
import math

from database.models import Event


class GWIngester:
    """
    Ingests Gravitational Wave alerts.
    """
    
    def generate_synthetic_gw(self) -> Dict[str, Any]:
        """Generate a synthetic GW event characteristic of a merger"""
        
        # Event type probabilities
        type_roll = random.random()
        if type_roll < 0.7:
            subtype = "BBH"  # Binary Black Hole (most common)
            mass1 = random.uniform(20, 80)
            mass2 = mass1 * random.uniform(0.5, 0.95)
            # Distance: 100 Mpc to 5 Gpc
            distance_mpc = random.uniform(100, 5000) 
        elif type_roll < 0.9:
            subtype = "BNS"  # Binary Neutron Star (rare, but interesting fusion candidate)
            mass1 = random.uniform(1.1, 2.5)
            mass2 = random.uniform(1.1, 2.0)
            distance_mpc = random.uniform(10, 500)
        else:
            subtype = "NSBH" # Neutron Star - Black Hole
            mass1 = random.uniform(20, 50)
            mass2 = random.uniform(1.2, 2.5)
            distance_mpc = random.uniform(50, 1000)
            
        # Signal characteristics
        snr = random.uniform(10, 35)
        far = 1.0 / (random.uniform(1, 100))  # False Alarm Rate (per year)
        
        # Sky Localization Area (GWs have poor localization)
        area_90 = random.uniform(100, 2000)  # sq degrees
        
        return {
            "superevent_id": f"S{datetime.utcnow().strftime('%y%m%d')}{random.choice('abcde')}",
            "group": "CBC",
            "pipeline": "gstlal",
            "search": "AllSky",
            "subtype": subtype,
            "mass1_solar": round(mass1, 1),
            "mass2_solar": round(mass2, 1),
            "distance_mpc": int(distance_mpc),
            "snr": round(snr, 1),
            "far_per_year": round(far, 4),
            "area_90_sq_deg": int(area_90),
            "instruments": ["H1", "L1", "V1"] if snr > 20 else ["H1", "L1"]
        }

    def compute_anomaly_score(self, gw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Compute interest score for GW event"""
        score = 0.0
        triggers = []
        severity = "low"
        
        snr = gw_data["snr"]
        dist = gw_data["distance_mpc"]
        subtype = gw_data["subtype"]
        
        # SNR Score
        if snr > 25:
            score += 0.4
            triggers.append(f"High SNR ({snr})")
        elif snr > 15:
            score += 0.2
            
        # Distance (Closer is bigger news)
        if dist < 100:
            score += 0.3
            triggers.append(f"Close proximity ({dist} Mpc)")
            severity = "high"
        elif dist < 500:
            score += 0.1
            
        # Type interest (BNS produces light/radio, so high fusion potential)
        if subtype == "BNS":
            score += 0.25
            triggers.append("Binary Neutron Star Merger")
            severity = "critical"
        elif subtype == "NSBH":
            score += 0.15
            triggers.append("NS-BH Merger")
            
        # Cap score
        score = min(1.0, score)
        
        return {
            "score": round(score, 2),
            "triggers": triggers,
            "severity": severity
        }

gw_ingester = GWIngester()

def generate_gw_event(db: Session, force: bool = False) -> Optional[Event]:
    """Generate a random GW event (Rare: ~1% chance per tick normally)"""
    if not force and random.random() > 0.02: # 2% chance per check if not forced
        return None
        
    gw_data = gw_ingester.generate_synthetic_gw()
    anomaly = gw_ingester.compute_anomaly_score(gw_data)
    
    # Random sky position
    ra = random.uniform(0, 360)
    dec = random.uniform(-90, 90)
    
    event = Event(
        event_type="gw",
        timestamp=datetime.utcnow(),
        ra=ra,
        dec=dec,
        data={
            **gw_data,
            "anomaly_triggers": anomaly["triggers"],
            "severity": anomaly["severity"]
        },
        confidence=anomaly["score"],
        source="LIGO_VIRGO_SYNTHETIC"
    )
    
    db.add(event)
    db.commit()
    return event
