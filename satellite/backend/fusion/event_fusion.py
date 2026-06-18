from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
import math

from database.models import Event, FusedEvent
from config import settings


def angular_separation(ra1: float, dec1: float, ra2: float, dec2: float) -> float:
    """
    Calculate angular separation between two points on the sky in arcminutes
    
    Uses the haversine formula for spherical distance
    """
    if ra1 is None or dec1 is None or ra2 is None or dec2 is None:
        return float('inf')
    
    # Convert to radians
    ra1_rad = math.radians(ra1)
    dec1_rad = math.radians(dec1)
    ra2_rad = math.radians(ra2)
    dec2_rad = math.radians(dec2)
    
    # Haversine formula
    d_ra = ra2_rad - ra1_rad
    d_dec = dec2_rad - dec1_rad
    
    a = math.sin(d_dec / 2)**2 + math.cos(dec1_rad) * math.cos(dec2_rad) * math.sin(d_ra / 2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Convert to arcminutes
    separation_arcmin = math.degrees(c) * 60.0
    
    return separation_arcmin


def fuse_events(start_time: datetime, end_time: datetime, db: Session) -> List[FusedEvent]:
    """
    Fuse events from multiple sources that are temporally and spatially correlated
    
    Looks for events that:
    1. Occur within the fusion_time_window_seconds
    2. Are spatially close (within fusion_spatial_threshold_arcmin)
    3. Have sufficient confidence
    """
    # Get all events in the time window
    events = db.query(Event).filter(
        Event.timestamp >= start_time,
        Event.timestamp <= end_time,
        Event.confidence >= settings.fusion_min_confidence
    ).order_by(Event.timestamp).all()
    
    if len(events) < 2:
        return []
    
    fused_events = []
    processed_event_ids = set()
    
    # Group events by time windows
    time_window = timedelta(seconds=settings.fusion_time_window_seconds)
    
    i = 0
    while i < len(events):
        if events[i].id in processed_event_ids:
            i += 1
            continue
        
        # Find events in the same time window
        window_start = events[i].timestamp
        window_end = window_start + time_window
        
        window_events = [events[i]]
        j = i + 1
        
        while j < len(events) and events[j].timestamp <= window_end:
            if events[j].id not in processed_event_ids:
                window_events.append(events[j])
            j += 1
        
        # If we have multiple events, check for spatial correlation
        if len(window_events) >= 2:
            # Group by spatial proximity
            groups = []
            for event in window_events:
                added_to_group = False
                for group in groups:
                    # Check if event is close to any event in the group
                    for group_event in group:
                        sep = angular_separation(
                            event.ra, event.dec,
                            group_event.ra, group_event.dec
                        )
                        if sep <= settings.fusion_spatial_threshold_arcmin:
                            group.append(event)
                            added_to_group = True
                            break
                    if added_to_group:
                        break
                
                if not added_to_group:
                    groups.append([event])
            
            # Create fused events for groups with multiple events
            for group in groups:
                if len(group) >= 2:
                    # Calculate fused properties
                    avg_confidence = sum(e.confidence for e in group) / len(group)
                    
                    # Calculate weighted average position
                    valid_positions = [(e.ra, e.dec) for e in group if e.ra is not None and e.dec is not None]
                    if valid_positions:
                        avg_ra = sum(ra for ra, dec in valid_positions) / len(valid_positions)
                        avg_dec = sum(dec for ra, dec in valid_positions) / len(valid_positions)
                    else:
                        avg_ra = avg_dec = None
                    
                    # Create description
                    event_types = [e.event_type for e in group]
                    type_counts = {}
                    for et in event_types:
                        type_counts[et] = type_counts.get(et, 0) + 1
                    description = f"Fused event combining {len(group)} events: " + ", ".join(
                        f"{count} {et}" for et, count in type_counts.items()
                    )
                    
                    # Create fused event
                    fused_event = FusedEvent(
                        fused_timestamp=group[0].timestamp,
                        confidence=avg_confidence,
                        description=description,
                        ra=avg_ra,
                        dec=avg_dec
                    )
                    db.add(fused_event)
                    db.flush()
                    
                    # Link component events
                    for event in group:
                        fused_event.component_events.append(event)
                        processed_event_ids.add(event.id)
                    
                    db.commit()
                    db.refresh(fused_event)
                    fused_events.append(fused_event)
        
        i += 1
    
    return fused_events

