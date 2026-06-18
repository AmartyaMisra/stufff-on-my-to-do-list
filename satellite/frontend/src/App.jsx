import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Radar from "./components/Radar";
import SkyMap from "./components/SkyMap";
import Waterfall from "./components/Waterfall";
import Gauges from "./components/Gauges";
import FusionPanel from "./components/FusionPanel";
import ThreatIndicator from "./components/ThreatIndicator";
import SignalClassificationPanel from "./components/SignalClassificationPanel";
import RadioSpectrum from "./components/RadioSpectrum";

const API_BASE = "http://localhost:8000";

export default function App() {
  const [events, setEvents] = useState([]);
  const [threatStatus, setThreatStatus] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isHeartbeatEnabled, setIsHeartbeatEnabled] = useState(false); // DEMO MODE OFF - only real data
  const [selectedEventId, setSelectedEventId] = useState(null);

  // Fetch events from backend
  const loadEvents = useCallback(async () => {
    try {
      const r = await axios.get(`${API_BASE}/events?limit=100`);
      const mapped = (Array.isArray(r.data) ? r.data : []).map(e => {
        // "Smart" Score Mapping to 0-10+ scale
        let rawScore = e.confidence * 10;
        if (e.event_type === 'frb' && e.data?.snr) rawScore = e.data.snr;
        if (e.event_type === 'gw' && e.data?.snr) rawScore = e.data.snr;

        // Urgency Calculation (Master Prompt Formula)
        const urgency = Math.min(1, rawScore / 10);

        // Fallback Trigger Text
        const triggerReason = e.data?.anomaly_triggers?.[0]
          || e.data?.description
          || `Signal detected (${(e.confidence * 100).toFixed(0)}%)`;

        return {
          id: e.id,
          channel: e.event_type,
          score: rawScore,
          urgency: urgency,
          timestamp: e.timestamp,
          ra: e.ra || Math.random() * 360, // Fallback for pure viz
          dec: e.dec || (Math.random() * 180 - 90),
          trigger: triggerReason,
          fused: e.event_type === 'fusion' || !!e.data?.fused,
          payload: e.data // Keep payload for other components
        };
      });
      setEvents(mapped);
      setLastUpdate(new Date());
    } catch (e) {
      console.error("Fetch events error:", e);
    }
  }, []);

  // Fetch threat status
  const loadThreatStatus = useCallback(async () => {
    try {
      const r = await axios.get(`${API_BASE}/api/status`);
      setThreatStatus(r.data);
    } catch (e) {
      console.error("Fetch status error:", e);
    }
  }, []);

  // Trigger synthetic heartbeat
  const triggerHeartbeat = useCallback(async () => {
    if (!isHeartbeatEnabled) return;
    try {
      await axios.post(`${API_BASE}/api/heartbeat`);
    } catch (e) {
      // Heartbeat errors are non-critical
    }
  }, [isHeartbeatEnabled]);

  // Cleanup expired synthetic events
  const cleanupSynthetic = useCallback(async () => {
    try {
      await axios.post(`${API_BASE}/api/cleanup`);
    } catch (e) {
      // Cleanup errors are non-critical
    }
  }, []);

  // System Tick (Radio Monitor & Background Tasks)
  const triggerTick = useCallback(async () => {
    try {
      await axios.post(`${API_BASE}/api/tick`);
    } catch (e) {
      // Tick errors non-critical
    }
  }, []);

  // Initial load and polling
  useEffect(() => {
    loadEvents();
    loadThreatStatus();

    // Poll events every 5 seconds
    const eventsInterval = setInterval(loadEvents, 5000);

    // Poll threat status every 2 seconds
    const statusInterval = setInterval(loadThreatStatus, 2000);

    // Trigger heartbeat every 5 seconds for smooth scenario progression
    // The backend handles the pacing (0-60s cycle)
    const heartbeatInterval = setInterval(triggerHeartbeat, 5000);

    // Cleanup every 60 seconds
    const cleanupInterval = setInterval(cleanupSynthetic, 60000);

    // System Tick every 10 seconds (Radio Monitor)
    const tickInterval = setInterval(triggerTick, 10000);

    return () => {
      clearInterval(eventsInterval);
      clearInterval(statusInterval);
      clearInterval(heartbeatInterval);
      clearInterval(cleanupInterval);
      clearInterval(tickInterval);
    };
  }, [loadEvents, loadThreatStatus, triggerHeartbeat, cleanupSynthetic, triggerTick]);

  const formatLastUpdate = () => {
    if (!lastUpdate) return "...";
    const diff = Math.floor((new Date() - lastUpdate) / 1000);
    return `${diff}s ago`;
  };

  return (
    <div className="container">
      <header className="header">
        <div className="header-left">
          <h1 className="title">
            <span className="title-icon">🛸</span>
            SPACE ANOMALY RADAR
          </h1>
          <p className="sub">Multi-channel anomaly detection & fusion</p>
        </div>
        <div className="header-right">
          <div className="header-stats">
            <span className="stat-item">
              <span className="stat-label">Events:</span>
              <span className="stat-value">{events.length}</span>
            </span>
            <span className="stat-item">
              <span className="stat-label">Updated:</span>
              <span className="stat-value">{formatLastUpdate()}</span>
            </span>
          </div>
          <div
            className="mode-indicator"
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              letterSpacing: '1px',
              cursor: 'pointer',
              background: isHeartbeatEnabled ? 'rgba(255, 170, 0, 0.2)' : 'rgba(0, 255, 136, 0.2)',
              border: `2px solid ${isHeartbeatEnabled ? '#ffaa00' : '#00ff88'}`,
              color: isHeartbeatEnabled ? '#ffaa00' : '#00ff88'
            }}
            onClick={() => setIsHeartbeatEnabled(!isHeartbeatEnabled)}
            title={isHeartbeatEnabled ? "Demo Mode: Synthetic events enabled" : "Live Mode: Real data only"}
          >
            {isHeartbeatEnabled ? '🎭 DEMO MODE' : '📡 LIVE MODE'}
          </div>
        </div>
      </header>

      <div className="dashboard">
        <div className="col-left">
          <div className="panel panel-fixed threat-panel">
            <ThreatIndicator status={threatStatus} />
          </div>
          <div className="panel panel-fixed">
            <div className="panel-title">SYSTEM GAUGES</div>
            <div className="panel-content" style={{ padding: '10px' }}>
              <Gauges events={events} />
            </div>
          </div>
          <div className="panel panel-flex">
            <SignalClassificationPanel selectedEventId={selectedEventId} events={events} />
          </div>
        </div>

        <div className="col-center">
          <div className="radar-wrapper">
            <Radar
              events={events}
              threatState={threatStatus?.state || "QUIET"}
              onEventSelect={(e) => setSelectedEventId(e.id)}
            />
          </div>
        </div>

        <div className="col-right">
          <div className="panel panel-fixed" style={{ height: '320px' }}>
            <SkyMap events={events} selectedId={selectedEventId} />
          </div>

          {/* NEW: Radio Spectrum Panel */}
          <div className="panel panel-fixed" style={{ height: '140px', marginTop: '8px' }}>
            <RadioSpectrum events={events} />
          </div>

          <div className="panel panel-flex">
            <div className="panel-title">SPECTRAL WATERFALL</div>
            <div className="panel-content">
              <Waterfall events={events} />
            </div>
          </div>
        </div>
      </div>

      <footer className="footer">
        <span className="footer-status">
          System Status: <span className={`status-${(threatStatus?.state || "QUIET").toLowerCase()}`}>
            {threatStatus?.state || "INITIALIZING"}
          </span>
        </span>
        <span className="footer-time">
          UTC: {new Date().toISOString().slice(0, 19)}
        </span>
      </footer>
    </div>
  );
}
