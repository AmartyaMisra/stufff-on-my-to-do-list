"""
Event Fusion Engine - Phase 4
Correlates events across multiple channels using time and sky position.

Fusion Logic:
1. Time overlap: Events within Δt window
2. Sky overlap: Events within angular separation
3. Channel credibility: Different channel types add to confidence
4. Synergy: Multiple correlations compound the score

The fusion engine answers: "Is this noise, or is the universe shouting?"
"""
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import math

from database.models import Event, FusedEvent


class FusionEngine:
    """
    Correlates events across channels to identify multi-messenger signals.
    """
    
    # Configuration
    TIME_WINDOW_SECONDS = 300  # 5 minute correlation window
    SKY_SEPARATION_DEGREES = 5.0  # Angular separation threshold
    MIN_CHANNELS_FOR_FUSION = 2  # Minimum different channels to fuse
    
    # Channel weights (credibility scores)
    CHANNEL_WEIGHTS = {
        "frb": 0.8,           # FRBs are well-localized
        "gw": 0.9,            # GW detections are rare and significant
        "neutrino": 0.85,     # Neutrinos indicate high-energy events
        "spaceweather": 0.5,  # Space weather is common
        "lightcurve": 0.6,    # Light curves need context
        "tle": 0.3,           # TLE anomalies are usually spacecraft issues
    }
    
    def __init__(self):
        self.fusion_cache = {}
    
    def angular_separation(
        self, 
        ra1: float, dec1: float, 
        ra2: float, dec2: float
    ) -> float:
        """
        Calculate angular separation between two sky positions in degrees.
        Uses the Haversine formula adapted for celestial coordinates.
        """
        # Convert to radians
        ra1_rad = math.radians(ra1)
        dec1_rad = math.radians(dec1)
        ra2_rad = math.radians(ra2)
        dec2_rad = math.radians(dec2)
        
        # Haversine formula
        d_ra = ra2_rad - ra1_rad
        d_dec = dec2_rad - dec1_rad
        
        a = (math.sin(d_dec / 2) ** 2 + 
             math.cos(dec1_rad) * math.cos(dec2_rad) * 
             math.sin(d_ra / 2) ** 2)
        c = 2 * math.asin(math.sqrt(a))
        
        # Convert back to degrees
        return math.degrees(c)
    
    def time_overlap(self, t1: datetime, t2: datetime) -> Tuple[bool, float]:
        """
        Check if two events are within the time window.
        Returns (overlap, delta_seconds).
        """
        delta = abs((t1 - t2).total_seconds())
        return delta <= self.TIME_WINDOW_SECONDS, delta
    
    def sky_overlap(
        self, 
        event1: Event, 
        event2: Event
    ) -> Tuple[bool, float]:
        """
        Check if two events are within the sky separation threshold.
        Returns (overlap, separation_degrees).
        """
        if event1.ra is None or event1.dec is None:
            return False, 999
        if event2.ra is None or event2.dec is None:
            return False, 999
        
        separation = self.angular_separation(
            event1.ra, event1.dec, 
            event2.ra, event2.dec
        )
        return separation <= self.SKY_SEPARATION_DEGREES, separation
    
    def compute_fusion_score(
        self,
        events: List[Event],
        time_deltas: List[float],
        sky_separations: List[float]
    ) -> Dict[str, Any]:
        """
        Compute fusion confidence using Master Prompt multiplicative formula:
        Score = Weight * TimeOverlap * SkyOverlap * SignalStrength
        """
        if len(events) < self.MIN_CHANNELS_FOR_FUSION:
            return {"fused": False, "confidence": 0.0}
        
        # 1. Channel Weight (Credibility)
        # Average weight of involved channels
        avg_weight = sum(
            self.CHANNEL_WEIGHTS.get(e.event_type, 0.5) for e in events
        ) / len(events)
        
        # 2. Temporal Overlap
        # Closer time = higher score
        time_factor = 1.0
        if time_deltas:
            avg_dt = sum(time_deltas) / len(time_deltas)
            # Linear decay from 1.0 to 0.0 over window
            time_factor = max(0.0, 1.0 - (avg_dt / self.TIME_WINDOW_SECONDS))
        
        # 3. Spatial Overlap
        sky_factor = 1.0
        if sky_separations:
            avg_sep = min(sky_separations) # Use min separation (tightest pair)
            # Linear decay from 1.0 to 0.0 over separation threshold
            sky_factor = max(0.0, 1.0 - (avg_sep / self.SKY_SEPARATION_DEGREES))
        else:
            # Handle Global Events (Space Weather, Neutrinos without localization)
            # If any event is global (no RA/DEC), it technically "overlaps" the sky
            has_global = any(e.ra is None for e in events)
            sky_factor = 0.9 if has_global else 0.5 # Neutral penalty if just missing data

        # 4. Signal Strength
        # Average confidence of component events
        avg_signal = sum(e.confidence for e in events) / len(events)
        
        # Multiplicative Formula
        raw_score = avg_weight * time_factor * sky_factor * avg_signal
        
        # Synergy Boost (reward N>2 channels)
        n_channels = len(set(e.event_type for e in events))
        synergy_mult = 1.0 + (max(0, n_channels - 2) * 0.15)
        
        final_score = min(1.0, raw_score * synergy_mult)
        
        # Evidence Narrative ("Why fusion happened")
        evidence = []
        for e in events:
            ev_str = f"{e.event_type.upper()}"
            if e.data and e.data.get("anomaly_triggers"):
                ev_str += f" ({e.data['anomaly_triggers'][0]})"
            evidence.append(ev_str)
            
        if time_deltas:
            evidence.append(f"Δt={min(time_deltas):.1f}s")
        if sky_separations:
            evidence.append(f"Sky sep: {min(sky_separations):.1f}°")
        evidence.append(f"Factors: T={time_factor:.1f} S={sky_factor:.1f} W={avg_weight:.1f}")

        # Determine Confidence Level
        if final_score >= 0.75:
            confidence_level = "HIGH"
        elif final_score >= 0.5:
            confidence_level = "MEDIUM"
        else:
            confidence_level = "LOW"
            
        return {
            "fused": final_score >= 0.3, # Lower threshold for detection
            "confidence": round(final_score, 2),
            "confidence_level": confidence_level,
            "n_channels": n_channels,
            "channels": list(set(e.event_type for e in events)),
            "evidence": evidence
        }
    
    def find_correlations(
        self,
        db: Session,
        time_window_minutes: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Find all correlated event groups in recent data.
        """
        cutoff = datetime.utcnow() - timedelta(minutes=time_window_minutes)
        
        # Get recent events
        events = db.query(Event).filter(
            Event.timestamp >= cutoff
        ).order_by(Event.timestamp.desc()).all()
        
        if len(events) < 2:
            return []
        
        # Find correlation groups
        correlated_groups = []
        processed = set()
        
        for i, event1 in enumerate(events):
            if event1.id in processed:
                continue
            
            group = [event1]
            time_deltas = []
            sky_separations = []
            
            for j, event2 in enumerate(events):
                if i == j or event2.id in processed:
                    continue
                
                # Check time overlap
                time_ok, delta_t = self.time_overlap(event1.timestamp, event2.timestamp)
                if not time_ok:
                    continue
                
                # Check sky overlap (if both have coordinates)
                sky_ok, separation = self.sky_overlap(event1, event2)
                
                # If same channel, require sky overlap
                if event1.event_type == event2.event_type:
                    if not sky_ok:
                        continue
                
                # Add to group
                group.append(event2)
                time_deltas.append(delta_t)
                if sky_ok:
                    sky_separations.append(separation)
            
            # Only consider groups with multiple channels
            channels = set(e.event_type for e in group)
            if len(channels) >= self.MIN_CHANNELS_FOR_FUSION:
                fusion_result = self.compute_fusion_score(
                    group, time_deltas, sky_separations
                )
                if fusion_result["fused"]:
                    correlated_groups.append({
                        "events": [e.id for e in group],
                        "fusion": fusion_result
                    })
                    for e in group:
                        processed.add(e.id)
        
        return correlated_groups
    
    def create_fused_event(
        self,
        db: Session,
        event_ids: List[int],
        fusion_result: Dict[str, Any]
    ) -> FusedEvent:
        """
        Create a FusedEvent record from correlated events.
        """
        events = db.query(Event).filter(Event.id.in_(event_ids)).all()
        
        # Compute centroid position
        valid_coords = [(e.ra, e.dec) for e in events if e.ra is not None and e.dec is not None]
        if valid_coords:
            avg_ra = sum(c[0] for c in valid_coords) / len(valid_coords)
            avg_dec = sum(c[1] for c in valid_coords) / len(valid_coords)
        else:
            avg_ra, avg_dec = None, None
        
        # Create description
        channels = ", ".join(fusion_result["channels"])
        description = (
            f"Multi-channel correlation detected across {channels}. "
            f"Evidence: {'; '.join(fusion_result['evidence'])}"
        )
        
        fused = FusedEvent(
            fused_timestamp=datetime.utcnow(),
            confidence=fusion_result["confidence"],
            description=description,
            ra=avg_ra,
            dec=avg_dec,
        )
        
        # Link component events
        fused.component_events = events
        
        db.add(fused)
        db.commit()
        db.refresh(fused)
        
        return fused


# Singleton instance
fusion_engine = FusionEngine()


def run_fusion_analysis(db: Session) -> Dict[str, Any]:
    """
    Run fusion analysis on recent events.
    Returns summary of findings.
    """
    correlations = fusion_engine.find_correlations(db)
    
    created_fusions = []
    for corr in correlations:
        # Check if we already have this fusion
        existing = db.query(FusedEvent).filter(
            FusedEvent.fused_timestamp >= datetime.utcnow() - timedelta(minutes=5)
        ).first()
        
        if not existing:
            fused = fusion_engine.create_fused_event(
                db,
                corr["events"],
                corr["fusion"]
            )
            created_fusions.append({
                "id": fused.id,
                "confidence": fused.confidence,
                "description": fused.description
            })
    
    return {
        "correlations_found": len(correlations),
        "fusions_created": len(created_fusions),
        "fusions": created_fusions,
        "timestamp": datetime.utcnow().isoformat()
    }


def get_latest_fusion(db: Session) -> Optional[Dict[str, Any]]:
    """Get the most recent fusion event"""
    fused = db.query(FusedEvent).order_by(
        FusedEvent.fused_timestamp.desc()
    ).first()
    
    if not fused:
        return None
    
    return {
        "id": fused.id,
        "timestamp": fused.fused_timestamp.isoformat(),
        "confidence": fused.confidence,
        "description": fused.description,
        "ra": fused.ra,
        "dec": fused.dec,
        "component_count": len(fused.component_events) if fused.component_events else 0
    }
