from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import asyncio

from database.models import get_db, Event, AnomalyDetection, FusedEvent, init_db
from detection import (
    radio_detector,
    lightcurve_detector,
    spaceweather_detector,
    gw_detector,
    neutrino_detector,
    neutrino_detector,
    tle_detector,
    seti_classifier # Import SETI classifier
)
from detection.seti_classifier import classify_signal # Explicit import
from fusion.event_fusion import fuse_events
from threat_engine import compute_threat_state, generate_synthetic_heartbeat, cleanup_expired_synthetic
from noaa_ingester import poll_noaa_data, noaa_ingester
from frb_generator import generate_frb_event, get_frb_statistics, frb_generator
from gw_ingester import generate_gw_event
from fusion_engine import run_fusion_analysis, get_latest_fusion, fusion_engine
from pydantic import BaseModel

# Initialize database on startup
init_db()

app = FastAPI(
    title="Space Anomaly Radar API",
    description="API for detecting and analyzing space anomalies",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EventResponse(BaseModel):
    id: int
    event_type: str
    timestamp: datetime
    ra: Optional[float]
    dec: Optional[float]
    data: dict
    confidence: float

    class Config:
        from_attributes = True


class AnomalyResponse(BaseModel):
    id: int
    event_id: int
    anomaly_type: str
    severity: str
    detected_at: datetime
    details: dict

    class Config:
        from_attributes = True


class FusedEventResponse(BaseModel):
    id: int
    component_events: List[int]
    fused_timestamp: datetime
    confidence: float
    description: str

    class Config:
        from_attributes = True


@app.get("/")
async def root():
    return {"message": "Space Anomaly Radar API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}


@app.get("/events", response_model=List[EventResponse])
async def get_events(
    event_type: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get events with optional filtering"""
    query = db.query(Event)
    
    if event_type:
        query = query.filter(Event.event_type == event_type)
    if start_time:
        query = query.filter(Event.timestamp >= start_time)
    if end_time:
        query = query.filter(Event.timestamp <= end_time)
    
    events = query.order_by(Event.timestamp.desc()).limit(limit).all()
    return events


@app.get("/events/{event_id}", response_model=EventResponse)
async def get_event(event_id: int, db: Session = Depends(get_db)):
    """Get a specific event by ID"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@app.get("/anomalies", response_model=List[AnomalyResponse])
async def get_anomalies(
    severity: Optional[str] = None,
    start_time: Optional[datetime] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get detected anomalies"""
    query = db.query(AnomalyDetection)
    
    if severity:
        query = query.filter(AnomalyDetection.severity == severity)
    if start_time:
        query = query.filter(AnomalyDetection.detected_at >= start_time)
    
    anomalies = query.order_by(AnomalyDetection.detected_at.desc()).limit(limit).all()
    return anomalies


@app.get("/fused-events", response_model=List[FusedEventResponse])
async def get_fused_events(
    start_time: Optional[datetime] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get fused events (correlated across multiple sources)"""
    query = db.query(FusedEvent)
    
    if start_time:
        query = query.filter(FusedEvent.fused_timestamp >= start_time)
    
    fused_events = query.order_by(FusedEvent.fused_timestamp.desc()).limit(limit).all()
    return fused_events


@app.post("/events/{event_id}/detect")
async def detect_anomalies(event_id: int, db: Session = Depends(get_db)):
    """Trigger anomaly detection for a specific event"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Route to appropriate detector based on event type
    detectors = {
        "frb": radio_detector,
        "lightcurve": lightcurve_detector,
        "spaceweather": spaceweather_detector,
        "gw": gw_detector,
        "neutrino": neutrino_detector,
        "tle": tle_detector
    }
    
    detector = detectors.get(event.event_type)
    if not detector:
        raise HTTPException(status_code=400, detail=f"Unknown event type: {event.event_type}")
    
    anomaly = detector.detect(event, db)
    return {"anomaly_id": anomaly.id, "severity": anomaly.severity}


@app.post("/fusion/run")
async def run_fusion(
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """Run event fusion on events in a time window"""
    if not start_time:
        start_time = datetime.utcnow() - timedelta(hours=24)
    if not end_time:
        end_time = datetime.utcnow()
    
    fused_events = fuse_events(start_time, end_time, db)
    return {"fused_count": len(fused_events), "fused_events": fused_events}


@app.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    """Get system statistics"""
    total_events = db.query(Event).count()
    total_anomalies = db.query(AnomalyDetection).count()
    total_fused = db.query(FusedEvent).count()
    
    event_types = db.query(Event.event_type).distinct().all()
    event_type_counts = {}
    for event_type, in event_types:
        event_type_counts[event_type] = db.query(Event).filter(Event.event_type == event_type).count()
    
    return {
        "total_events": total_events,
        "total_anomalies": total_anomalies,
        "total_fused_events": total_fused,
        "event_type_counts": event_type_counts,
        "timestamp": datetime.utcnow()
    }


# ============ PHASE 1: Threat State Engine ============

@app.get("/api/status")
async def get_system_status(db: Session = Depends(get_db)):
    """
    Get current threat state.
    States: QUIET → LOCAL → MULTI → HIGH_CONFIDENCE
    """
    return compute_threat_state(db)


@app.post("/api/heartbeat")
async def trigger_heartbeat(db: Session = Depends(get_db)):
    """
    Generate a synthetic heartbeat event.
    For scenario mode: Forces escalation sequence.
    Triggers fusion analysis immediately if events were generated.
    """
    result = generate_synthetic_heartbeat(db)
    
    # If events were generated, run fusion analysis immediately to update alerts
    if result.get("generated"):
        # We don't return fusion result here (expensive), but it populates DB
        run_fusion_analysis(db)
        
    return result


@app.post("/api/cleanup")
async def cleanup_synthetic_events(db: Session = Depends(get_db)):
    """
    Remove expired synthetic events (older than 2 minutes).
    """
    deleted = cleanup_expired_synthetic(db)
    return {"deleted": deleted, "timestamp": datetime.utcnow()}


@app.get("/api/channels")
async def get_active_channels(db: Session = Depends(get_db)):
    """Get list of all active data channels and their status"""
    channels = {
        "frb": {"name": "Fast Radio Bursts", "source": "CHIME/FRB", "status": "active"},
        "spaceweather": {"name": "Space Weather", "source": "NOAA SWPC", "status": "active"},
        "lightcurve": {"name": "Lightcurves", "source": "TESS/Gaia", "status": "standby"},
        "gw": {"name": "Gravitational Waves", "source": "LIGO/Virgo", "status": "standby"},
        "neutrino": {"name": "Neutrinos", "source": "IceCube", "status": "standby"},
        "tle": {"name": "Satellite TLEs", "source": "CelesTrak", "status": "standby"}
    }
    
    # Count events per channel in last hour
    cutoff = datetime.utcnow() - timedelta(hours=1)
    for channel_id in channels:
        count = db.query(Event).filter(
            Event.event_type == channel_id,
            Event.timestamp >= cutoff
        ).count()
        channels[channel_id]["event_count_1h"] = count
        if count > 0:
            channels[channel_id]["status"] = "active"
    
    return {"channels": channels, "timestamp": datetime.utcnow()}


# ============ PHASE 2: NOAA Space Weather ============

@app.post("/api/noaa/poll")
async def poll_noaa(db: Session = Depends(get_db)):
    """
    Manually trigger NOAA space weather data poll.
    In production, this runs automatically every 60 seconds.
    """
    event = await poll_noaa_data(db)
    if event:
        return {
            "success": True,
            "event_id": event.id,
            "confidence": event.confidence,
            "data": event.data
        }
    return {"success": False, "message": "Failed to fetch NOAA data"}


@app.get("/api/spaceweather/latest")
async def get_latest_spaceweather(db: Session = Depends(get_db)):
    """Get the most recent space weather data"""
    latest = db.query(Event).filter(
        Event.event_type == "spaceweather"
    ).order_by(Event.timestamp.desc()).first()
    
    if not latest:
        return {
            "available": False,
            "message": "No space weather data available"
        }
    
    return {
        "available": True,
        "timestamp": latest.timestamp.isoformat(),
        "confidence": latest.confidence,
        "solar_wind_speed": latest.data.get("solar_wind_speed"),
        "solar_wind_density": latest.data.get("solar_wind_density"),
        "bz_gsm": latest.data.get("bz_gsm"),
        "bt": latest.data.get("bt"),
        "proton_flux": latest.data.get("proton_flux"),
        "anomaly_triggers": latest.data.get("anomaly_triggers", []),
        "severity": latest.data.get("severity", "low")
    }


@app.get("/api/spaceweather/history")
async def get_spaceweather_history(
    hours: int = 24,
    db: Session = Depends(get_db)
):
    """Get space weather history for charting"""
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    events = db.query(Event).filter(
        Event.event_type == "spaceweather",
        Event.timestamp >= cutoff
    ).order_by(Event.timestamp.asc()).all()
    
    history = []
    for e in events:
        history.append({
            "timestamp": e.timestamp.isoformat(),
            "solar_wind_speed": e.data.get("solar_wind_speed"),
            "bz_gsm": e.data.get("bz_gsm"),
            "proton_flux": e.data.get("proton_flux"),
            "confidence": e.confidence
        })
    
    return {"history": history, "count": len(history)}


# ============ PHASE 3: FRB Channel ============

@app.post("/api/frb/generate")
async def generate_frb(
    force: bool = False,
    db: Session = Depends(get_db)
):
    """
    Generate an FRB event if conditions are met.
    Set force=true to force generation regardless of probability.
    """
    event = generate_frb_event(db, force=force)
    if event:
        return {
            "success": True,
            "event_id": event.id,
            "source_name": event.data.get("source_name"),
            "snr": event.data.get("snr"),
            "dm": event.data.get("dm"),
            "confidence": event.confidence,
            "ra": event.ra,
            "dec": event.dec
        }
    return {"success": False, "message": "No FRB generated (probability check failed)"}


@app.get("/api/frb/stats")
async def get_frb_stats(db: Session = Depends(get_db)):
    """Get FRB detection statistics"""
    return get_frb_statistics(db)


@app.get("/api/frb/latest")
async def get_latest_frb(db: Session = Depends(get_db)):
    """Get the most recent FRB detection"""
    latest = db.query(Event).filter(
        Event.event_type == "frb"
    ).order_by(Event.timestamp.desc()).first()
    
    if not latest:
        return {"available": False}
    
    return {
        "available": True,
        "id": latest.id,
        "timestamp": latest.timestamp.isoformat(),
        "source_name": latest.data.get("source_name"),
        "ra": latest.ra,
        "dec": latest.dec,
        "dm": latest.data.get("dm"),
        "snr": latest.data.get("snr"),
        "width_ms": latest.data.get("width_ms"),
        "confidence": latest.confidence,
        "is_repeater": latest.data.get("is_repeater", False),
        "anomaly_triggers": latest.data.get("anomaly_triggers", [])
    }


# ============ PHASE 4: Fusion Engine ============

@app.post("/api/fusion/analyze")
async def analyze_fusion(db: Session = Depends(get_db)):
    """
    Run fusion analysis on recent events.
    Looks for correlations across channels.
    """
    return run_fusion_analysis(db)


@app.get("/api/fusion/latest")
async def get_fusion_latest(db: Session = Depends(get_db)):
    """Get the most recent fused event"""
    result = get_latest_fusion(db)
    if result:
        return {"available": True, **result}
    return {"available": False}


@app.get("/api/fusion/all")
async def get_all_fusions(
    hours: int = 24,
    db: Session = Depends(get_db)
):
    """Get all fused events in time window"""
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    fusions = db.query(FusedEvent).filter(
        FusedEvent.fused_timestamp >= cutoff
    ).order_by(FusedEvent.fused_timestamp.desc()).all()
    
    return {
        "count": len(fusions),
        "fusions": [{
            "id": f.id,
            "timestamp": f.fused_timestamp.isoformat(),
            "confidence": f.confidence,
            "description": f.description,
            "ra": f.ra,
            "dec": f.dec
        } for f in fusions]
    }


# ============ PHASE 5: Background Tasks & Polling ============

@app.post("/api/tick")
async def system_tick(db: Session = Depends(get_db)):
    """
    Main system tick - runs all periodic tasks:
    1. Poll NOAA LIVE solar wind (real data)
    2. Track ISS position (real data)
    3. Generate FRB if probability allows
    4. Run fusion analysis
    5. Cleanup expired synthetic events
    6. Compute threat state
    
    Call this every 30-60 seconds from frontend or cron.
    """
    results = {
        "timestamp": datetime.utcnow().isoformat(),
        "noaa_live": None,
        "iss": None,
        "radio_monitor": None,  # NEW: Radio listening channel
        "frb": None,
        "fusion": None,
        "cleanup": 0,
        "threat_state": None
    }
    
    # 1. Poll NOAA LIVE (real solar wind data)
    try:
        from ingestion.noaa_live import poll_noaa_live
        noaa_event = poll_noaa_live(db)
        if noaa_event:
            results["noaa_live"] = {
                "event_id": noaa_event.id,
                "triggers": noaa_event.data.get("anomaly_triggers", []),
                "wind_speed": noaa_event.data.get("solar_wind_speed"),
                "bz_gsm": noaa_event.data.get("bz_gsm")
            }
    except Exception as e:
        results["noaa_live"] = {"error": str(e)}
    
    # 2. Track ISS (real position)
    try:
        from ingestion.iss_tracker import track_iss
        iss_event = track_iss(db)
        if iss_event:
            results["iss"] = {
                "event_id": iss_event.id,
                "latitude": iss_event.data.get("latitude"),
                "longitude": iss_event.data.get("longitude"),
                "ra": iss_event.ra,
                "dec": iss_event.dec
            }
    except Exception as e:
        results["iss"] = {"error": str(e)}
    
    try:
        from ingestion.radio_monitor import poll_radio_monitor
        radio_event = poll_radio_monitor(db)
        if radio_event:
            # AUTO-CLASSIFY: Check for alien traits immediately
            classify_signal(radio_event, db)
            
            results["radio_monitor"] = {
                "event_id": radio_event.id,
                "frequency_mhz": radio_event.data.get("frequency_mhz"),
                "anomaly_type": radio_event.data.get("anomaly_type"),
                "classification": radio_event.data.get("classification"),
                "confidence": radio_event.confidence
            }
    except Exception as e:
        results["radio_monitor"] = {"error": str(e)}
    
    # 3. Generate FRB (probabilistic)
    try:
        frb_event = generate_frb_event(db)
        if frb_event:
            # AUTO-CLASSIFY: Check for artificial traits
            classify_signal(frb_event, db)
            
            results["frb"] = {
                "event_id": frb_event.id,
                "source_name": frb_event.data.get("source_name"),
                "confidence": frb_event.confidence
            }
    except Exception as e:
        results["frb"] = {"error": str(e)}
    
    # 4. Generate GW (probabilistic)
    try:
        gw_event = generate_gw_event(db)
        if gw_event:
            results["gw"] = {
                "event_id": gw_event.id,
                "subtype": gw_event.data.get("subtype"),
                "confidence": gw_event.confidence
            }
    except Exception as e:
        results["gw"] = {"error": str(e)}

    # 5. Run fusion analysis
    try:
        fusion_result = run_fusion_analysis(db)
        results["fusion"] = fusion_result
    except Exception as e:
        results["fusion"] = {"error": str(e)}
    
    # 6. Cleanup expired synthetic
    try:
        results["cleanup"] = cleanup_expired_synthetic(db)
    except Exception as e:
        pass
    
    # 7. Check for SILENCE (negative-space anomalies)
    try:
        from detection.silence_detector import check_for_silence
        silence_events = check_for_silence(db)
        if silence_events:
            results["silence"] = {
                "count": len(silence_events),
                "events": [{"id": e.id, "type": e.data.get("silence_type")} for e in silence_events]
            }
    except Exception as e:
        results["silence"] = {"error": str(e)}
    
    # 8. Compute threat state  
    try:
        results["threat_state"] = compute_threat_state(db)
    except Exception as e:
        results["threat_state"] = {"error": str(e)}
    
    return results


@app.post("/api/gw/generate")
async def generate_gw_manual(
    force: bool = False,
    db: Session = Depends(get_db)
):
    """Generate a Gravitational Wave event manually"""
    event = generate_gw_event(db, force=force)
    if event:
        return {"success": True, "event_id": event.id, "data": event.data}
    return {"success": False, "message": "No GW generated"}


@app.post("/api/scenario/wow_signal")
async def trigger_wow_signal(db: Session = Depends(get_db)):
    """
    SCENARIO: FORCE 'WOW SIGNAL' (First Contact Candidate).
    Generates a high-confidence artificial signal on 1420 MHz (Hydrogen Line).
    """
    from database.models import Event, SignalClassification
    
    # 1. Create the Event
    event = Event(
        event_type="radio_monitor",
        timestamp=datetime.utcnow(),
        data={
            "source": "SETI_ARRAY_VLA",
            "frequency_mhz": 1420.405, # Hydrogen line
            "frequency_name": "HI Line (1420 MHz)",
            "anomaly_type": "narrowband_carrier",
            "anomaly_triggers": [
                "Strong narrowband signal (BW < 1Hz)",
                "30-sigma detection",
                "Linear Doppler drift (-0.5 Hz/s)"
            ],
            "classification": "ARTIFICIAL_CANDIDATE",
            "bandwidth_hz": 0.8,
            "doppler_drift_hz_per_s": -0.5,
            "repetition_period_s": None
        },
        confidence=0.98,
        source="SETI_SCENARIO"
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    
    # 2. Create the Signal Classification (Alien)
    sig_class = SignalClassification(
        event_id=event.id,
        classification="artificial_candidate",
        confidence=0.98,
        confidence_lower=0.95,
        confidence_upper=0.99,
        narrowband_score=0.99,
        repetition_score=0.0,
        doppler_drift_score=0.95,
        bandwidth_hz=0.8,
        doppler_drift_hz_per_s=-0.5,
        alternative_explanations=[
            "Extraterrestrial Intelligence (ETI) Beacon",
            "Secret military satellite (highly unlikely orbit)",
            "Unknown coherent astrophysical source"
        ],
        analyzed_at=datetime.utcnow()
    )
    db.add(sig_class)
    db.commit()
    
    # 3. Trigger immediate Threat Level escalation
    from threat_engine import compute_threat_state
    compute_threat_state(db)
    
    return {
        "success": True, 
        "event_id": event.id, 
        "message": "WOW SIGNAL GENERATED - CHECK RADAR!"
    }


# ============ SIGNAL INTELLIGENCE EXTENSIONS ============

@app.post("/api/signals/classify/{event_id}")
async def classify_signal_event(event_id: int, db: Session = Depends(get_db)):
    """
    Analyze an event for artificial signal traits using SETI heuristics.
    
    Returns classification: natural, artificial_candidate, known_transmitter, or unclassified
    """
    from detection.seti_classifier import classify_signal
    
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Run SETI classification
    sig_class = classify_signal(event, db)
    
    # Save to database
    db.add(sig_class)
    db.commit()
    db.refresh(sig_class)
    
    return {
        "event_id": event_id,
        "classification": sig_class.classification,
        "confidence": sig_class.confidence,
        "confidence_bounds": [sig_class.confidence_lower, sig_class.confidence_upper],
        "trait_scores": {
            "narrowband": sig_class.narrowband_score,
            "repetition": sig_class.repetition_score,
            "doppler_drift": sig_class.doppler_drift_score
        },
        "alternative_explanations": sig_class.alternative_explanations,
        "analyzed_at": sig_class.analyzed_at.isoformat()
    }


@app.get("/api/signals/classification/{event_id}")
async def get_signal_classification(event_id: int, db: Session = Depends(get_db)):
    """Get existing signal classification for an event"""
    from database.models import SignalClassification
    
    sig_class = db.query(SignalClassification).filter(
        SignalClassification.event_id == event_id
    ).first()
    
    if not sig_class:
        raise HTTPException(status_code=404, detail="No classification found for this event")
    
    return {
        "event_id": event_id,
        "classification": sig_class.classification,
        "confidence": sig_class.confidence,
        "confidence_bounds": [sig_class.confidence_lower, sig_class.confidence_upper],
        "trait_scores": {
            "narrowband": sig_class.narrowband_score,
            "repetition": sig_class.repetition_score,
            "doppler_drift": sig_class.doppler_drift_score
        },
        "measurements": {
            "bandwidth_hz": sig_class.bandwidth_hz,
            "repetition_period_s": sig_class.repetition_period_s,
            "doppler_drift_hz_per_s": sig_class.doppler_drift_hz_per_s
        },
        "alternative_explanations": sig_class.alternative_explanations,
        "analyzed_at": sig_class.analyzed_at.isoformat()
    }


@app.post("/api/transmitters/update")
async def update_transmitter_catalog_api(db: Session = Depends(get_db)):
    """
    Update known transmitter catalog from CelesTrak.
    Fetches latest TLE data for ISS, satellites, and CubeSats.
    """
    from ingestion.tle_tracker import update_transmitter_catalog
    
    stats = update_transmitter_catalog(db)
    return {
        "success": True,
        "updated": stats['updated'],
        "added": stats['added'],
        "errors": stats['errors'],
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/transmitters/known")
async def list_known_transmitters(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get list of known transmitters"""
    from database.models import KnownTransmitter
    
    query = db.query(KnownTransmitter)
    if active_only:
        query = query.filter(KnownTransmitter.is_active == True)
    
    transmitters = query.limit(50).all()
    
    return {
        "count": len(transmitters),
        "transmitters": [{
            "id": tx.id,
            "name": tx.name,
            "catalog_id": tx.catalog_id,
            "type": tx.transmitter_type,
            "frequencies_mhz": tx.frequencies_mhz,
            "tle_epoch": tx.tle_epoch.isoformat() if tx.tle_epoch else None,
            "is_active": tx.is_active
        } for tx in transmitters]
    }


@app.get("/api/quiet-zones/violations")
async def get_quiet_zone_violations(
    hours: int = 24,
    db: Session = Depends(get_db)
):
    """
    Get recent quiet zone violations (emissions in protected radio astronomy bands)
    """
    from detection.quiet_zone_monitor import check_quiet_zone_violation
    
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    recent_events = db.query(Event).filter(
        Event.timestamp >= cutoff
    ).order_by(Event.timestamp.desc()).all()
    
    violations = []
    for event in recent_events:
        violation = check_quiet_zone_violation(event, db)
        if violation:
            violations.append(violation)
    
    return {
        "count": len(violations),
        "violations": violations,
        "time_window_hours": hours
    }


@app.post("/api/quiet-zones/initialize")
async def initialize_quiet_zones_api(db: Session = Depends(get_db)):
    """Initialize protected frequency bands database"""
    from detection.quiet_zone_monitor import initialize_quiet_zones
    
    count = initialize_quiet_zones(db)
    return {
        "success": True,
        "bands_initialized": count,
        "message": "Protected frequency bands initialized" if count > 0 else "Bands already initialized"
    }


@app.get("/api/frb/profile/{event_id}")
async def profile_frb_event(event_id: int, db: Session = Depends(get_db)):
    """
    Profile an FRB as one-off, repeating, or periodic.
    Analyzes position matching and temporal patterns.
    """
    from frb_generator import classify_frb_type
    
    result = classify_frb_type(db, event_id)
    return result


@app.get("/api/frb/repeaters")
async def list_frb_repeaters(db: Session = Depends(get_db)):
    """
    List all known FRB repeater sources.
    Groups FRBs by sky position.
    """
    # Get all FRBs
    cutoff = datetime.utcnow() - timedelta(days=30)
    frbs = db.query(Event).filter(
        Event.event_type == "frb",
        Event.timestamp >= cutoff
    ).all()
    
    # Group by position (simple clustering)
    repeaters = {}
    position_tolerance = 1.0  # degrees
    
    for frb in frbs:
        ra, dec = frb.ra, frb.dec
        
        # Find existing cluster
        matched = False
        for key, cluster in repeaters.items():
            cluster_ra, cluster_dec = key
            if (abs(ra - cluster_ra) < position_tolerance and 
                abs(dec - cluster_dec) < position_tolerance):
                cluster['events'].append(frb)
                cluster['count'] += 1
                matched = True
                break
        
        if not matched:
            repeaters[(ra, dec)] = {
                'ra': ra,
                'dec': dec,
                'count': 1,
                'events': [frb],
                'source_name': frb.data.get('source_name', f'FRB_J{int(ra):04d}{int(dec):+03d}')
            }
    
    # Filter to only repeaters (2+ bursts)
    repeater_list = [
        {
            'source_name': info['source_name'],
            'ra': info['ra'],
            'dec': info['dec'],
            'burst_count': info['count'],
            'latest_burst': max(e.timestamp for e in info['events']).isoformat(),
            'first_burst': min(e.timestamp for e in info['events']).isoformat()
        }
        for info in repeaters.values() if info['count'] >= 2
    ]
    
    return {
        "repeater_count": len(repeater_list),
        "repeaters": repeater_list
    }

