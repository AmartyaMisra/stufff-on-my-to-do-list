-- Space Anomaly Radar Database Schema
-- This file contains the SQL schema for reference
-- The actual schema is managed by SQLAlchemy models

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ra FLOAT,
    dec FLOAT,
    data JSONB,
    confidence FLOAT DEFAULT 0.5,
    source VARCHAR(255)
);

CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_timestamp ON events(timestamp);
CREATE INDEX idx_events_ra_dec ON events(ra, dec);

-- Anomaly detections table
CREATE TABLE IF NOT EXISTS anomaly_detections (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    anomaly_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    details JSONB,
    confidence_score FLOAT
);

CREATE INDEX idx_anomalies_event_id ON anomaly_detections(event_id);
CREATE INDEX idx_anomalies_severity ON anomaly_detections(severity);
CREATE INDEX idx_anomalies_detected_at ON anomaly_detections(detected_at);

-- Fused events table
CREATE TABLE IF NOT EXISTS fused_events (
    id SERIAL PRIMARY KEY,
    fused_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confidence FLOAT NOT NULL,
    description TEXT,
    ra FLOAT,
    dec FLOAT
);

CREATE INDEX idx_fused_timestamp ON fused_events(fused_timestamp);

-- Association table for fused event components
CREATE TABLE IF NOT EXISTS fused_event_components (
    fused_event_id INTEGER REFERENCES fused_events(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    PRIMARY KEY (fused_event_id, event_id)
);

