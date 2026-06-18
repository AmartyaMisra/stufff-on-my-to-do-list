from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import json

from config import settings

Base = declarative_base()

# SQLite requires check_same_thread=False for async operations
connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, index=True)  # frb, lightcurve, spaceweather, gw, neutrino, tle
    timestamp = Column(DateTime, index=True, default=datetime.utcnow)
    ra = Column(Float, nullable=True)  # Right ascension in degrees
    dec = Column(Float, nullable=True)  # Declination in degrees
    data = Column(JSON)  # Event-specific data
    confidence = Column(Float, default=0.5)
    source = Column(String, nullable=True)
    
    anomalies = relationship("AnomalyDetection", back_populates="event")
    fused_events = relationship("FusedEvent", secondary="fused_event_components", back_populates="component_events")


class AnomalyDetection(Base):
    __tablename__ = "anomaly_detections"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), index=True)
    anomaly_type = Column(String, index=True)
    severity = Column(String, index=True)  # low, medium, high, critical
    detected_at = Column(DateTime, default=datetime.utcnow, index=True)
    details = Column(JSON)
    confidence_score = Column(Float)
    
    event = relationship("Event", back_populates="anomalies")


class FusedEvent(Base):
    __tablename__ = "fused_events"
    
    id = Column(Integer, primary_key=True, index=True)
    fused_timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    confidence = Column(Float)
    description = Column(Text)
    ra = Column(Float, nullable=True)
    dec = Column(Float, nullable=True)
    
    component_events = relationship("Event", secondary="fused_event_components", back_populates="fused_events")




# Association table for many-to-many relationship
from sqlalchemy import Table, Boolean

fused_event_components = Table(
    "fused_event_components",
    Base.metadata,
    Column("fused_event_id", Integer, ForeignKey("fused_events.id"), primary_key=True),
    Column("event_id", Integer, ForeignKey("events.id"), primary_key=True)
)


# ============ SIGNAL INTELLIGENCE EXTENSIONS ============

class SignalClassification(Base):
    """
    Stores artificial signal trait analysis for events.
    Enables SETI-style classification without modifying core Event table.
    """
    __tablename__ = "signal_classifications"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), index=True, unique=True)
    
    # Classification result
    classification = Column(String, index=True)  # natural, artificial_candidate, known_transmitter, unclassified
    confidence = Column(Float)  # 0-1
    confidence_lower = Column(Float)  # Lower bound of 95% CI
    confidence_upper = Column(Float)  # Upper bound of 95% CI
    
    # Signal trait scores (0-1)
    narrowband_score = Column(Float, default=0.0)
    repetition_score = Column(Float, default=0.0)
    doppler_drift_score = Column(Float, default=0.0)
    
    # Measured properties
    bandwidth_hz = Column(Float, nullable=True)
    repetition_period_s = Column(Float, nullable=True)
    doppler_drift_hz_per_s = Column(Float, nullable=True)
    
    # Uncertainty and explanations
    alternative_explanations = Column(JSON)  # List[str]
    analysis_metadata = Column(JSON)  # Additional context
    
    analyzed_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    event = relationship("Event", foreign_keys=[event_id])


class KnownTransmitter(Base):
    """
    Catalog of known human-made space transmitters.
    Used as baseline to identify unknown signals.
    """
    __tablename__ = "known_transmitters"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Identification
    name = Column(String, index=True)  # "ISS", "NOAA-18", "DSN Goldstone"
    catalog_id = Column(String, nullable=True, index=True)  # NORAD ID or other catalog number
    transmitter_type = Column(String, index=True)  # satellite, space_station, deep_space_probe, ground_station
    
    # Orbital elements (TLE-based for satellites)
    tle_line1 = Column(String, nullable=True)
    tle_line2 = Column(String, nullable=True)
    tle_epoch = Column(DateTime, nullable=True)
    
    # Transmission characteristics
    frequencies_mhz = Column(JSON)  # List of known transmission frequencies
    bandwidth_hz = Column(Float, nullable=True)
    modulation_type = Column(String, nullable=True)  # FM, PSK, QPSK, etc.
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    last_observed = Column(DateTime, nullable=True)
    
    # Metadata
    data_source = Column(String)  # "CelesTrak", "NASA", "Manual"
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class FrequencyBand(Base):
    """
    Protected radio frequency bands for astronomy.
    Used to detect quiet zone violations.
    """
    __tablename__ = "frequency_bands"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Band definition
    band_name = Column(String, index=True)  # "Hydrogen Line", "RAS Band 1"
    frequency_min_mhz = Column(Float, index=True)
    frequency_max_mhz = Column(Float, index=True)
    
    # Protection status
    is_protected = Column(Boolean, default=True, index=True)
    protection_regulation = Column(String, nullable=True)  # "ITU-R RA.769"
    
    # Scientific importance
    purpose = Column(Text)  # "H-I emission observation", "Continuum observation"
    severity_if_violated = Column(String, default="medium")  # low, medium, high, critical
    
    # Metadata
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SilenceAnomaly(Base):
    """
    Tracks expected signals that have gone silent (negative-space anomalies).
    """
    __tablename__ = "silence_anomalies"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Expected source
    transmitter_id = Column(Integer, ForeignKey("known_transmitters.id"), nullable=True, index=True)
    expected_source_name = Column(String, index=True)  # "ISS Transponder"
    expected_frequency_mhz = Column(Float)
    
    # Silence detection
    last_seen = Column(DateTime, index=True)
    silence_start = Column(DateTime, index=True)
    silence_duration_hours = Column(Float)
    
    # Analysis
    severity = Column(String, default="medium")  # low, medium, high
    explanation = Column(Text)  # "Possible equipment failure or orbital adjustment"
    is_resolved = Column(Boolean, default=False, index=True)
    resolved_at = Column(DateTime, nullable=True)
    
    detected_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    transmitter = relationship("KnownTransmitter", foreign_keys=[transmitter_id])


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)

